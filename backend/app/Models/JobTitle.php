<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobTitle extends Model
{
    protected $fillable = ['department_id', 'name'];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'job_title_skill');
    }

    public function requisitions()
    {
        return $this->hasMany(JobRequisition::class);
    }

    public function jobs()
    {
        return $this->hasMany(Job::class);
    }
}
