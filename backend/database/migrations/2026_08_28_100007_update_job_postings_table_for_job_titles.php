<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            // Internal/public visibility is discarded entirely — every job is public on creation.
            $table->dropColumn('visibility');
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });

        Schema::table('job_postings', function (Blueprint $table) {
            // Every job (whether posted directly by HR or created from an approved
            // requisition) now points at a specific job title.
            $table->foreignId('job_title_id')->after('id')->constrained()->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropForeign(['job_title_id']);
            $table->dropColumn('job_title_id');
            $table->foreignId('category_id')->nullable()->constrained()->onDelete('cascade');
            $table->enum('visibility', ['internal', 'public'])->default('public');
        });
    }
};
