<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMainCategoryRequest;
use App\Models\MainCategory;

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
        $mainCategory->update(['name' => $request->name]);
        return response()->json(['message' => 'Main category updated', 'main_category' => $mainCategory]);
    }

    public function destroy(MainCategory $mainCategory)
    {
        $mainCategory->delete();
        return response()->json(['message' => 'Main category deleted']);
    }
}
