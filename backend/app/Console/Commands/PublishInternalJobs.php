<?php

namespace App\Console\Commands;

use App\Models\Job;
use Illuminate\Console\Command;

class PublishInternalJobs extends Command
{
    protected $signature = 'jobs:publish-internal';
    protected $description = 'Flip internal job postings to public visibility after 7 days';

    public function handle(): void
    {
        $count = Job::where('visibility', 'internal')
            ->where('published_at', '<=', now()->subDays(7))
            ->update(['visibility' => 'public']);

        $this->info("Published {$count} job(s) to public visibility.");
    }
}