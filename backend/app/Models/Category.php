<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    public function jobs()
    {
        return $this->hasMany(Job::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'category_skill');
    }

    public function requisitions()
    {
        return $this->hasMany(JobRequisition::class);
    }
}