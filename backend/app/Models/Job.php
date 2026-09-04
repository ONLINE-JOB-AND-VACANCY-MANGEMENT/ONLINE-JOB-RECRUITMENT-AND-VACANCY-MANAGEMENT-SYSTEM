<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    use HasFactory;

    protected $table = 'job_postings';

    protected $fillable = [
        'job_title_id', 'requisition_id', 'company_id', 'posted_by', 'title', 'description', 'requirements',
        'salary_min', 'salary_max', 'location', 'job_type', 'workplace_type',
        'experience_level', 'status', 'published_at', 'start_date', 'end_date',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'published_at' => 'datetime',
            'salary_min' => 'decimal:2',
            'salary_max' => 'decimal:2',
        ];
    }

    // Category hierarchy is reached through the job title: jobTitle -> department -> mainCategory.
    public function jobTitle()
    {
        return $this->belongsTo(JobTitle::class);
    }

    public function requisition()
    {
        return $this->belongsTo(JobRequisition::class, 'requisition_id');
    }

    public function postedBy()
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'job_skill', 'job_posting_id', 'skill_id');
    }

    public function applications()
    {
        return $this->hasMany(Application::class, 'job_posting_id');
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class, 'job_posting_id');
    }

    public function company()      { return $this->belongsTo(Company::class, 'company_id'); }
}
