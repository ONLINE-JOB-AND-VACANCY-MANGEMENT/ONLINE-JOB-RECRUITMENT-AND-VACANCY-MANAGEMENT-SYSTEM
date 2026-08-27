<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobRequisition extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 'requested_by', 'approved_by', 'department', 'job_title',
        'target_hire_date', 'salary_min', 'salary_max', 'justification',
        'status', 'approved_at', 'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'target_hire_date' => 'date',
            'approved_at' => 'datetime',
            'salary_min' => 'decimal:2',
            'salary_max' => 'decimal:2',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
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