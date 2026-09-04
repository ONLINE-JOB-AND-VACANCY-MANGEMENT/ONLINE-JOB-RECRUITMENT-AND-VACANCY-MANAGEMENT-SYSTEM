<?php

namespace Database\Seeders;

use App\Models\Job;
use App\Models\JobTitle;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;

class JobSeeder extends Seeder
{
    public function run(): void
    {
        $employer = User::whereHas('role', fn ($q) => $q->where('name', 'employer'))->first();
        $jobTitles = JobTitle::all();

        if (!$employer || $jobTitles->isEmpty()) {
            $this->command->warn('Skipping JobSeeder: need at least one employer user and one job title. Run UserSeeder/JobTitleSeeder first.');
            return;
        }

        foreach ($jobTitles->take(8) as $jobTitle) {
            $job = Job::firstOrCreate(
                ['job_title_id' => $jobTitle->id, 'title' => $jobTitle->name],
                [
                    'posted_by' => $employer->id,
                    'description' => "We are looking for a talented {$jobTitle->name} to join AASTU.",
                    'requirements' => 'Relevant experience, strong communication skills, and a collaborative mindset.',
                    'salary_min' => fake()->numberBetween(8000, 15000),
                    'salary_max' => fake()->numberBetween(15001, 35000),
                    'location' => 'Addis Ababa',
                    'job_type' => fake()->randomElement(['full_time', 'part_time', 'contract', 'internship']),
                    'workplace_type' => fake()->randomElement(['onsite', 'remote', 'hybrid']),
                    'experience_level' => fake()->randomElement(['entry', 'mid', 'senior']),
                    'status' => 'open',
                    'published_at' => now(),
                    'start_date' => now(),
                    'end_date' => now()->addMonths(2),
                ]
            );

            $skillIds = $jobTitle->skills()->pluck('skills.id');
            if ($skillIds->isEmpty()) {
                $skillIds = Skill::inRandomOrder()->limit(2)->pluck('id');
            }
            $job->skills()->syncWithoutDetaching($skillIds);
        }

        $this->command->info('Seeded demo jobs from job titles.');
    }
}
