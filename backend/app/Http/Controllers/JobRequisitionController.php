<?php

namespace App\Http\Controllers;

use App\Http\Requests\RejectRequisitionRequest;
use App\Http\Requests\StoreRequisitionRequest;
use App\Http\Requests\UpdateRequisitionHrFieldsRequest;
use App\Http\Resources\JobRequisitionResource;
use App\Models\JobRequisition;
use App\Services\RequisitionService;
use Illuminate\Http\Request;

class JobRequisitionController extends Controller
{
    public function __construct(protected RequisitionService $requisitionService) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = JobRequisition::with(['jobTitle.department.mainCategory', 'requestedBy', 'approvedBy', 'skills']);

        // Managers see only their own; HR sees all
        if ($user->role?->name === 'manager') {
            $query->where('requested_by', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return JobRequisitionResource::collection($query->latest()->paginate(15));
    }

    public function show(JobRequisition $requisition)
    {
        return new JobRequisitionResource($requisition->load(['jobTitle.department.mainCategory', 'requestedBy', 'approvedBy', 'skills']));
    }

    public function store(StoreRequisitionRequest $request)
    {
        $requisition = $this->requisitionService->create($request->validated());
        return response()->json(['message' => 'Requisition created as draft', 'requisition' => new JobRequisitionResource($requisition)], 201);
    }

    public function update(StoreRequisitionRequest $request, JobRequisition $requisition)
    {
        if ($requisition->requested_by !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        try {
            $requisition = $this->requisitionService->update($requisition, $request->validated());
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Requisition updated', 'requisition' => new JobRequisitionResource($requisition)]);
    }

    // HR-only narrow edit: salary range + application window.
    public function hrUpdate(UpdateRequisitionHrFieldsRequest $request, JobRequisition $requisition)
    {
        try {
            $requisition = $this->requisitionService->updateHrFields($requisition, $request->validated());
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Requisition updated', 'requisition' => new JobRequisitionResource($requisition)]);
    }

    public function submit(Request $request, JobRequisition $requisition)
    {
        if ($requisition->requested_by !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        try {
            $requisition = $this->requisitionService->submit($requisition);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Requisition submitted for approval', 'requisition' => new JobRequisitionResource($requisition)]);
    }

    public function approve(JobRequisition $requisition)
    {
        try {
            $requisition = $this->requisitionService->approve($requisition);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Requisition approved', 'requisition' => new JobRequisitionResource($requisition)]);
    }

    public function reject(RejectRequisitionRequest $request, JobRequisition $requisition)
    {
        try {
            $requisition = $this->requisitionService->reject($requisition, $request->rejection_reason);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Requisition rejected', 'requisition' => new JobRequisitionResource($requisition)]);
    }

    public function markReadyToPost(JobRequisition $requisition)
    {
        try {
            $requisition = $this->requisitionService->markReadyToPost($requisition);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['message' => 'Requisition marked ready to post', 'requisition' => new JobRequisitionResource($requisition)]);
    }
}
