<?php

namespace App\Services;

use App\Models\Job;
use Illuminate\Support\Facades\Auth;

class JobService
{
    public function list(array $filters)
    {
        $query = Job::query()->with(['company', 'category', 'skills'])->withCount('applications');

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

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

public function create(array $data): Job
{
    $user = Auth::user();
    $companyId = $user->role?->name === 'admin' ? $data['company_id'] : $user->company->id;

    $data['status'] = $data['status'] ?? 'open';

    $job = \App\Models\Company::find($companyId)->jobs()->create($data);

    if (!empty($data['skills'])) {
        $job->skills()->sync($data['skills']);
    }

    return $job->load(['company', 'category', 'skills']);
}
    public function update(Job $job, array $data): Job
    {
        $job->update($data);

        if (array_key_exists('skills', $data)) {
            $job->skills()->sync($data['skills'] ?? []);
        }

        return $job->load(['company', 'category', 'skills']);
    }

    public function delete(Job $job): void
    {
        $job->delete();
    }
}