<?php

namespace Database\Seeders;

use App\Models\JobTitle;
use App\Models\Skill;
use Illuminate\Database\Seeder;

class JobTitleSkillSeeder extends Seeder
{
    public function run(): void
    {
        $map = [
            'Software Engineer' => ['PHP', 'Laravel', 'JavaScript', 'MySQL'],
            'Network Administrator' => ['Communication'],
            'IT Support Officer' => ['Communication'],
            'System Administrator' => ['Communication'],
            'Accountant' => ['Excel'],
            'Finance Officer' => ['Excel'],
            'HR Officer' => ['Communication', 'Project Management'],
            'Recruitment Specialist' => ['Communication'],
            'Lecturer' => ['Communication'],
            'Research Fellow' => ['Communication', 'Project Management'],
        ];

        foreach ($map as $jobTitleName => $skillNames) {
            $jobTitle = JobTitle::where('name', $jobTitleName)->first();
            if (!$jobTitle) continue;

            $skillIds = Skill::whereIn('name', $skillNames)->pluck('id');
            $jobTitle->skills()->syncWithoutDetaching($skillIds);
        }
    }
}
