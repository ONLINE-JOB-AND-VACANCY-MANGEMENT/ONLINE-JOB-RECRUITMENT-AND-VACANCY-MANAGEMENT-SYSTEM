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

    // CSV export of every applicant for a job — name, contact info, status, cover
    // letter, resume filename, and exam/interview scheduling if present.
    public function exportApplicants(Request $request, Job $job)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $applications = $job->applications()->with(['user', 'resume', 'exam', 'interview'])->get();

        $filename = 'applicants-job-' . $job->id . '-' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $columns = [
            'Name', 'Email', 'Phone', 'Status', 'Applied At', 'Cover Letter',
            'Resume File', 'Exam Scheduled At', 'Interview Scheduled At',
        ];

        $callback = function () use ($applications, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($applications as $application) {
                fputcsv($file, [
                    $application->user?->name,
                    $application->user?->email,
                    $application->user?->phone,
                    $application->status,
                    optional($application->created_at)->format('Y-m-d H:i'),
                    $application->cover_letter,
                    $application->resume?->original_name,
                    optional($application->exam?->scheduled_at)->format('Y-m-d H:i'),
                    optional($application->interview?->scheduled_at)->format('Y-m-d H:i'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
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
