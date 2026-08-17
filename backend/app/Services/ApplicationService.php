<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Job;
use App\Models\Resume;
use Illuminate\Support\Facades\Auth;

class ApplicationService
{
    public function __construct(protected FileUploadService $fileUploadService) {}

    public function apply(Job $job, array $data, $resumeFile = null): Application
    {
        $user = Auth::user();

        if (Application::where('user_id', $user->id)->where('job_posting_id', $job->id)->exists()) {
            throw new \Exception('You have already applied to this job.');
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
        $application->update(['status' => $status]);
        return $application->load(['user', 'job', 'resume']);
    }

    public function listForJobSeeker(int $userId)
    {
        return Application::where('user_id', $userId)->with(['job.company', 'resume'])->latest()->paginate(15);
    }

    public function listForJob(Job $job)
    {
        return $job->applications()->with(['user', 'resume'])->latest()->paginate(15);
    }

    public function scheduleExam(Application $application, array $data): Application
{
    $application->exam()->updateOrCreate([], [
        'scheduled_at' => $data['scheduled_at'],
        'location' => $data['location'] ?? null,
        'mode' => $data['mode'] ?? 'onsite',
        'status' => 'scheduled',
    ]);
    $application->update(['status' => 'exam_scheduled']);
    return $application->load(['user', 'job', 'resume', 'exam']);
}

public function scheduleInterview(Application $application, array $data): Application
{
    $application->interview()->updateOrCreate([], [
        'scheduled_at' => $data['scheduled_at'],
        'location' => $data['location'] ?? null,
        'mode' => $data['mode'] ?? 'onsite',
        'status' => 'scheduled',
    ]);
    $application->update(['status' => 'interview_scheduled']);
    return $application->load(['user', 'job', 'resume', 'interview']);
}
}