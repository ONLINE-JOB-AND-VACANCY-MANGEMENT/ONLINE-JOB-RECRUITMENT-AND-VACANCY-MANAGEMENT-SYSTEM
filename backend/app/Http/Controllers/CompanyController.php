<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateCompanyRequest;
use App\Models\Company;
use App\Services\FileUploadService;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function __construct(protected FileUploadService $fileUploadService) {}

    // GET /companies (public)
    public function index()
    {
        return Company::first();
    }

    // GET /companies/{company} (public)
    public function show(Company $company)
    {
        return $company;
    }

    // GET /my-company (employer)
    public function myCompany()
    {
        $company = Company::first();

        if (!$company) {
            return response()->json(['message' => 'Company profile has not been created yet'], 404);
        }

        return $company;
    }

    // POST /my-company (employer) — create the singleton, once
    public function store(UpdateCompanyRequest $request)
    {
        if (Company::exists()) {
            return response()->json(['message' => 'Company profile already exists'], 409);
        }

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            $data['logo'] = $this->fileUploadService->upload($request->file('logo'), 'logos');
        }

        $company = Company::create($data);

        return response()->json(['message' => 'Company profile created', 'company' => $company], 201);
    }

    // PUT /my-company (employer) — update the singleton
    public function update(UpdateCompanyRequest $request)
    {
        $company = Company::first();

        if (!$company) {
            return response()->json(['message' => 'Company profile does not exist yet. Create it first.'], 404);
        }

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            $this->fileUploadService->delete($company->logo);
            $data['logo'] = $this->fileUploadService->upload($request->file('logo'), 'logos');
        }

        $company->update($data);

        return response()->json(['message' => 'Company profile updated', 'company' => $company]);
    }
}