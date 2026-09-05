<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\JobController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\MainCategoryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\JobTitleController;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\JobRequisitionController;
use App\Http\Controllers\JobFeedController;

// Public
Route::get('/feed/jobs', [JobFeedController::class, 'index']);
Route::get('/jobs', [JobController::class, 'index']);
Route::get('/jobs/{job}', [JobController::class, 'show']);

Route::get('/main-categories', [MainCategoryController::class, 'index']);
Route::get('/departments', [DepartmentController::class, 'index']);
Route::get('/job-titles', [JobTitleController::class, 'index']);
Route::get('/skills', [SkillController::class, 'index']);
Route::get('/companies', [CompanyController::class, 'index']);
Route::get('/companies/{company}', [CompanyController::class, 'show']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Any authenticated user
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::post('/jobs/{job}/bookmark', [BookmarkController::class, 'store']);
    Route::delete('/jobs/{job}/bookmark', [BookmarkController::class, 'destroy']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    // Staff management listing (all jobs, any status) — job seekers blocked inside the controller.
    Route::get('/internal-jobs', [JobController::class, 'manageIndex']);
});

// Manager only
Route::middleware(['auth:sanctum', 'role:manager'])->group(function () {
    Route::post('/requisitions', [JobRequisitionController::class, 'store']);
    Route::put('/requisitions/{requisition}', [JobRequisitionController::class, 'update']);
    Route::post('/requisitions/{requisition}/submit', [JobRequisitionController::class, 'submit']);
});

// Manager or HR
Route::middleware(['auth:sanctum', 'role:manager,employer'])->group(function () {
    Route::post('/job-titles', [JobTitleController::class, 'store']);
    Route::get('/requisitions', [JobRequisitionController::class, 'index']);
    Route::get('/requisitions/{requisition}', [JobRequisitionController::class, 'show']);
});

// HR (employer) only
Route::middleware(['auth:sanctum', 'role:employer'])->group(function () {
    Route::post('/main-categories', [MainCategoryController::class, 'store']);
    Route::put('/main-categories/{mainCategory}', [MainCategoryController::class, 'update']);
    Route::delete('/main-categories/{mainCategory}', [MainCategoryController::class, 'destroy']);

    Route::post('/departments', [DepartmentController::class, 'store']);
    Route::put('/departments/{department}', [DepartmentController::class, 'update']);
    Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);

    Route::delete('/job-titles/{jobTitle}', [JobTitleController::class, 'destroy']);

    Route::post('/skills', [SkillController::class, 'store']);
    Route::delete('/skills/{skill}', [SkillController::class, 'destroy']);

    Route::post('/requisitions/{requisition}/approve', [JobRequisitionController::class, 'approve']);
    Route::post('/requisitions/{requisition}/reject', [JobRequisitionController::class, 'reject']);
    Route::post('/requisitions/{requisition}/ready-to-post', [JobRequisitionController::class, 'markReadyToPost']);
    Route::patch('/requisitions/{requisition}/hr-fields', [JobRequisitionController::class, 'hrUpdate']);

    Route::get('/my-company', [CompanyController::class, 'myCompany']);
    Route::put('/my-company', [CompanyController::class, 'update']);
    Route::post('/my-company', [CompanyController::class, 'store']);

    Route::get('/jobs/{job}/applicants', [ApplicationController::class, 'jobApplicants']);
    Route::get('/jobs/{job}/applicants/export', [ApplicationController::class, 'exportApplicants']);
    Route::patch('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);
    Route::post('/applications/{application}/schedule-exam', [ApplicationController::class, 'scheduleExam']);
    Route::post('/applications/{application}/schedule-interview', [ApplicationController::class, 'scheduleInterview']);
});

// Admin only
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    Route::post('/staff', [UserController::class, 'storeStaff']);
});

// Employer or admin can post/manage jobs directly
Route::middleware(['auth:sanctum', 'role:employer,admin'])->group(function () {
    Route::post('/jobs', [JobController::class, 'store']);
    Route::put('/jobs/{job}', [JobController::class, 'update']);
    Route::patch('/jobs/{job}', [JobController::class, 'update']);
    Route::delete('/jobs/{job}', [JobController::class, 'destroy']);
});

// Job seeker only
Route::middleware(['auth:sanctum', 'role:job_seeker'])->group(function () {
    Route::post('/jobs/{job}/apply', [ApplicationController::class, 'store']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
});
