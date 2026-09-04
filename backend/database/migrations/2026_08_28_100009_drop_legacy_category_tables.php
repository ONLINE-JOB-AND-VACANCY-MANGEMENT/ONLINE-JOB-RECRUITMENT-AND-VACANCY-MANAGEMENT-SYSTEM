<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Replaced entirely by main_categories -> departments -> job_titles.
        // Must run after the migrations that drop category_id from job_postings
        // and job_requisitions, or the FK constraints below block the drop.
        Schema::dropIfExists('category_skill');
        Schema::dropIfExists('categories');
    }

    public function down(): void
    {
        // Intentionally not reversible — restore from the original
        // 2026_08_03_112302_create_categories_table.php and
        // 2026_08_25_052328_create_category_skill_table.php migrations if ever needed.
    }
};
