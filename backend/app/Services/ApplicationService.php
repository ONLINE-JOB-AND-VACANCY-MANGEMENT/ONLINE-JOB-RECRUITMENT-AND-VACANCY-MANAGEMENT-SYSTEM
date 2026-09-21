<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Job;
use App\Models\Notification;
use App\Models\Resume;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Pagination\LengthAwarePaginator;

class ApplicationService
{
    public function __construct(protected FileUploadService $fileUploadService) {}

    // Once an application lands on either of these, it's done — no further status
    // changes or scheduling should be possible from it.
    private const TERMINAL_STATUSES = ['hired', 'rejected'];

    public function apply(Job $job, array $data, $resumeFile = null): Application
    {
        if ($job->end_date && $job->end_date->isBefore(today())) {
            $job->update(['status' => 'closed']);
        }

        if ($job->status !== 'open') {
            throw new \Exception('This job is no longer accepting applications.');
        }

        if ($job->end_date && now()->gt($job->end_date)) {
            throw new \Exception('The application deadline for this job has passed.');
        }
        $user = Auth::user();

        if (Application::where('user_id', $user->id)->where('job_posting_id', $job->id)->exists()) {
            throw new \Exception('You have already applied to this job.');
        }

        if (Application::where('user_id', $user->id)->exists()) {
            throw new \Exception('You are allowed to apply to only one job.');
        }

        $resumeId = $data['resume_id'] ?? null;

        if ($resumeFile) {
            $path = $this->fileUploadService->upload($resumeFile, 'resumes');
            $resume = Resume::create([
                'user_id' => $user->id,
                'file_path' => $path,
                'original_name' => $resumeFile->getClientOriginalName(),
            ]);
            $resumeId = $resume->id;
        }

        return Application::create([
            'user_id' => $user->id,
            'job_posting_id' => $job->id,
            'resume_id' => $resumeId,
            'cover_letter' => $data['cover_letter'] ?? null,
            'status' => 'applied',
        ])->load(['user', 'job', 'resume']);
    }

    public function updateStatus(Application $application, string $status): Application
    {
        if (in_array($application->status, self::TERMINAL_STATUSES, true)) {
            throw new \Exception("This application has already been {$application->status} and can no longer be updated.");
        }

        if ($status === 'hired' && self::hiredApplicationsForUser($application->user_id) >= 2) {
            throw new \Exception('This applicant has already been hired for the maximum of two jobs.');
        }
        $application->update(['status' => $status]);
        $application->load(['user.certificates', 'job', 'resume', 'exam', 'interview', 'documentRequest']);

        Notification::create([
            'user_id' => $application->user_id,
            'title' => 'Application status updated',
            'message' => "Your application for \"{$application->job->title}\" is now: " . str_replace('_', ' ', $status) . '.',
            'type' => 'application_status',
        ]);
        if ($application->user?->email) {
            Mail::raw("Your application for \"{$application->job->title}\" is now: ".str_replace('_', ' ', $status).'.', function ($mail) use ($application) {
                $mail->to($application->user->email)->subject('AASTU application status update');
            });
        }

        return $application;
    }

    private static function hiredApplicationsForUser(int $userId): int
    {
        return Application::where('user_id', $userId)->where('status', 'hired')->count();
    }

    public function listForJobSeeker(int $userId)
    {
        Application::expireDocumentRequests();
        return Application::where('user_id', $userId)->with(['user.certificates', 'job', 'resume', 'exam', 'interview', 'documentRequest'])->latest()->paginate(15);
    }

    public function listForJob(Job $job, ?\Illuminate\Http\Request $request = null)
    {
        Application::expireDocumentRequests();
        $query = $job->applications()->with(['user.certificates', 'job', 'resume', 'exam', 'interview', 'documentRequest']);
        if ($request?->filled('cgpa_min')) $query->whereHas('user', fn ($q) => $q->where('cgpa', '>=', $request->cgpa_min));
        if ($request?->filled('cgpa_max')) $query->whereHas('user', fn ($q) => $q->where('cgpa', '<=', $request->cgpa_max));
        if ($request?->filled('graduation_university')) $query->whereHas('user', fn ($q) => $q->where('graduation_university', 'like', '%'.$request->graduation_university.'%'));
        if ($request?->filled('status')) $query->where('status', $request->status);
        if ($request?->filled('applicant_id')) $query->whereHas('user', fn ($q) => $q->where('applicant_id', $request->applicant_id));
        $applications = $query->latest()->get();

        if ($request?->filled('semi_point_min') || $request?->filled('final_point_min')) {
            $applications = $applications->filter(function (Application $application) use ($request): bool {
                $semiPointMatches = ! $request->filled('semi_point_min')
                    || ($application->semi_point !== null && $application->semi_point >= (float) $request->semi_point_min);
                $finalPointMatches = ! $request->filled('final_point_min')
                    || ($application->final_point !== null && $application->final_point >= (float) $request->final_point_min);

                return $semiPointMatches && $finalPointMatches;
            })->values();
        }

        $page = (int) ($request?->input('page', 1) ?: 1);
        return new LengthAwarePaginator(
            $applications->forPage($page, 15)->values(),
            $applications->count(),
            15,
            $page,
            ['path' => $request?->url() ?? request()->url(), 'query' => $request?->query() ?? request()->query()]
        );
    }

