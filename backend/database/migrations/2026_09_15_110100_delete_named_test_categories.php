<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $names = [
            'Test Main Category 1788687451',
            'Test Main Category 1788688472',
            'Test Main Category 1788788137',
        ];

        $categoryIds = DB::table('main_categories')->whereIn('name', $names)->pluck('id');
        if ($categoryIds->isEmpty()) {
            return;
        }

        $departmentIds = DB::table('departments')->whereIn('main_category_id', $categoryIds)->pluck('id');
        $titleIds = DB::table('job_titles')->whereIn('department_id', $departmentIds)->pluck('id');
        $jobIds = DB::table('job_postings')->whereIn('job_title_id', $titleIds)->pluck('id');
        $applicationIds = DB::table('applications')->whereIn('job_posting_id', $jobIds)->pluck('id');

        DB::table('interviews')->whereIn('application_id', $applicationIds)->delete();
        DB::table('exams')->whereIn('application_id', $applicationIds)->delete();
        DB::table('applications')->whereIn('id', $applicationIds)->delete();
        DB::table('job_skill')->whereIn('job_posting_id', $jobIds)->delete();
        DB::table('bookmarks')->whereIn('job_posting_id', $jobIds)->delete();
        DB::table('job_postings')->whereIn('id', $jobIds)->delete();
        DB::table('job_requisition_skill')->whereIn('job_requisition_id', function ($query) use ($titleIds) {
            $query->select('id')->from('job_requisitions')->whereIn('job_title_id', $titleIds);
        })->delete();
        DB::table('job_requisitions')->whereIn('job_title_id', $titleIds)->delete();
        DB::table('job_title_skill')->whereIn('job_title_id', $titleIds)->delete();
        DB::table('job_titles')->whereIn('id', $titleIds)->delete();
        DB::table('departments')->whereIn('id', $departmentIds)->delete();
        DB::table('main_categories')->whereIn('id', $categoryIds)->delete();
    }

    public function down(): void
    {
        // The requested test data is intentionally not recreated.
    }
};
