<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJobTitleRequest;
use App\Models\JobTitle;
use Illuminate\Http\Request;

class JobTitleController extends Controller
{
    public function index(Request $request)
    {
        $query = JobTitle::with(['department.mainCategory', 'skills']);

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        return $query->orderBy('name')->get();
    }

    // Both HR and managers can create job titles under an existing department
    // (a manager creating a requisition may need a title that doesn't exist yet).
    public function store(StoreJobTitleRequest $request)
    {
        $jobTitle = JobTitle::create($request->only(['department_id', 'name']));

        if ($request->filled('skills')) {
            $jobTitle->skills()->sync($request->skills);
        }

        return response()->json(['message' => 'Job title created', 'job_title' => $jobTitle->load('skills')], 201);
    }

    // Deleting a job title is HR-only, unlike creating one.
    public function destroy(Request $request, JobTitle $jobTitle)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $jobTitle->delete();
        return response()->json(['message' => 'Job title deleted']);
    }
}