    public function bulkUpdateStatus(array $ids, string $status): array
    {
        $updated = [];
        DB::transaction(function () use ($ids, $status, &$updated) {
            foreach (Application::whereIn('id', $ids)->with(['documentRequest', 'job'])->lockForUpdate()->get() as $application) {
                $updated[] = $this->updateStatus($application, $status);
            }
        });
        return $updated;
    }

    public function importResults(\Illuminate\Http\UploadedFile $file): int
    {
        $handle = fopen($file->getRealPath(), 'r');
        $headers = array_map(fn ($v) => strtolower(trim((string) $v)), fgetcsv($handle) ?: []);
        $required = ['applicant_id', 'exam_result', 'interview_result'];
        if (array_diff($required, $headers)) throw new \InvalidArgumentException('CSV must contain applicant_id, exam_result and interview_result columns.');
        $count = 0;
        while (($row = fgetcsv($handle)) !== false) {
            if (count(array_filter($row, fn ($v) => $v !== null && trim((string) $v) !== '')) === 0) continue;
            $data = array_combine($headers, array_pad($row, count($headers), null));
            $user = \App\Models\User::where('applicant_id', $data['applicant_id'])->first();
            if (!$user) throw new \InvalidArgumentException("Applicant {$data['applicant_id']} was not found.");
            foreach (['exam_result', 'interview_result'] as $field) {
                if ($data[$field] !== '' && (!is_numeric($data[$field]) || $data[$field] < 0 || $data[$field] > 100)) {
                    throw new \InvalidArgumentException("{$field} must be between 0 and 100.");
                }
            }
            $application = Application::where('user_id', $user->id)->latest()->first();
            if (!$application) continue;
            if ($data['exam_result'] !== '' && $data['exam_result'] !== null) {
                $application->exam()->updateOrCreate([], ['score' => $data['exam_result'], 'scheduled_at' => now(), 'status' => 'completed']);
            }
            if ($data['interview_result'] !== '' && $data['interview_result'] !== null) {
                $application->interview()->updateOrCreate([], ['result' => $data['interview_result'], 'scheduled_at' => now(), 'status' => 'completed', 'mode' => 'onsite']);
            }
            $count++;
        }
        fclose($handle);
        return $count;
    }

    public function requestDocuments(Application $application, array $data): Application
    {
        if (! in_array($application->status, ['interview_scheduled', 'reserved'], true)) {
            throw new \Exception('Documents can only be requested after the interview stage.');
        }
        $application->documentRequest()->updateOrCreate([], [
            'required_documents' => array_values(array_unique($data['required_documents'])),
            'submitted_documents' => null,
            'deadline' => $data['deadline'],
            'location' => $data['location'],
            'announcement' => $data['announcement'],
            'supplied_at' => null,
            'proven_at' => null,
        ]);
        $application->update(['status' => 'documentation_requested']);
        $application->load(['user.certificates', 'job', 'resume', 'documentRequest']);
        Notification::create(['user_id' => $application->user_id, 'title' => 'Document approval', 'message' => "Bring the requested documents for physical approval for \"{$application->job->title}\" to {$application->documentRequest->location} by {$application->documentRequest->deadline->format('Y-m-d H:i')}.", 'type' => 'document_approval']);
        $this->sendEmail($application, "Document approval for \"{$application->job->title}\": {$application->documentRequest->announcement} Bring the documents to {$application->documentRequest->location} by {$application->documentRequest->deadline->format('Y-m-d H:i')}.");
        return $application;
    }

