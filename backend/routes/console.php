<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Console\Commands\PublishInternalJobs;
use Illuminate\Support\Facades\Schedule;

Schedule::command(PublishInternalJobs::class)->daily();
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
