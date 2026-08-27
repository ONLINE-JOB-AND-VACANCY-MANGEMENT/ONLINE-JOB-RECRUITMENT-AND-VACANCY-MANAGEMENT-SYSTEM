<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
public function index()
{
    return \Illuminate\Support\Facades\Cache::remember('categories.all', 3600, function () {
        return Category::withCount('jobs')->orderBy('name')->get();
    });
}

public function store(StoreCategoryRequest $request)
{
    $category = Category::create([
        'name' => $request->name,
        'slug' => Str::slug($request->name),
    ]);

    \Illuminate\Support\Facades\Cache::forget('categories.all');

    return response()->json(['message' => 'Category created', 'category' => $category], 201);
}

public function update(StoreCategoryRequest $request, Category $category)
{
    $category->update([
        'name' => $request->name,
        'slug' => Str::slug($request->name),
    ]);

    \Illuminate\Support\Facades\Cache::forget('categories.all');

    return response()->json(['message' => 'Category updated', 'category' => $category]);
}
public function linkSkills(Request $request, Category $category)
{
    if ($request->user()->role?->name !== 'employer') {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    $request->validate(['skills' => 'required|array', 'skills.*' => 'exists:skills,id']);
    $category->skills()->syncWithoutDetaching($request->skills);

    return response()->json(['message' => 'Skills linked', 'category' => $category->load('skills')]);
}

public function suggestedSkills(Category $category)
{
    return $category->load('skills')->skills;
}
public function destroy(Category $category)
{
    if (auth()->user()->role?->name !== 'admin') {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    $category->delete();
    \Illuminate\Support\Facades\Cache::forget('categories.all');

    return response()->json(['message' => 'Category deleted']);
}
}