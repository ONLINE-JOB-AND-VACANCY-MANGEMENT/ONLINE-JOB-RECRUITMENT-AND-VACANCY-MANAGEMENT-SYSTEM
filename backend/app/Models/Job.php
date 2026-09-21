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
        'salary', 'salary_min', 'salary_max', 'location', 'job_type', 'workplace_type',
        'experience_level', 'status', 'published_at', 'start_date', 'end_date',
    ];

    // JobResource unconditionally reads jobTitle->department->mainCategory, skills,
    // and postedBy, plus bookmarks whenever the viewer is a job seeker. Missing any
    // ONE of these on any ONE call site throws under Model::preventLazyLoading() —
    // that's the exact bug that hit /bookmarks twice in a row (bookmarks, then
    // postedBy, because 'posted_by' is built before 'is_bookmarked' in the resource
    // array so it fails first). Declaring the full set here means every standard
    // fetch of a Job — index, show, paginated lists, route-model binding, all of it —
    // has everything JobResource needs, with no more per-controller call sites to
    // individually get right or wrong.
    protected $with = ['jobTitle.department.mainCategory', 'skills', 'postedBy', 'bookmarks', 'company'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'published_at' => 'datetime',
            'salary_min' => 'decimal:2',
            'salary_max' => 'decimal:2',
            'salary' => 'decimal:2',
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
