<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SkillController extends Controller
{
    public function index()
    {
        return Cache::remember('skills.all', 3600, function () {
            return Skill::orderBy('name')->get();
        });
    }

    public function store(Request $request)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate(['name' => 'required|string|max:255|unique:skills,name']);
        $skill = Skill::create(['name' => $request->name]);
        Cache::forget('skills.all');

        return response()->json(['message' => 'Skill created', 'skill' => $skill], 201);
    }

    public function destroy(Request $request, Skill $skill)
    {
        if ($request->user()->role?->name !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $skill->delete();
        Cache::forget('skills.all');
        return response()->json(['message' => 'Skill deleted']);
    }
}
