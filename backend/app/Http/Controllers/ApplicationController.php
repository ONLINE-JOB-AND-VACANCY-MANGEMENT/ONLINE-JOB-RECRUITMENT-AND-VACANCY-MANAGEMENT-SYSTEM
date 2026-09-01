<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApplicationRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Models\Job;
use App\Services\ApplicationService;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function __construct(protected ApplicationService $applicationService) {}

    public function store(StoreApplicationRequest $request, Job $job)
    {
        try {
            $application = $this->applicationService->apply(
                $job,
                $request->validated(),
                $request->file('resume')
            );
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json([
            'message' => 'Application submitted successfully',
            'application' => new ApplicationResource($application),
        ], 201);
    }

    public function jobApplicants(Request $request, Job $job)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $applications = $this->applicationService->listForJob($job);
        return ApplicationResource::collection($applications);
    }

    public function myApplications(Request $request)
    {
        $applications = $this->applicationService->listForJobSeeker($request->user()->id);
        return ApplicationResource::collection($applications);
    }

    public function updateStatus(Request $request, Application $application)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate(['status' => 'required|in:applied,shortlisted,hired,rejected']);

        $application = $this->applicationService->updateStatus($application, $request->status);

        return response()->json(['message' => 'Status updated', 'application' => new ApplicationResource($application)]);
    }

    public function scheduleExam(Request $request, Application $application)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate(['scheduled_at' => 'required|date', 'location' => 'nullable|string', 'mode' => 'nullable|in:onsite,online']);
        $application = $this->applicationService->scheduleExam($application, $data);
        return response()->json(['message' => 'Exam scheduled', 'application' => new ApplicationResource($application)]);
    }

    public function scheduleInterview(Request $request, Application $application)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate(['scheduled_at' => 'required|date', 'location' => 'nullable|string', 'mode' => 'nullable|in:onsite,online']);
        $application = $this->applicationService->scheduleInterview($application, $data);
        return response()->json(['message' => 'Interview scheduled', 'application' => new ApplicationResource($application)]);
    }
}