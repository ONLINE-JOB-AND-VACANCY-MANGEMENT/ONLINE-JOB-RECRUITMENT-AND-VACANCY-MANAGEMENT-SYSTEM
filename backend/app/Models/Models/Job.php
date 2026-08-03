<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    protected $table = 'job_postings'; // override default 'jobs' (queue table)

    protected $fillable = [
        'company_id', 'category_id', 'title', 'description', 'requirements',
        'salary_min', 'salary_max', 'location', 'job_type',
        'experience_level', 'status', 'deadline',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'salary_min' => 'decimal:2',
            'salary_max' => 'decimal:2',
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'job_skill');
    }

    public function applications()
    {
        return $this->hasMany(Application::class, 'job_posting_id');
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class, 'job_posting_id');
    }
}