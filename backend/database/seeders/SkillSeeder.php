<?php

namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;

class SkillSeeder extends Seeder
{
    public function run(): void
    {
        $skills = ['PHP', 'Laravel', 'React', 'JavaScript', 'MySQL', 'Communication', 'Project Management', 'Python', 'Excel'];
        foreach ($skills as $name) {
            Skill::firstOrCreate(['name' => $name]);
        }
    }
}