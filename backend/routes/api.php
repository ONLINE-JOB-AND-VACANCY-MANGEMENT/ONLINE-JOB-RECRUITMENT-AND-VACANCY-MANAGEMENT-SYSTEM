<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\JobController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\NotificationController;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Public
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/skills', [SkillController::class, 'index']);
Route::get('/companies', [CompanyController::class, 'index']);
Route::get('/companies/{company}', [CompanyController::class, 'show']);

// Any authenticated user
Route::middleware('auth:sanctum')->group(function () {
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::post('/jobs/{job}/bookmark', [BookmarkController::class, 'store']);
    Route::delete('/jobs/{job}/bookmark', [BookmarkController::class, 'destroy']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
});

// Employer only
Route::middleware(['auth:sanctum', 'role:employer'])->group(function () {
    Route::get('/my-company', [CompanyController::class, 'myCompany']);
    Route::put('/my-company', [CompanyController::class, 'update']);
});

// Admin only
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    Route::post('/skills', [SkillController::class, 'store']);
    Route::delete('/skills/{skill}', [SkillController::class, 'destroy']);
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{user}/toggle-active', [UserController::class, 'toggleActive']);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});

// Public
Route::get('/jobs', [JobController::class, 'index']);
Route::get('/jobs/{job}', [JobController::class, 'show']);

// Employer only
Route::middleware(['auth:sanctum', 'role:employer,admin'])->group(function () {
    Route::post('/jobs', [JobController::class, 'store']);
    Route::put('/jobs/{job}', [JobController::class, 'update']);
    Route::patch('/jobs/{job}', [JobController::class, 'update']);
    Route::delete('/jobs/{job}', [JobController::class, 'destroy']);
});
Route::middleware(['auth:sanctum', 'role:job_seeker'])->group(function () {
    Route::post('/jobs/{job}/apply', [ApplicationController::class, 'store']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
});

Route::middleware(['auth:sanctum', 'role:employer'])->group(function () {
    Route::get('/jobs/{job}/applicants', [ApplicationController::class, 'jobApplicants']);
    Route::patch('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);
    Route::post('/applications/{application}/schedule-exam', [ApplicationController::class, 'scheduleExam']);
Route::post('/applications/{application}/schedule-interview', [ApplicationController::class, 'scheduleInterview']);
});