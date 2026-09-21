<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Notification;
use Illuminate\Support\Facades\Mail;

class Application extends Model
{   use HasFactory;
    protected $fillable = ['user_id', 'job_posting_id', 'resume_id', 'cover_letter', 'status'];

    protected $with = ['documentRequest', 'user.certificates'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function exam()
{
    return $this->hasOne(Exam::class);
}

    public function job()
    {
        return $this->belongsTo(Job::class, 'job_posting_id');
    }

    public function resume()
    {
        return $this->belongsTo(Resume::class);
    }

    public function interview()
    {
        return $this->hasOne(Interview::class);
    }

    public function documentRequest()
    {
        return $this->hasOne(DocumentRequest::class);
    }

    public function getSemiPointAttribute(): ?float
    {
        if ($this->user?->cgpa === null || $this->exam?->score === null) return null;
        return round(((float) $this->user->cgpa * .4) + ((float) $this->exam->score * .6), 2);
    }

    public function getFinalPointAttribute(): ?float
    {
        if ($this->semi_point === null || $this->interview?->result === null) return null;
        return round(($this->semi_point * .65) + ((float) $this->interview->result * .35), 2);
    }

    public static function expireDocumentRequests(): int
    {
        $count = 0;
        static::where('status', 'documentation_requested')
            ->whereHas('documentRequest', fn ($q) => $q->whereNull('proven_at')->where('deadline', '<', now()))
            ->with(['documentRequest', 'job'])
            ->each(function (self $application) use (&$count) {
                $application->update(['status' => 'rejected']);
                Notification::create([
                    'user_id' => $application->user_id,
                    'title' => 'Application rejected',
                    'message' => "Your application for \"{$application->job->title}\" was rejected because requested documents were not supplied by the deadline.",
                    'type' => 'application_rejected',
                ]);
                if ($application->user?->email) {
                    Mail::raw("Your application for \"{$application->job->title}\" was rejected because requested documents were not supplied by the deadline.", fn ($mail) => $mail->to($application->user->email)->subject('AASTU application update'));
                }
                $count++;
            });
        return $count;
    }
}