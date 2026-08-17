<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\JobController;
use App\Http\Controllers\ApplicationController;

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