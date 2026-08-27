<?php

namespace App\Services;

use App\Models\Job;
use Illuminate\Support\Facades\Auth;

class JobService
{
    public function list(array $filters)
    {
        $query = Job::query()->with(['category', 'skills'])->withCount('applications');

        if (!empty($filters['search'])) {
            $query->where('title', 'like', '%' . $filters['search'] . '%');
        }
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (!empty($filters['location'])) {
            $query->where('location', 'like', '%' . $filters['location'] . '%');
        }
        if (!empty($filters['job_type'])) {
            $query->where('job_type', $filters['job_type']);
        }
        if (!empty($filters['experience_level'])) {
            $query->where('experience_level', $filters['experience_level']);
        }
        if (!empty($filters['salary_min'])) {
            $query->where('salary_max', '>=', $filters['salary_min']);
        }

        $query->where('status', 'open');
        $query->where('visibility', 'public');

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }
  public function listInternal(array $filters)
{
    $query = Job::query()->with(['category', 'skills'])->withCount('applications');

    if (!empty($filters['search'])) {
        $query->where('title', 'like', '%' . $filters['search'] . '%');
    }
    if (!empty($filters['category_id'])) {
        $query->where('category_id', $filters['category_id']);
    }

    $query->where('status', 'open');
    // No visibility filter — internal staff see both internal AND public jobs

    return $query->latest()->paginate($filters['per_page'] ?? 15);
}
public function create(array $data): Job
{
    $requisition = \App\Models\JobRequisition::findOrFail($data['requisition_id']);

    if ($requisition->status !== 'ready_to_post') {
        throw new \Exception('Only requisitions marked ready-to-post can be turned into a job posting.');
    }

    if ($requisition->jobPosting()->exists()) {
        throw new \Exception('This requisition already has a job posting.');
    }

    $data['status'] = $data['status'] ?? 'open';
    $data['visibility'] = 'internal';
    $data['published_at'] = now();
    $data['posted_by'] = \Illuminate\Support\Facades\Auth::id();
    $data['category_id'] = $requisition->category_id;

    $job = \App\Models\Job::create($data);

    if (!empty($data['skills'])) {
        $job->skills()->sync($data['skills']);
    }

    return $job->load(['category', 'skills', 'requisition']);
} 

    public function update(Job $job, array $data): Job
    {
        $job->update($data);

        if (array_key_exists('skills', $data)) {
            $job->skills()->sync($data['skills'] ?? []);
        }

        return $job->load(['category', 'skills']);
    }

    public function delete(Job $job): void
    {
        $job->delete();
    }
}