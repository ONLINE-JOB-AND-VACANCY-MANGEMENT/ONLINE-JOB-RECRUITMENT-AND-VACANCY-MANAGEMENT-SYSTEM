<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function jobs()
    {
        return $this->belongsToMany(Job::class, 'job_skill', 'skill_id', 'job_posting_id');
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_skill');
    }
}