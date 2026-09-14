<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\JobService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('jobs:close-expired', function (JobService $jobService) {
    $this->info("Closed {$jobService->closeExpiredJobs()} expired job(s).");
})->purpose('Close open jobs whose application deadlines have passed');
