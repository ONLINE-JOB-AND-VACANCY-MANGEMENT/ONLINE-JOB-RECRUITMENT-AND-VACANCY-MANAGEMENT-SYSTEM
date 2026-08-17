<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{   use HasFactory;
    protected $table = 'job_postings'; // override default 'jobs' (queue table)

protected $fillable = [
    'company_id', 'category_id', 'title', 'description', 'requirements',
    'salary_min', 'salary_max', 'location', 'job_type',
    'experience_level', 'status', 'start_date', 'end_date',
];

protected function casts(): array
{
    return [
        'start_date' => 'date',
        'end_date' => 'date',
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
}