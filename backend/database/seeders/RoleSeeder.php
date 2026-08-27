<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
 public function run(): void
{
    foreach (['job_seeker', 'employer', 'manager', 'admin'] as $role) {
        Role::firstOrCreate(['name' => $role]);
    }
}
}