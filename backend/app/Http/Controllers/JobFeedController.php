<?php

namespace App\Http\Controllers;

use App\Http\Resources\JobResource;
use App\Models\Job;

class JobFeedController extends Controller
{
   public function index()
{
    $jobs = Job::where('visibility', 'public')
        ->where('status', 'open')
        ->with(['category', 'skills', 'postedBy'])
        ->latest()
        ->get();

    return JobResource::collection($jobs);
}
}