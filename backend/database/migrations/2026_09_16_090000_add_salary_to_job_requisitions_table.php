<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('job_requisitions', function (Blueprint $table) {
            $table->decimal('salary', 10, 2)->nullable()->after('target_hire_date');
        });
    }

    public function down(): void
    {
        Schema::table('job_requisitions', function (Blueprint $table) {
            $table->dropColumn('salary');
        });
    }
};
