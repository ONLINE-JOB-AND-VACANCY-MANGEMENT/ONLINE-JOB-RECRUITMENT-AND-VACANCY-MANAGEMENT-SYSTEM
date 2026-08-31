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
    return new JobResource($job->load(['category', 'skills', 'postedBy']));
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
    if ($job->posted_by !== auth()->id() && auth()->user()->role?->name !== 'admin') {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    if ($job->applications()->count() > 0) {
        return response()->json(['message' => 'Cannot delete a job that already has applicants.'], 409);
    }

    $this->jobService->delete($job);
    return response()->json(['message' => 'Job deleted successfully']);
}
    public function internalIndex(Request $request)
{
    if ($request->user()->role?->name === 'job_seeker') {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    $jobs = $this->jobService->listInternal($request->all());
    return JobResource::collection($jobs);
}
    public function update(UpdateJobRequest $request, Job $job)
    {
        $job = $this->jobService->update($job, $request->validated());
        return response()->json(['message' => 'Job updated successfully', 'job' => new JobResource($job)]);
    }
}