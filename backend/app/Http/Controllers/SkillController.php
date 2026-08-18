<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use Illuminate\Http\Request;

class SkillController extends Controller
{
    public function index()
    {
        return Skill::orderBy('name')->get();
    }

    public function store(Request $request)
    {
        if ($request->user()->role?->name !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate(['name' => 'required|string|max:255|unique:skills,name']);
        $skill = Skill::create(['name' => $request->name]);

        return response()->json(['message' => 'Skill created', 'skill' => $skill], 201);
    }

    public function destroy(Request $request, Skill $skill)
    {
        if ($request->user()->role?->name !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $skill->delete();
        return response()->json(['message' => 'Skill deleted']);
    }
}