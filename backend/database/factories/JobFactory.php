<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class JobFactory extends Factory
{
    protected $model = \App\Models\Job::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'category_id' => Category::factory(),
            'title' => fake()->jobTitle(),
            'description' => fake()->paragraphs(3, true),
            'requirements' => fake()->paragraph(),
            'salary_min' => fake()->numberBetween(20000, 50000),
            'salary_max' => fake()->numberBetween(50001, 120000),
            'location' => fake()->city(),
            'job_type' => fake()->randomElement(['full_time', 'part_time', 'contract', 'internship', 'remote']),
            'experience_level' => fake()->randomElement(['entry', 'mid', 'senior', 'executive']),
            'status' => 'open',
            'deadline' => fake()->dateTimeBetween('+1 week', '+2 months'),
        ];
    }
}