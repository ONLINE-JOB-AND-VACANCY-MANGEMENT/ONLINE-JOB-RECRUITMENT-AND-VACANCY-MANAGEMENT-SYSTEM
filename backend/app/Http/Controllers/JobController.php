<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJobRequest;
use App\Http\Requests\UpdateJobRequest;
use App\Http\Resources\JobResource;
use App\Models\Job;
use App\Models\Application;
use App\Models\Skill;
use App\Models\User;
use App\Services\JobService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function __construct(protected JobService $jobService) {}

    public function index(Request $request)
    {
        $jobs = $this->jobService->list($request->all());
        return JobResource::collection($jobs);
    }

    public function show(Job $job)
    {
        if ($job->status === 'open' && $job->end_date && $job->end_date->isBefore(today())) {
            $job->update(['status' => 'closed']);
        }

        // Same lazy-loading class of bug as the /bookmarks 500: a logged-in job
        // seeker viewing a job's detail page hits JobResource's is_bookmarked check,
        // which reads $this->bookmarks — never loaded here, so it threw under
        // Model::preventLazyLoading(). Hadn't been reported yet, but was real.
        return new JobResource($job->load(['jobTitle.department.mainCategory', 'skills', 'bookmarks']));
    }

    public function store(StoreJobRequest $request)
    {
        try {
            $job = $this->jobService->create($request->validated());
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Job posted successfully', 'job' => new JobResource($job)], 201);
    }

    public function destroy(Job $job)
    {
        // Single-organization system: any HR (employer) account or admin manages any
        // job, regardless of who originally posted it.
        if (!in_array(auth()->user()->role?->name, ['employer', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($job->applications()->count() > 0) {
            return response()->json(['message' => 'Cannot delete a job that already has applicants.'], 409);
        }

        $this->jobService->delete($job);
        return response()->json(['message' => 'Job deleted successfully']);
    }

    // Staff-only management listing — every job regardless of status. Kept at the
    // same /internal-jobs URL as before to avoid a frontend route change, even though
    // "internal" no longer means anything now that visibility is gone.
    public function manageIndex(Request $request)
    {
        if ($request->user()->role?->name === 'job_seeker') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $jobs = $this->jobService->listForManagement($request->all());
        return JobResource::collection($jobs);
    }

    public function analytics(Request $request)
        {
            if ($request->user()->role?->name !== 'employer') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $jobs = Job::with(['jobTitle.department.mainCategory', 'skills'])->withCount('applications')->get();
            $applications = Application::with('job')->get();
            $skills = $jobs->flatMap->skills->groupBy('id')->map(fn ($items) => [
                'name' => $items->first()->name,
                'count' => $items->count(),
            ])->sortByDesc('count')->values();
            $departmentCounts = $jobs->groupBy(fn ($job) => $job->jobTitle?->department?->name ?? 'Unassigned')
                ->map->count()
                ->reject(fn ($count, $name) => stripos($name, 'Test Department ') === 0);
            $categoryCounts = $jobs->groupBy(fn ($job) => $job->jobTitle?->department?->mainCategory?->name ?? 'Unassigned')
                ->map->count()
                ->reject(fn ($count, $name) => stripos($name, 'Test Main Category ') === 0);
            $aggregateSmallGroups = static function ($counts) {
                $top = $counts->filter(fn ($count) => $count > 1)->sortDesc()->take(8);
                $other = $counts->reject(fn ($count) => $count > 1)
                    ->sum() + $counts->sortDesc()->slice(8)->sum();

                return $other > 0 ? $top->put('Other', $other) : $top;
            };
            $departmentCounts = $aggregateSmallGroups($departmentCounts);
            $categoryCounts = $aggregateSmallGroups($categoryCounts);
            $skillCounts = $skills->filter(fn ($skill) => $skill['count'] > 1)
                ->sortByDesc('count')->take(8)->values();
            $skillNames = $skillCounts->pluck('name');
            $otherSkills = $skills->reject(fn ($skill) => $skillNames->contains($skill['name']))->sum('count');
            if ($otherSkills > 0) {
                $skillCounts->push(['name' => 'Other', 'count' => $otherSkills]);
            }
            $applicationsByVacancy = $jobs->map(fn ($job) => [
                'title' => $job->title,
                'count' => $job->applications_count,
            ]);
            $vacancyCounts = $applicationsByVacancy->filter(fn ($item) => $item['count'] > 1)
                ->sortByDesc('count')->take(8)->values();
            $vacancyTitles = $vacancyCounts->pluck('title');
            $otherVacancies = $applicationsByVacancy->reject(fn ($item) => $vacancyTitles->contains($item['title']))->sum('count');
            if ($otherVacancies > 0) {
                $vacancyCounts->push(['title' => 'Other', 'count' => $otherVacancies]);
            }
            $hired = $applications->where('status', 'hired');
            $hiringDays = $hired->map(function ($application) {
                return $application->job?->published_at
                    ? $application->job->published_at->diffInDays($application->updated_at)
                    : null;
            })->filter();
            $monthly = collect(range(5, 0))->map(function ($monthsAgo) {
                $month = Carbon::now()->subMonths($monthsAgo);
                return [
                    'month' => $month->format('Y-m'),
                    'registrations' => User::whereBetween('created_at', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()])->count(),
                    'applications' => Application::whereBetween('created_at', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()])->count(),
                ];
            });

            return response()->json([
                'applications_per_vacancy' => $vacancyCounts,
                'most_requested_skills' => $skillCounts,
                'average_days_to_hire' => $hiringDays->isEmpty() ? null : round($hiringDays->average(), 1),
                'application_conversion_rate' => $applications->isEmpty() ? 0 : round(($hired->count() / $applications->count()) * 100, 1),
                'jobs_by_department' => $departmentCounts->map(fn ($count, $name) => ['name' => $name, 'count' => $count])->values(),
                'jobs_by_category' => $categoryCounts->map(fn ($count, $name) => ['name' => $name, 'count' => $count])->values(),
                'monthly_trends' => $monthly,
            ]);
        }

    public function update(UpdateJobRequest $request, Job $job)
    {
        $job = $this->jobService->update($job, $request->validated());
        return response()->json(['message' => 'Job updated successfully', 'job' => new JobResource($job)]);
    }
}
