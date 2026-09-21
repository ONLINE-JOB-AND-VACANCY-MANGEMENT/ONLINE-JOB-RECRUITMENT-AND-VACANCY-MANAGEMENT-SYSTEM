<?php

namespace App\Services;

use App\Models\JobRequisition;
use Illuminate\Support\Facades\Auth;

class RequisitionService
{
    public function create(array $data): JobRequisition
    {
        if (array_key_exists('salary', $data)) {
            $data['salary_min'] = $data['salary'];
            $data['salary_max'] = $data['salary'];
        }
        $skillIds = $data['skills'] ?? [];
        unset($data['skills']);

        $requisition = JobRequisition::create([
            ...$data,
            'requested_by' => Auth::id(),
            'status' => 'draft',
        ]);

        if (!empty($skillIds)) {
            $requisition->skills()->sync($skillIds);
        }

        return $requisition->load(['jobTitle.department.mainCategory', 'skills']);
    }

    public function update(JobRequisition $requisition, array $data): JobRequisition
    {
        if ($requisition->status !== 'draft') {
            throw new \Exception('Only draft requisitions can be edited.');
        }

        $skillIds = array_key_exists('skills', $data) ? $data['skills'] : null;
        unset($data['skills']);

        if (array_key_exists('salary', $data)) {
            $data['salary_min'] = $data['salary'];
            $data['salary_max'] = $data['salary'];
        }
        $requisition->update($data);

        if ($skillIds !== null) {
            $requisition->skills()->sync($skillIds);
        }

        return $requisition->load(['jobTitle.department.mainCategory', 'skills']);
    }

    // HR-only: narrow edit of salary range + application window. The manager owns
    // everything else about the requisition (job title, requirements, skills, job
    // type, justification) — HR can only adjust the fields directly tied to their role.
    public function updateHrFields(JobRequisition $requisition, array $data): JobRequisition
    {
        if (!in_array($requisition->status, ['approved', 'ready_to_post'])) {
            throw new \Exception('Salary and dates can only be adjusted on an approved requisition.');
        }

        // Posting a job from a requisition doesn't change the requisition's status
        // away from 'ready_to_post', so without this check HR could keep editing
        // salary/dates here indefinitely even after the job is already live and
        // publicly visible with the original values baked in — silently diverging
        // from what applicants actually see.
        if ($requisition->jobPosting()->exists()) {
            throw new \Exception('This requisition has already been posted as a public job — salary and dates can no longer be edited here.');
        }

        if (array_key_exists('salary', $data)) {
            $data['salary_min'] = $data['salary'];
            $data['salary_max'] = $data['salary'];
        }
        $requisition->update($data);

        return $requisition->load(['jobTitle.department.mainCategory', 'skills']);
    }

    public function submit(JobRequisition $requisition): JobRequisition
    {
        if ($requisition->status !== 'draft') {
            throw new \Exception('Only draft requisitions can be submitted for approval.');
        }

        $requisition->update(['status' => 'pending_approval']);
        return $requisition;
    }

    public function approve(JobRequisition $requisition): JobRequisition
    {
        if ($requisition->status !== 'pending_approval') {
            throw new \Exception('Only pending requisitions can be approved.');
        }

        $requisition->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);
        return $requisition;
    }

    public function reject(JobRequisition $requisition, string $reason): JobRequisition
    {
        if ($requisition->status !== 'pending_approval') {
            throw new \Exception('Only pending requisitions can be rejected.');
        }

        $requisition->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);
        return $requisition;
    }

    public function markReadyToPost(JobRequisition $requisition): JobRequisition
    {
        if ($requisition->status !== 'approved') {
            throw new \Exception('Only approved requisitions can be marked ready to post.');
        }

        $requisition->update(['status' => 'ready_to_post']);
        return $requisition;
    }
}
