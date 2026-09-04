<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\JobTitle;
use Illuminate\Database\Seeder;

class JobTitleSeeder extends Seeder
{
    public function run(): void
    {
        $map = [
            'ICT' => ['Software Engineer', 'Network Administrator', 'IT Support Officer', 'System Administrator'],
            'General Services' => ['Maintenance Technician', 'Cleaner', 'Driver', 'Security Officer'],
            'Finance' => ['Accountant', 'Finance Officer'],
            'Human Resources' => ['HR Officer', 'Recruitment Specialist'],
            'Procurement' => ['Procurement Officer'],
            'Lecturer' => ['Lecturer', 'Assistant Lecturer', 'Associate Professor', 'Professor'],
            'Laboratory' => ['Lab Technician', 'Lab Assistant'],
            'Research' => ['Research Fellow', 'Research Assistant'],
            'Library' => ['Librarian', 'Library Assistant'],
        ];

        foreach ($map as $departmentName => $titles) {
            $department = Department::where('name', $departmentName)->first();
            if (!$department) continue;

            foreach ($titles as $title) {
                JobTitle::firstOrCreate(['department_id' => $department->id, 'name' => $title]);
            }
        }
    }
}