    private function sendEmail(Application $application, string $message): void
    {
        if ($application->user?->email) {
            Mail::raw($message, fn ($mail) => $mail->to($application->user->email)->subject('AASTU application update'));
        }
    }

    public function supplyDocuments(Application $application, array $documents): Application
    {
        if ($application->status !== 'documentation_requested' || ! $application->documentRequest) {
            throw new \Exception('There is no active document request for this application.');
        }
        if ($application->documentRequest->isExpired()) {
            Application::expireDocumentRequests();
            throw new \Exception('The document deadline has passed.');
        }
        $request = $application->documentRequest;
        $required = collect($request->required_documents);
        $submittedNames = collect($documents)->pluck('name');
        if ($required->diff($submittedNames)->isNotEmpty()) {
            throw new \Exception('Every requested document must be supplied.');
        }
        $submitted = collect($documents)->map(fn ($document) => [
            'name' => $document['name'],
            'link' => $document['link'] ?? null,
            'file_path' => ! empty($document['file']) ? $this->fileUploadService->upload($document['file'], 'applicant-documents') : null,
        ])->values()->all();
        $request->update(['submitted_documents' => $submitted, 'supplied_at' => now()]);
        $application->update(['status' => 'documentation_supplied']);
        $application = $application->fresh(['user', 'job', 'documentRequest']);
        $message = "Your documents for \"{$application->job->title}\" were submitted and are awaiting review.";
        Notification::create(['user_id' => $application->user_id, 'title' => 'Documents submitted', 'message' => $message, 'type' => 'documents_supplied']);
        $this->sendEmail($application, $message);
        return $application->fresh(['user.certificates', 'job', 'resume', 'documentRequest']);
    }

    public function proveDocuments(Application $application): Application
    {
        if ($application->status !== 'documentation_requested') {
            throw new \Exception('The applicant must be under document approval before documents can be proven.');
        }
        $application->documentRequest->update(['proven_at' => now()]);
        $application = $application->fresh(['user', 'job', 'documentRequest']);
        $message = "Your documents for \"{$application->job->title}\" have been proven.";
        Notification::create(['user_id' => $application->user_id, 'title' => 'Documents proven', 'message' => $message, 'type' => 'documents_proven']);
        $this->sendEmail($application, $message);
        return $application->fresh(['user.certificates', 'job', 'resume', 'documentRequest']);
    }

    public function scheduleExam(Application $application, array $data): Application
    {
        if (in_array($application->status, self::TERMINAL_STATUSES, true)) {
            throw new \Exception("This application has already been {$application->status} and can no longer be scheduled.");
        }

        $application->exam()->updateOrCreate([], [
            'scheduled_at' => $data['scheduled_at'],
            'laws_requirements' => $data['laws_requirements'],
            'location' => $data['location'] ?? null,
            'mode' => $data['mode'] ?? 'onsite',
            'status' => 'scheduled',
        ]);
        $application->update(['status' => 'exam_scheduled']);
        $application->load(['user', 'job', 'resume', 'exam']);

        Notification::create([
            'user_id' => $application->user_id,
            'title' => 'Exam scheduled',
            'message' => "An exam has been scheduled for your application to \"{$application->job->title}\".",
            'type' => 'exam_scheduled',
        ]);
        $this->sendEmail($application, "An exam has been scheduled for your application to \"{$application->job->title}\". Date: {$application->exam->scheduled_at}. Location: {$application->exam->location}. Exam laws and requirements: {$application->exam->laws_requirements}");

        return $application;
    }

    public function scheduleInterview(Application $application, array $data): Application
    {
        if (in_array($application->status, self::TERMINAL_STATUSES, true)) {
            throw new \Exception("This application has already been {$application->status} and can no longer be scheduled.");
        }

        $application->interview()->updateOrCreate([], [
            'scheduled_at' => $data['scheduled_at'],
            'location' => $data['location'] ?? null,
            'mode' => $data['mode'] ?? 'onsite',
            'meeting_link' => $data['meeting_link'] ?? null,
            'status' => 'scheduled',
        ]);
        $application->update(['status' => 'interview_scheduled']);
        $application->load(['user', 'job', 'resume', 'interview']);

        Notification::create([
            'user_id' => $application->user_id,
            'title' => 'Interview scheduled',
            'message' => "An interview has been scheduled for your application to \"{$application->job->title}\".",
            'type' => 'interview_scheduled',
        ]);
        $this->sendEmail($application, "An interview has been scheduled for your application to \"{$application->job->title}\".");

        return $application;
    }
}
