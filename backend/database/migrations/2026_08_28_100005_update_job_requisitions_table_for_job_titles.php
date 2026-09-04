<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_requisitions', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn(['category_id', 'department', 'job_title']);
        });

        Schema::table('job_requisitions', function (Blueprint $table) {
            // Every requisition now points at a specific job title (which carries its
            // own department -> main category chain), instead of free-text fields.
            $table->foreignId('job_title_id')->after('id')->constrained()->onDelete('restrict');

            // Moved up from job_postings: the manager now defines these at requisition time.
            $table->enum('job_type', ['full_time', 'part_time', 'contract', 'internship'])->nullable()->after('job_title_id');
            $table->text('requirements')->nullable()->after('justification');

            // HR-only fields: set later during approval, not by the requesting manager.
            $table->date('start_date')->nullable()->after('requirements');
            $table->date('end_date')->nullable()->after('start_date');
        });
    }

    public function down(): void
    {
        Schema::table('job_requisitions', function (Blueprint $table) {
            $table->dropForeign(['job_title_id']);
            $table->dropColumn(['job_title_id', 'job_type', 'requirements', 'start_date', 'end_date']);
            $table->foreignId('category_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('department')->nullable();
            $table->string('job_title')->nullable();
        });
    }
};
