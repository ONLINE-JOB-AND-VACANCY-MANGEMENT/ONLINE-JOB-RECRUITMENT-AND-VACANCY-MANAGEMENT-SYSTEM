<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class JobFactory extends Factory
{
    protected $model = \App\Models\Job::class;

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'posted_by' => User::factory(),
            'title' => fake()->jobTitle(),
            'description' => fake()->paragraphs(3, true),
            'requirements' => fake()->paragraph(),
            'salary_min' => fake()->numberBetween(20000, 50000),
            'salary_max' => fake()->numberBetween(50001, 120000),
            'location' => fake()->city(),
            'job_type' => fake()->randomElement(['full_time', 'part_time', 'contract', 'internship']),
            'workplace_type' => fake()->randomElement(['onsite', 'remote', 'hybrid']),
            'experience_level' => fake()->randomElement(['entry', 'mid', 'senior', 'executive']),
            'status' => 'open',
            'visibility' => 'internal',
            'published_at' => now(),
            'start_date' => fake()->dateTimeBetween('-1 week', '+1 week'),
            'end_date' => fake()->dateTimeBetween('+2 weeks', '+2 months'),
        ];
    }
}