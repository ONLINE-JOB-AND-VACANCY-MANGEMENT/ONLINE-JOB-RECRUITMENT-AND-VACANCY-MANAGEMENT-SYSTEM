<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('applicant_id')->nullable()->unique()->after('id');
        });

        // Preserve existing accounts while giving job seekers stable identifiers.
        $next = 1;
        DB::table('users')->whereNull('applicant_id')->orderBy('id')->eachById(function ($user) use (&$next) {
            DB::table('users')->where('id', $user->id)->update(['applicant_id' => $next++]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['applicant_id']);
            $table->dropColumn('applicant_id');
        });
    }
};
