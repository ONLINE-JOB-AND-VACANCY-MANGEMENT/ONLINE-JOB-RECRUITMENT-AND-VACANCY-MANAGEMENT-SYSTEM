<?php

namespace App\Services;

use App\Models\JobRequisition;
use Illuminate\Support\Facades\Auth;

class RequisitionService
{
    public function create(array $data): JobRequisition
    {
        return JobRequisition::create([
            ...$data,
            'requested_by' => Auth::id(),
            'status' => 'draft',
        ]);
    }

    public function update(JobRequisition $requisition, array $data): JobRequisition
    {
        if ($requisition->status !== 'draft') {
            throw new \Exception('Only draft requisitions can be edited.');
        }

        $requisition->update($data);
        return $requisition;
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