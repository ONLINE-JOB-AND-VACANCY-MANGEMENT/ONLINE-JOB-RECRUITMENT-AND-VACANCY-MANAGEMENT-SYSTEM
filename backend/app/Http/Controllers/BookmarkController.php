<?php

namespace App\Http\Controllers;

use App\Http\Resources\JobResource;
use App\Models\Bookmark;
use App\Models\Job;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    public function index(Request $request)
    {
        $jobs = Job::whereHas('bookmarks', fn ($q) => $q->where('user_id', $request->user()->id))
            ->with(['company', 'category', 'skills'])
            ->paginate(15);

        return JobResource::collection($jobs);
    }

    public function store(Request $request, Job $job)
    {
        $bookmark = Bookmark::firstOrCreate([
            'user_id' => $request->user()->id,
            'job_posting_id' => $job->id,
        ]);

        return response()->json(['message' => 'Job bookmarked', 'bookmark' => $bookmark], 201);
    }

    public function destroy(Request $request, Job $job)
    {
        Bookmark::where('user_id', $request->user()->id)
            ->where('job_posting_id', $job->id)
            ->delete();

        return response()->json(['message' => 'Bookmark removed']);
    }
}