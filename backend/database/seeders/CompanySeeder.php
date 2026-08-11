<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $employerRoleId = Role::where('name', 'employer')->first()->id;
        $employers = User::where('role_id', $employerRoleId)->get();

        foreach ($employers as $employer) {
            Company::factory()->create(['user_id' => $employer->id]);
        }
    }
}