<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobRequisition extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_title_id', 'requested_by', 'approved_by', 'job_type', 'target_hire_date',
        'salary_min', 'salary_max', 'justification', 'requirements', 'start_date', 'end_date',
        'status', 'approved_at', 'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'target_hire_date' => 'date',
            'start_date' => 'date',
            'end_date' => 'date',
            'approved_at' => 'datetime',
            'salary_min' => 'decimal:2',
            'salary_max' => 'decimal:2',
        ];
    }

    public function jobTitle()
    {
        return $this->belongsTo(JobTitle::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'job_requisition_skill');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function jobPosting()
    {
        return $this->hasOne(Job::class, 'requisition_id');
    }
}
