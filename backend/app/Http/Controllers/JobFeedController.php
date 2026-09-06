<?php

namespace App\Http\Controllers;

use App\Http\Resources\JobResource;
use App\Models\Job;

class JobFeedController extends Controller
{
    public function index()
    {
        $jobs = Job::where('status', 'open')
            ->with(['jobTitle.department.mainCategory', 'skills', 'postedBy'])
            ->latest()
            ->get();

        return JobResource::collection($jobs);
    }
}