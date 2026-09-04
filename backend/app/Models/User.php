<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'role_id', 'name', 'first_name', 'middle_name', 'last_name', 'email', 'password',
        'phone', 'address', 'profile_photo', 'is_active',
        'cgpa', 'graduation_university', 'worked_company', 'department_id',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
            'cgpa' => 'decimal:2',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    // Set for manager accounts by admin at staff-creation time.
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function requisitions()
    {
        return $this->hasMany(JobRequisition::class, 'requested_by');
    }

    public function postedJobs()
    {
        return $this->hasMany(Job::class, 'posted_by');
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function resumes()
    {
        return $this->hasMany(Resume::class);
    }

    public function notifications_custom()
    {
        return $this->hasMany(Notification::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class);
    }
}
