<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class JobRequisitionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'requested_by' => User::factory(),
            'department' => fake()->randomElement(['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Support']),
            'job_title' => fake()->jobTitle(),
            'target_hire_date' => fake()->dateTimeBetween('+2 weeks', '+2 months'),
            'salary_min' => fake()->numberBetween(20000, 50000),
            'salary_max' => fake()->numberBetween(50001, 120000),
            'justification' => fake()->paragraph(),
            'status' => 'draft',
        ];
    }
}