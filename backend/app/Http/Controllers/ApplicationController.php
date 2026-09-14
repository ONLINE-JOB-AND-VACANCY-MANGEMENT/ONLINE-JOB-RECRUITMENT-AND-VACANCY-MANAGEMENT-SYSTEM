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

    // Per-job CSV export — name, contact info, status, cover letter, resume filename,
    // exam/interview scheduling, and the job's title/department/main category.
    public function exportApplicants(Request $request, Job $job)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $applications = $job->applications()->with(['user', 'resume', 'exam', 'interview'])->get();
        $job->load('jobTitle.department.mainCategory');

        $filename = 'applicants-job-' . $job->id . '-' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $columns = [
            'Name', 'Email', 'Phone', 'Status', 'Applied At', 'Cover Letter',
            'Resume File', 'Exam Scheduled At', 'Interview Scheduled At',
            'Job Title', 'Department', 'Main Category',
        ];

        $callback = function () use ($applications, $columns, $job) {
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
                    $job->jobTitle?->name,
                    $job->jobTitle?->department?->name,
                    $job->jobTitle?->department?->mainCategory?->name,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // One-time whole-portal CSV export — every applicant across every job in a single
    // file, each row carrying its own job title/department/main category.
    public function exportAllApplicants(Request $request)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $applications = Application::with([
            'user', 'resume', 'exam', 'interview',
            'job.jobTitle.department.mainCategory',
        ])->latest()->get();

        $filename = 'all-applicants-' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $columns = [
            'Name', 'Email', 'Phone', 'Job Title', 'Department', 'Main Category',
            'Status', 'Applied At', 'Cover Letter', 'Resume File',
            'Exam Scheduled At', 'Interview Scheduled At',
        ];

        $callback = function () use ($applications, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($applications as $application) {
                $job = $application->job;

                fputcsv($file, [
                    $application->user?->name,
                    $application->user?->email,
                    $application->user?->phone,
                    $job?->title,
                    $job?->jobTitle?->department?->name,
                    $job?->jobTitle?->department?->mainCategory?->name,
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

        try {
            $application = $this->applicationService->updateStatus($application, $request->status);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Status updated', 'application' => new ApplicationResource($application)]);
    }

    public function scheduleExam(Request $request, Application $application)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate(['scheduled_at' => 'required|date', 'location' => 'nullable|string', 'mode' => 'nullable|in:onsite,online']);

        try {
            $application = $this->applicationService->scheduleExam($application, $data);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Exam scheduled', 'application' => new ApplicationResource($application)]);
    }

    public function scheduleInterview(Request $request, Application $application)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate(['scheduled_at' => 'required|date', 'location' => 'nullable|string', 'mode' => 'nullable|in:onsite,online']);

        try {
            $application = $this->applicationService->scheduleInterview($application, $data);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Interview scheduled', 'application' => new ApplicationResource($application)]);
    }
}
