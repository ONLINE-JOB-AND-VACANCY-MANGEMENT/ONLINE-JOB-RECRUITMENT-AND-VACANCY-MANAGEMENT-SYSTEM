<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            MainCategorySeeder::class,
            DepartmentSeeder::class,
            SkillSeeder::class,
            JobTitleSeeder::class,
            JobTitleSkillSeeder::class,
            UserSeeder::class,
            CompanySeeder::class,
            JobSeeder::class,
        ]);
    }
}
