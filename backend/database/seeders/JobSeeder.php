<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Job;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;

class JobSeeder extends Seeder
{
    public function run(): void
    {
        $employer = User::whereHas('role', fn ($q) => $q->where('name', 'employer'))->first();
        $categories = Category::all();

        if (!$employer || $categories->isEmpty()) {
            $this->command->warn('Skipping JobSeeder: need at least one employer user and one category. Run UserSeeder/CategorySeeder first.');
            return;
        }

        $titles = [
            'Backend Developer (Laravel)',
            'Frontend Developer (React)',
            'Marketing Coordinator',
            'Sales Executive',
            'UI/UX Designer',
            'Customer Support Specialist',
            'Financial Analyst',
            'HR Generalist',
        ];

        foreach ($titles as $title) {
            $job = Job::firstOrCreate(
                ['title' => $title],
                [
                    'category_id' => $categories->random()->id,
                    'posted_by' => $employer->id,
                    'description' => "We are looking for a talented {$title} to join our team and help us grow.",
                    'requirements' => 'Relevant experience, strong communication skills, and a collaborative mindset.',
                    'salary_min' => fake()->numberBetween(20000, 40000),
                    'salary_max' => fake()->numberBetween(40001, 90000),
                    'location' => fake()->randomElement(['Addis Ababa', 'Remote', 'Harar']),
                    'job_type' => fake()->randomElement(['full_time', 'part_time', 'contract', 'internship']),
                    'workplace_type' => fake()->randomElement(['onsite', 'remote', 'hybrid']),
                    'experience_level' => fake()->randomElement(['entry', 'mid', 'senior']),
                    'status' => 'open',
                    'visibility' => 'public',
                    'published_at' => now(),
                    'start_date' => now(),
                    'end_date' => now()->addMonths(2),
                ]
            );

            $skillIds = Skill::inRandomOrder()->limit(3)->pluck('id');
            $job->skills()->syncWithoutDetaching($skillIds);
        }

        $this->command->info('Seeded ' . count($titles) . ' public demo jobs.');
    }
}