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
        $department->update($request->validated());
        return response()->json(['message' => 'Department updated', 'department' => $department]);
    }

    public function destroy(Department $department)
    {
        $department->delete();
        return response()->json(['message' => 'Department deleted']);
    }
}
