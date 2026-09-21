<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMainCategoryRequest;
use App\Models\MainCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Models\Department;
use App\Models\JobTitle;

class MainCategoryController extends Controller
{
    public function index()
    {
        return MainCategory::withCount('departments')->orderBy('name')->get();
    }

    public function store(StoreMainCategoryRequest $request)
    {
        $mainCategory = MainCategory::create(['name' => $request->name]);
        return response()->json(['message' => 'Main category created', 'main_category' => $mainCategory], 201);
    }

    public function update(StoreMainCategoryRequest $request, MainCategory $mainCategory)
    {
        if ($mainCategory->departments()->whereHas('jobTitles', function ($query) {
            $query->whereHas('jobs')->orWhereHas('requisitions');
        })->exists()) {
            return response()->json(['message' => 'This category has job applicants or requisitions and cannot be renamed.'], 409);
        }
        if (in_array(strtolower($mainCategory->name), ['academic', 'admin'], true)
            && strtolower($request->name) !== strtolower($mainCategory->name)) {
            return response()->json(['message' => 'Academic and Admin categories are protected.'], 422);
        }

        $mainCategory->update(['name' => $request->name]);
        return response()->json(['message' => 'Main category updated', 'main_category' => $mainCategory]);
    }

    public function destroy(MainCategory $mainCategory)
    {
        if (in_array(strtolower($mainCategory->name), ['academic', 'admin'], true)) {
            return response()->json(['message' => 'Academic and Admin categories are protected.'], 422);
        }

        if ($mainCategory->departments()->whereHas('jobTitles', function ($query) {
            $query->whereHas('jobs')->orWhereHas('requisitions');
        })->exists()) {
            return response()->json([
                'message' => 'This category contains job titles used by jobs or requisitions and cannot be deleted.',
            ], 409);
        }

        $mainCategory->delete();
        return response()->json(['message' => 'Main category deleted']);
    }

    /**
     * Import or update the complete catalog from a CSV file.
     *
     * Expected columns are main_category, department, job_title, description,
     * requirements and optional salary_entry, salary_mid, salary_senior and
     * salary_executive columns.
     */
    public function import(Request $request)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'rb');
        $headers = fgetcsv($handle);
        if (!$headers) {
            return response()->json(['message' => 'The CSV file is empty.'], 422);
        }

        $headers = array_map(function ($header) {
            $header = preg_replace('/^\xEF\xBB\xBF/', '', (string) $header);
            $header = strtolower(trim(str_replace([' ', '-'], '_', $header)));
            return match ($header) {
                'category', 'maincategory', 'main_category_name' => 'main_category',
                'jobtitle', 'job_title_name', 'position' => 'job_title',
                default => $header,
            };
        }, $headers);

        $required = ['main_category', 'department', 'job_title'];
        if (count(array_intersect($required, $headers)) !== count($required)) {
            return response()->json([
                'message' => 'CSV must contain main_category, department and job_title columns.',
            ], 422);
        }

        $created = 0;
        $errors = [];

        try {
            DB::transaction(function () use ($handle, $headers, &$created, &$errors) {
                $rowNumber = 1;
                while (($values = fgetcsv($handle)) !== false) {
                    $rowNumber++;
                    if (count(array_filter($values, fn ($value) => trim((string) $value) !== '')) === 0) {
                        continue;
                    }

                    $row = array_combine($headers, array_slice(array_pad($values, count($headers), ''), 0, count($headers)));
                    $categoryName = trim((string) ($row['main_category'] ?? $row['category'] ?? ''));
                    $departmentName = trim((string) ($row['department'] ?? ''));
                    $titleName = trim((string) ($row['job_title'] ?? $row['title'] ?? ''));
                    if (!$categoryName || !$departmentName || !$titleName) {
                        $errors[] = "Row {$rowNumber}: category, department and job title are required.";
                        continue;
                    }
                    $category = MainCategory::where('name', $categoryName)->first();
                    if ($category) {
                        $department = $category->departments()->where('name', $departmentName)->first();
                        if ($department && $department->jobTitles()->where('name', $titleName)->exists()) {
                            throw new \RuntimeException("Row {$rowNumber}: this catalog already exists and cannot be overwritten.");
                        }
                    }

                    $category = $category ?: MainCategory::create(['name' => $categoryName]);
                    $department = Department::firstOrCreate([
                        'main_category_id' => $category->id,
                        'name' => $departmentName,
                    ]);

                    $jobTitle = new JobTitle([
                        'department_id' => $department->id,
                        'name' => $titleName,
                        'description' => $row['description'] ?? null,
                        'requirements' => $row['requirements'] ?? null,
                        'salary' => ($row['salary'] ?? '') !== '' ? (float) $row['salary'] : null,
                    ]);
                    $jobTitle->save();
                    $created++;
                }

                if ($errors) {
                    throw new \RuntimeException(implode(' ', $errors));
                }
            });
        } catch (\RuntimeException $exception) {
            fclose($handle);
            return response()->json(['message' => $exception->getMessage()], 422);
        }
        fclose($handle);

        return response()->json([
            'message' => 'Catalog imported successfully.',
            'created' => $created,
        ]);
    }
}
