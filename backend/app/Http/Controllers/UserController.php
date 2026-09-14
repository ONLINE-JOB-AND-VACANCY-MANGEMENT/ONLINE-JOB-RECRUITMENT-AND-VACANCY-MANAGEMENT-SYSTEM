<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Mail\StaffWelcomeMail;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

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

        return response()->json(['message' => 'Profile updated', 'user' => new UserResource($user->load(['role', 'department']))]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();
        $user->update([
            'password' => Hash::make($request->validated()['password']),
            'must_change_password' => false,
        ]);

        return response()->json([
            'message' => 'Password changed successfully.',
            'user' => new UserResource($user->fresh()->load(['role', 'department'])),
        ]);
    }

    // Admin-only user management
    public function index(Request $request)
    {
        if ($request->user()->role?->name !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $users = $this->filteredUsers($request)
            ->with(['role', 'department'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return UserResource::collection($users)->additional([
            'stats' => $this->userStats(),
        ]);
    }

    public function export(Request $request)
    {
        if ($request->user()->role?->name !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $users = $this->filteredUsers($request)->with(['role', 'department'])->latest()->get();

        return response()->streamDownload(function () use ($users) {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['Name', 'Email', 'Role', 'Phone', 'Department', 'Status', 'Created at']);

            foreach ($users as $user) {
                fputcsv($output, [
                    $user->name,
                    $user->email,
                    $user->role?->name,
                    $user->phone,
                    $user->department?->name,
                    $user->is_active ? 'Active' : 'Inactive',
                    $user->created_at?->toDateTimeString(),
                ]);
            }

            fclose($output);
        }, 'users.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function toggleActive(Request $request, User $user)
    {
        if ($request->user()->role?->name !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json(['message' => 'User status updated', 'user' => new UserResource($user)]);
    }

    public function storeStaff(StoreStaffRequest $request)
    {
        $role = \App\Models\Role::where('name', $request->role)->firstOrFail();
        $name = trim($request->name);
        $fatherName = trim($request->father_name);
        $email = $this->uniqueStaffEmail($name, $fatherName);

        $user = \App\Models\User::create([
            'role_id' => $role->id,
            'name' => trim("{$name} {$fatherName}"),
            'email' => $email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'phone' => $request->phone,
            'department_id' => $request->department_id,
            'must_change_password' => true,
        ]);

        Mail::to($email)->send(new StaffWelcomeMail(
            $user->name,
            $email,
            $request->password,
        ));

        return response()->json(['message' => 'Staff account created', 'user' => new UserResource($user->load(['role', 'department']))], 201);
    }

    private function formatStaffEmail(string $name, string $fatherName): string
    {
        $normalize = static function (string $value): string {
            $value = strtolower(trim($value));
            $value = preg_replace('/\s+/', '.', $value);
            $value = preg_replace('/[^a-z0-9.]/', '', $value);
            $value = preg_replace('/\.{2,}/', '.', $value);

            return trim($value, '.');
        };

        return "{$normalize($name)}.{$normalize($fatherName)}@aastu.edu.net";
    }

    private function uniqueStaffEmail(string $name, string $fatherName): string
    {
        $base = $this->formatStaffEmail($name, $fatherName);
        [$localPart, $domain] = explode('@', $base, 2);
        $candidate = $base;
        $suffix = 2;

        while (User::where('email', $candidate)->exists()) {
            $candidate = "{$localPart}{$suffix}@{$domain}";
            $suffix++;
        }

        return $candidate;
    }

    private function filteredUsers(Request $request)
    {
        $query = User::query();
        $search = trim((string) $request->input('search', ''));

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (in_array($request->input('role'), ['admin', 'employer', 'manager', 'job_seeker'], true)) {
            $query->whereHas('role', fn ($builder) => $builder->where('name', $request->input('role')));
        }

        if (in_array($request->input('status'), ['active', 'inactive'], true)) {
            $query->where('is_active', $request->input('status') === 'active');
        }

        return $query;
    }

    private function userStats(): array
    {
        return [
            'total' => User::count(),
            'active' => User::where('is_active', true)->count(),
            'inactive' => User::where('is_active', false)->count(),
            'job_seekers' => User::whereHas('role', fn ($query) => $query->where('name', 'job_seeker'))->count(),
            'employers' => User::whereHas('role', fn ($query) => $query->where('name', 'employer'))->count(),
            'managers' => User::whereHas('role', fn ($query) => $query->where('name', 'manager'))->count(),
        ];
    }
}
