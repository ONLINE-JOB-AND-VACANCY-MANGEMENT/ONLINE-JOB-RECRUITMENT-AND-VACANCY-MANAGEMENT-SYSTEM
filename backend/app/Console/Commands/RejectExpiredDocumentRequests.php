<?php

namespace App\Console\Commands;

use App\Models\Application;
use Illuminate\Console\Command;

class RejectExpiredDocumentRequests extends Command
{
    protected $signature = 'applications:reject-expired-documents';
    protected $description = 'Reject applications that did not supply requested documents on time';

    public function handle(): int
    {
        $count = Application::expireDocumentRequests();
        $this->info("Rejected {$count} expired document request(s).");
        return self::SUCCESS;
    }
}
