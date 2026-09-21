<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\RequestDocumentsRequest;
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
        if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $applications = $this->applicationService->listForJob($job, $request);
        return ApplicationResource::collection($applications);
    }

    public function show(Request $request, Application $application)
    {
        if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return new ApplicationResource($application->load([
            'user.certificates', 'job.jobTitle.department.mainCategory', 'resume',
            'exam', 'interview', 'documentRequest',
        ]));
    }

    // Per-job CSV export — name, contact info, status, cover letter, resume filename,
    // exam/interview scheduling, and the job's title/department/main category.
    public function exportApplicants(Request $request, Job $job)
    {
        if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = $job->applications()->with(['user.certificates', 'resume', 'exam', 'interview']);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('applicant_id')) $query->whereHas('user', fn ($q) => $q->where('applicant_id', $request->applicant_id));
        if ($request->filled('graduation_university')) $query->whereHas('user', fn ($q) => $q->where('graduation_university', 'like', '%'.$request->graduation_university.'%'));
        if ($request->filled('cgpa_min')) $query->whereHas('user', fn ($q) => $q->where('cgpa', '>=', $request->cgpa_min));
        if ($request->filled('main_category_id')) $query->whereHas('job.jobTitle.department', fn ($q) => $q->where('main_category_id', $request->main_category_id));
        if ($request->filled('department_id')) $query->whereHas('job.jobTitle', fn ($q) => $q->where('department_id', $request->department_id));
        if ($request->filled('job_title_id')) $query->whereHas('job', fn ($q) => $q->where('job_title_id', $request->job_title_id));
        $applications = $query->get()->filter(function ($application) use ($request) {
            return (!$request->filled('semi_point_min') || ($application->semi_point !== null && $application->semi_point >= $request->semi_point_min))
                && (!$request->filled('final_point_min') || ($application->final_point !== null && $application->final_point >= $request->final_point_min));
        })->values();
        $job->load('jobTitle.department.mainCategory');

        $filename = 'applicants-job-' . $job->id . '-' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $columns = [
            'Applicant ID', 'Name', 'First Name', 'Middle Name', 'Last Name', 'Email', 'Phone', 'Address',
            'CGPA', 'Graduation University', 'Previously Worked At', 'Bio', 'Skills', 'Certificates',
            'Status', 'Applied At', 'Cover Letter',
            'Resume File', 'Exam Result', 'Interview Result', 'Semi Point', 'Final Point', 'Exam Scheduled At', 'Interview Scheduled At',
            'Job Title', 'Department', 'Main Category',
        ];

        $callback = function () use ($applications, $columns, $job) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            $value = fn ($value) => filled($value) ? $value : 'N/A';

            foreach ($applications as $application) {
                $user = $application->user;
                fputcsv($file, [
                    $value($user?->applicant_id), $value($user?->name), $value($user?->first_name), $value($user?->middle_name),
                    $value($user?->last_name), $value($user?->email), $value($user?->phone),
                    $value($user?->address), $value($user?->cgpa), $value($user?->graduation_university),
                    $value($user?->worked_company), $value($user?->bio), $value($user?->skills),
                    $value($user?->certificates?->pluck('title')->implode('; ')),
                    $application->status,
                    optional($application->created_at)->format('Y-m-d H:i'),
                    $application->cover_letter,
                    $application->resume?->original_name, $application->exam?->score, $application->interview?->result,
                    $application->semi_point, $application->final_point,
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
        if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = Job::with([
            'jobTitle.department.mainCategory',
            'applications.user.certificates', 'applications.resume',
            'applications.exam', 'applications.interview',
        ]);
        if ($request->filled('main_category_id')) $query->whereHas('jobTitle.department', fn ($q) => $q->where('main_category_id', $request->main_category_id));
        if ($request->filled('department_id')) $query->whereHas('jobTitle', fn ($q) => $q->where('department_id', $request->department_id));
        if ($request->filled('job_title_id')) $query->where('job_title_id', $request->job_title_id);
        if ($request->filled('status')) $query->whereHas('applications', fn ($q) => $q->where('status', $request->status));
        $jobs = $query->latest()->get();
        $applications = $jobs->flatMap(fn ($job) => $job->applications->map(fn ($application) => $application->setRelation('job', $job)));
        $applications = $applications->filter(function ($application) use ($request) {
            return (!$request->filled('status') || $application->status === $request->status)
                && (!$request->filled('applicant_id') || (string) $application->user?->applicant_id === (string) $request->applicant_id)
                && (!$request->filled('graduation_university') || str_contains(strtolower((string) $application->user?->graduation_university), strtolower($request->graduation_university)))
                && (!$request->filled('cgpa_min') || ($application->user?->cgpa !== null && $application->user->cgpa >= $request->cgpa_min))
                && (!$request->filled('semi_point_min') || ($application->semi_point !== null && $application->semi_point >= $request->semi_point_min))
                && (!$request->filled('final_point_min') || ($application->final_point !== null && $application->final_point >= $request->final_point_min));
        })->values();
        $includeEmptyJobs = !$request->filled('status') && !$request->filled('applicant_id')
            && !$request->filled('graduation_university') && !$request->filled('cgpa_min')
            && !$request->filled('semi_point_min') && !$request->filled('final_point_min');
        $jobs = $jobs->filter(fn ($job) => ($includeEmptyJobs && $job->applications->isEmpty()) || $job->applications->intersect($applications)->isNotEmpty())->values();

        $filename = 'all-applicants-' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $columns = [
            'Applicant ID', 'Name', 'First Name', 'Middle Name', 'Last Name', 'Email', 'Phone', 'Address',
            'CGPA', 'Graduation University', 'Previously Worked At', 'Bio', 'Skills', 'Certificates',
            'Job Title', 'Department', 'Main Category',
            'Status', 'Applied At', 'Cover Letter', 'Resume File',
            'Exam Result', 'Interview Result', 'Semi Point', 'Final Point', 'Exam Scheduled At', 'Interview Scheduled At',
        ];

        $callback = function () use ($jobs, $applications, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            $value = fn ($value) => filled($value) ? $value : 'N/A';

            foreach ($jobs as $job) {
                $jobApplications = $job->applications->intersect($applications);
                foreach ($jobApplications->isEmpty() ? [null] : $jobApplications as $application) {
                $user = $application?->user;

                fputcsv($file, [
                    $value($user?->applicant_id), $value($user?->name), $value($user?->first_name), $value($user?->middle_name),
                    $value($user?->last_name), $value($user?->email), $value($user?->phone),
                    $value($user?->address), $value($user?->cgpa), $value($user?->graduation_university),
                    $value($user?->worked_company), $value($user?->bio), $value($user?->skills),
                    $value($user?->certificates?->pluck('title')->implode('; ')),
                    $job?->title,
                    $job?->jobTitle?->department?->name,
                    $job?->jobTitle?->department?->mainCategory?->name,
                    $value($application?->status),
                    optional($application?->created_at)->format('Y-m-d H:i') ?: 'N/A',
                    $value($application?->cover_letter),
                    $value($application?->resume?->original_name), $value($application?->exam?->score), $value($application?->interview?->result),
                    $value($application?->semi_point), $value($application?->final_point),
                    optional($application?->exam?->scheduled_at)->format('Y-m-d H:i') ?: 'N/A',
                    optional($application?->interview?->scheduled_at)->format('Y-m-d H:i') ?: 'N/A',
                ]);
                }
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
        if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate(['status' => 'required|in:applied,shortlisted,exam_scheduled,interview_scheduled,reserved,documentation_requested,hired,rejected']);

        try {
            $application = $this->applicationService->updateStatus($application, $request->status);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
        return response()->json(['message' => 'Status updated', 'application' => new ApplicationResource($application)]);
    }

    public function bulkStatus(Request $request)
    {
        if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) return response()->json(['message' => 'Forbidden'], 403);
        $data = $request->validate([
            'application_ids' => ['required', 'array', 'min:1'],
            'application_ids.*' => ['integer', 'distinct', 'exists:applications,id'],
            'status' => ['required', 'in:applied,shortlisted,exam_scheduled,interview_scheduled,reserved,documentation_requested,hired,rejected'],
        ]);
        try {
            $applications = $this->applicationService->bulkUpdateStatus($data['application_ids'], $data['status']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
        return response()->json(['message' => count($applications).' application(s) updated', 'applications' => ApplicationResource::collection($applications)]);
    }

    public function importResults(Request $request)
    {
        if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) return response()->json(['message' => 'Forbidden'], 403);
        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:10240']]);
        try {
            $count = $this->applicationService->importResults($request->file('file'));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
        return response()->json(['message' => 'Results imported', 'updated' => $count]);
    }

        public function requestDocuments(RequestDocumentsRequest $request, Application $application)
        {
            if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) return response()->json(['message' => 'Forbidden'], 403);
            try {
                $application = $this->applicationService->requestDocuments($application, $request->validated());
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage()], 409);
            }
            return response()->json(['message' => 'Documents requested', 'application' => new ApplicationResource($application)]);
        }

        public function supplyDocuments(Request $request, Application $application)
        {
            if ($request->user()->id !== $application->user_id) return response()->json(['message' => 'Forbidden'], 403);
            $data = $request->validate([
                'documents' => ['required', 'array', 'min:1'],
                'documents.*.name' => ['required', 'string', 'max:255'],
                'documents.*.link' => ['nullable', 'url', 'max:2048'],
                'documents.*.file' => ['nullable', 'file', 'max:10240'],
            ]);
            try {
                $application = $this->applicationService->supplyDocuments($application, $data['documents']);
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage()], 409);
            }
            return response()->json(['message' => 'Documents supplied', 'application' => new ApplicationResource($application)]);
        }

        public function proveDocuments(Request $request, Application $application)
        {
            if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) return response()->json(['message' => 'Forbidden'], 403);
            try {
                $application = $this->applicationService->proveDocuments($application);
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage()], 409);
            }
            return response()->json(['message' => 'Documentation proven', 'application' => new ApplicationResource($application)]);
        }

    public function scheduleExam(Request $request, Application $application)
    {
        if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'scheduled_at' => 'required|date',
            'location' => 'required|string',
            'mode' => 'nullable|in:onsite,online',
            'laws_requirements' => 'required|string|max:10000',
        ]);

        try {
            $application = $this->applicationService->scheduleExam($application, $data);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Exam scheduled', 'application' => new ApplicationResource($application)]);
    }

    public function scheduleInterview(Request $request, Application $application)
    {
        if (! in_array($request->user()->role?->name, ['employer', 'hr'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'scheduled_at' => 'required|date',
            'location' => 'required_if:mode,onsite|nullable|string',
            'mode' => 'nullable|in:onsite,online',
            'meeting_link' => 'required_if:mode,online|nullable|url|max:2048',
        ]);

        try {
            $application = $this->applicationService->scheduleInterview($application, $data);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Interview scheduled', 'application' => new ApplicationResource($application)]);
    }
}
