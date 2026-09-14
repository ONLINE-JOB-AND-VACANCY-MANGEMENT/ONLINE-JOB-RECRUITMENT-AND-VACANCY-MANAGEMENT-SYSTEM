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
        // JobResource::toArray() builds 'posted_by' (reads $this->postedBy) BEFORE
        // 'is_bookmarked' (reads $this->bookmarks) — PHP evaluates array literals in
        // order, so postedBy throws first regardless of whether bookmarks is loaded.
        // The previous fix here added 'bookmarks' but missed 'postedBy', which is why
        // the exact same 500 persisted. Job's new model-level $with now covers both
        // (and skills/jobTitle) by default for every future query, but they're kept
        // explicit here too for clarity.
        $jobs = Job::whereHas('bookmarks', fn ($q) => $q->where('user_id', $request->user()->id))
            ->with(['company', 'jobTitle.department.mainCategory', 'skills', 'postedBy', 'bookmarks'])
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
