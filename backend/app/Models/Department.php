<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = ['main_category_id', 'name'];

    public function mainCategory()
    {
        return $this->belongsTo(MainCategory::class);
    }

    public function jobTitles()
    {
        return $this->hasMany(JobTitle::class);
    }

    // Managers assigned to this department (User::department_id).
    public function managers()
    {
        return $this->hasMany(User::class);
    }
}
