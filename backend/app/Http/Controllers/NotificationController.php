<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->notifications_custom()->latest()->paginate(20);
    }

    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Marked as read', 'notification' => $notification]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->notifications_custom()->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read']);
    }
}