<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\FileUploadService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(protected FileUploadService $fileUploadService) {}

    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        if ($request->hasFile('profile_photo')) {
            $this->fileUploadService->delete($user->profile_photo);
            $data['profile_photo'] = $this->fileUploadService->upload($request->file('profile_photo'), 'profile-photos');
        }

        $user->update($data);

        return response()->json(['message' => 'Profile updated', 'user' => new UserResource($user->load('role'))]);
    }

    // Admin-only user management
    public function index(Request $request)
    {
        if ($request->user()->role?->name !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return UserResource::collection(User::with('role')->paginate(20));
    }

    public function toggleActive(Request $request, User $user)
    {
        if ($request->user()->role?->name !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json(['message' => 'User status updated', 'user' => new UserResource($user)]);
    }
}