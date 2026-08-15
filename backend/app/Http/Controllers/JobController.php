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
        return new JobResource($job->load(['company', 'category', 'skills']));
    }

    public function store(StoreJobRequest $request)
    {
        $job = $this->jobService->create($request->validated());
        return response()->json(['message' => 'Job posted successfully', 'job' => new JobResource($job)], 201);
    }

    public function update(UpdateJobRequest $request, Job $job)
    {
        $job = $this->jobService->update($job, $request->validated());
        return response()->json(['message' => 'Job updated successfully', 'job' => new JobResource($job)]);
    }

    public function destroy(Job $job)
    {
        if (!$job->company || $job->company_id !== auth()->user()->company?->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $this->jobService->delete($job);
        return response()->json(['message' => 'Job deleted successfully']);
    }
}