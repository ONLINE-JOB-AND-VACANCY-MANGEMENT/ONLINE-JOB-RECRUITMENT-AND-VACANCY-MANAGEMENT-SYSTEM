<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDepartmentRequest;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::withCount('jobTitles')->with('mainCategory');

        if ($request->filled('main_category_id')) {
            $query->where('main_category_id', $request->main_category_id);
        }

        return $query->orderBy('name')->get();
    }

    public function store(StoreDepartmentRequest $request)
    {
        $department = Department::create($request->validated());
        return response()->json(['message' => 'Department created', 'department' => $department], 201);
    }

    public function update(StoreDepartmentRequest $request, Department $department)
    {
        if ($department->jobTitles()->where(function ($query) {
            $query->whereHas('jobs')->orWhereHas('requisitions');
        })->exists()) {
            return response()->json(['message' => 'This department has job applicants or requisitions and cannot be renamed.'], 409);
        }
        $department->update($request->validated());
        return response()->json(['message' => 'Department updated', 'department' => $department]);
    }

    public function destroy(Department $department)
    {
        if ($department->jobTitles()->where(function ($query) {
            $query->whereHas('jobs')->orWhereHas('requisitions');
        })->exists()) {
            return response()->json([
                'message' => 'This department contains job titles used by jobs or requisitions and cannot be deleted.',
            ], 409);
        }

        $department->delete();
        return response()->json(['message' => 'Department deleted']);
    }
}
