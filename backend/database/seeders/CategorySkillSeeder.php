<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Skill;
use Illuminate\Database\Seeder;

class CategorySkillSeeder extends Seeder
{
    public function run(): void
    {
        $map = [
            'Software Engineering' => ['PHP', 'Laravel', 'React', 'JavaScript', 'MySQL'],
            'Marketing' => ['Communication'],
            'Sales' => ['Communication'],
            'Human Resources' => ['Communication', 'Project Management'],
            'Finance' => ['Excel'],
            'Customer Support' => ['Communication'],
            'Design' => ['Communication'],
        ];

        foreach ($map as $categoryName => $skillNames) {
            $category = Category::where('name', $categoryName)->first();
            if (!$category) continue;

            $skillIds = Skill::whereIn('name', $skillNames)->pluck('id');
            $category->skills()->syncWithoutDetaching($skillIds);
        }
    }
}