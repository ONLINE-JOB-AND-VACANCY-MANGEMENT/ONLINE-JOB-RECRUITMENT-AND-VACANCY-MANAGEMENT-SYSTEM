<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->index('status');
            $table->index('job_type');
            $table->index('experience_level');
            $table->index(['status', 'category_id']); // common combo: open jobs in a category
            $table->index('end_date');
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->index('status');
            $table->index(['user_id', 'job_posting_id']); // fast lookup: "did this user already apply?"
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('is_active');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'is_read']); // fast "unread notifications for user" lookup
        });
    }

    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['job_type']);
            $table->dropIndex(['experience_level']);
            $table->dropIndex(['status', 'category_id']);
            $table->dropIndex(['end_date']);
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['user_id', 'job_posting_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_read']);
        });
    }
};