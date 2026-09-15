<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index()
    {
        return Announcement::where('is_published', true)->latest()->limit(5)->get(['id', 'title', 'message', 'created_at']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
        ]);
        $announcement = Announcement::create([...$data, 'created_by' => $request->user()->id]);

        return response()->json($announcement, 201);
    }

    public function destroy(Request $request, Announcement $announcement)
    {
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted']);
    }
}
