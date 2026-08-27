<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('name', 'admin')->first();
        $employerRole = Role::where('name', 'employer')->first();
        $managerRole = Role::where('name', 'manager')->first();
        $seekerRole = Role::where('name', 'job_seeker')->first();

        User::firstOrCreate(
            ['email' => 'admin@jobportal.test'],
            ['role_id' => $adminRole->id, 'name' => 'System Admin', 'password' => Hash::make('password'), 'is_active' => true]
        );

        // HR staff — created by admin, not self-registered
        User::factory()->count(3)->create(['role_id' => $employerRole->id]);

        // Department/hiring managers
        User::factory()->count(3)->create(['role_id' => $managerRole->id]);

        // Job seekers — the only self-registering role
        User::factory()->count(15)->create(['role_id' => $seekerRole->id]);
    }
}