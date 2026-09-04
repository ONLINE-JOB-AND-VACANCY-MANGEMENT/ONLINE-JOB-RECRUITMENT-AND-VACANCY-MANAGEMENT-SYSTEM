<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\MainCategory;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $map = [
            'Admin' => ['ICT', 'General Services', 'Finance', 'Human Resources', 'Procurement'],
            'Academic' => ['Lecturer', 'Laboratory', 'Research', 'Library'],
        ];

        foreach ($map as $mainCategoryName => $departments) {
            $mainCategory = MainCategory::where('name', $mainCategoryName)->first();
            if (!$mainCategory) continue;

            foreach ($departments as $name) {
                Department::firstOrCreate(['main_category_id' => $mainCategory->id, 'name' => $name]);
            }
        }
    }
}
