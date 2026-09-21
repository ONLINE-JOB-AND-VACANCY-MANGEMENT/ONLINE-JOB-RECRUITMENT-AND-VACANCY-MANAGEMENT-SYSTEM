<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $protected = ['academic', 'admin'];
        $categories = DB::table('main_categories')
            ->whereRaw('LOWER(name) NOT IN (?, ?)', $protected)
            ->get(['id']);

        foreach ($categories as $category) {
            $titleIds = DB::table('departments')
                ->join('job_titles', 'job_titles.department_id', '=', 'departments.id')
                ->where('departments.main_category_id', $category->id)
                ->pluck('job_titles.id');

            // Never remove a category whose titles are referenced by historical
            // requisitions or postings. HR can delete those categories manually
            // after archiving/reassigning the dependent records.
            if ($titleIds->isNotEmpty() && (
                DB::table('job_postings')->whereIn('job_title_id', $titleIds)->exists()
                || DB::table('job_requisitions')->whereIn('job_title_id', $titleIds)->exists()
            )) {
                continue;
            }

            DB::table('main_categories')->where('id', $category->id)->delete();
        }
    }

    public function down(): void
    {
        // Removed catalog rows cannot be recreated without their original data.
    }
};
