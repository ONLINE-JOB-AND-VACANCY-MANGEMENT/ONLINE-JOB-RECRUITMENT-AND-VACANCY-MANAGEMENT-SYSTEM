<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJobRequest;
use App\Http\Requests\UpdateJobRequest;
use App\Http\Resources\JobResource;
use App\Models\Job;
use App\Services\JobService;
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

    public function update(UpdateJobRequest $request, Job $job)
    {
        $job = $this->jobService->update($job, $request->validated());
        return response()->json(['message' => 'Job updated successfully', 'job' => new JobResource($job)]);
    }
}
