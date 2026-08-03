<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'role_id', 'name', 'email', 'password',
        'phone', 'address', 'profile_photo', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function company()
    {
        return $this->hasOne(Company::class);
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