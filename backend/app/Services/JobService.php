<?php

namespace App\Services;

use App\Models\Job;
use App\Models\JobRequisition;
use App\Models\JobTitle;
use Illuminate\Support\Facades\Auth;

class JobService
{
    public function list(array $filters)
    {
        $this->closeExpiredJobs();
        $query = Job::query()->with(['jobTitle.department.mainCategory', 'skills', 'postedBy', 'bookmarks'])->withCount('applications');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhereHas('jobTitle', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('jobTitle.department', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('company', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('skills', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('experience_level', 'like', "%{$search}%");
            });
        }
        $this->applyDetailedFilters($query, $filters);
        if (!empty($filters['department_id'])) {
            $query->whereHas('jobTitle', fn ($q) => $q->where('department_id', $filters['department_id']));
        }
        if (!empty($filters['main_category_id'])) {
            $query->whereHas('jobTitle.department', fn ($q) => $q->where('main_category_id', $filters['main_category_id']));
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

        // No more visibility filter — every job is public. Job seekers only ever see open ones.
        $query->where('status', 'open');

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

    // Staff management listing: every job regardless of status, since there's no more
    // internal/public split to distinguish "staff view" from "public view" by.
    public function listForManagement(array $filters)
    {
        $this->closeExpiredJobs();
        $query = Job::query()->with(['jobTitle.department.mainCategory', 'skills', 'postedBy'])->withCount('applications');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhereHas('jobTitle', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('jobTitle.department', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('company', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('skills', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('experience_level', 'like', "%{$search}%");
            });
        }
        $this->applyDetailedFilters($query, $filters);
        if (!empty($filters['department_id'])) {
            $query->whereHas('jobTitle', fn ($q) => $q->where('department_id', $filters['department_id']));
        }
        if (!empty($filters['main_category_id'])) {
            $query->whereHas('jobTitle.department', fn ($q) => $q->where('main_category_id', $filters['main_category_id']));
        }
        if (!empty($filters['job_title_id'])) {
            $query->where('job_title_id', $filters['job_title_id']);
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): Job
    {
        if (!empty($data['requisition_id'])) {
            $requisition = JobRequisition::findOrFail($data['requisition_id']);

            if ($requisition->status !== 'ready_to_post') {
                throw new \Exception('Only requisitions marked ready-to-post can be turned into a job posting.');
            }
            if ($requisition->jobPosting()->exists()) {
                throw new \Exception('This requisition already has a job posting.');
            }

            // Inherit everything the requisition already defines (including any HR
            // overrides already applied via updateHrFields). HR only supplies title/
            // description/workplace_type/experience_level, which the requisition
            // doesn't capture.
            $data['job_title_id'] = $requisition->job_title_id;
            $data['job_type'] = $data['job_type'] ?? $requisition->job_type;
            $data['requirements'] = $data['requirements'] ?? $requisition->requirements;
            $data['salary'] = $data['salary'] ?? $requisition->salary_min ?? $requisition->salary_max;
            $data['start_date'] = $data['start_date'] ?? $requisition->start_date;
            $data['end_date'] = $data['end_date'] ?? $requisition->end_date;
            $skillIds = $data['skills'] ?? $requisition->skills()->pluck('skills.id')->all();
        } else {
            $skillIds = $data['skills'] ?? [];
        }

        $jobTitle = JobTitle::findOrFail($data['job_title_id']);
        $experience = $data['experience_level'] ?? 'entry';
        $salary = $jobTitle->salary;
        if ($salary === null) {
            $salary = (($jobTitle->salary_ranges ?? [])[$experience] ?? null);
            if (is_array($salary)) {
                $salary = $salary['amount'] ?? $salary['min'] ?? $salary['max'] ?? null;
            }
        }

        // The catalog is the source of truth for the title. Description,
        // requirements and salary are defaults, while HR may edit them on the
        // posting form before publishing.
        $data['title'] = $jobTitle->name;
        if (!array_key_exists('description', $data) || $data['description'] === null || trim((string) $data['description']) === '') {
            $data['description'] = $jobTitle->description ?? '';
        }
        if (!array_key_exists('requirements', $data) || $data['requirements'] === null || trim((string) $data['requirements']) === '') {
            $data['requirements'] = $jobTitle->requirements;
        }
        $data['salary'] = $data['salary'] ?? $salary;
        $data['salary_min'] = $data['salary_min'] ?? $data['salary'];
        $data['salary_max'] = $data['salary_max'] ?? $data['salary'];

        $data['status'] = $data['status'] ?? 'open';
        $data['published_at'] = now();
        $data['posted_by'] = Auth::id();

        unset($data['skills']);

        $job = Job::create($data);

        if (!empty($skillIds)) {
            $job->skills()->sync($skillIds);
        }

        // $with on the Job model doesn't retroactively apply to an instance built via
        // create() in this same request (Eloquent only applies it when a *new query*
        // is run), so this still needs to be explicit — same reason
        // AuthService::register() explicitly loads 'role' after User::create().
        return $job->load(['jobTitle.department.mainCategory', 'skills', 'postedBy', 'bookmarks', 'requisition']);
    }

    public function update(Job $job, array $data): Job
    {
        $job->update(collect($data)->except('skills')->all());

        if (array_key_exists('skills', $data)) {
            $job->skills()->sync($data['skills'] ?? []);
        }

        return $job->load(['jobTitle.department.mainCategory', 'skills', 'postedBy', 'bookmarks']);
    }

    public function delete(Job $job): void
    {
        $job->delete();
    }

    public function closeExpiredJobs(): int
    {
        return Job::where('status', 'open')
            ->whereDate('end_date', '<', today())
            ->update(['status' => 'closed']);
    }

    private function applyDetailedFilters($query, array $filters): void
    {
        if (!empty($filters['title'])) {
            $query->where('title', 'like', '%' . $filters['title'] . '%');
        }
        if (!empty($filters['department'])) {
            $query->whereHas('jobTitle.department', fn ($q) => $q->where('name', 'like', '%' . $filters['department'] . '%'));
        }
        if (!empty($filters['company'])) {
            $query->whereHas('company', fn ($q) => $q->where('name', 'like', '%' . $filters['company'] . '%'));
        }
        if (!empty($filters['location'])) {
            $query->where('location', 'like', '%' . $filters['location'] . '%');
        }
        if (!empty($filters['skill'])) {
            $query->whereHas('skills', fn ($q) => $q->where('name', 'like', '%' . $filters['skill'] . '%'));
        }
        if (!empty($filters['experience'])) {
            $query->where('experience_level', $filters['experience']);
        }
    }
}
