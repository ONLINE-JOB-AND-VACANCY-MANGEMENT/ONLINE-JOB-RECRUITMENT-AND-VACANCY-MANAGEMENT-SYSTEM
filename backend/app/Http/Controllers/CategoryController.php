<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Models\Category;
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