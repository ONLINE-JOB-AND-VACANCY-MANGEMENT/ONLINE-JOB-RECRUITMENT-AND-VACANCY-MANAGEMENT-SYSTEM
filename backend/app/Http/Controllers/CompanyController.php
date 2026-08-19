<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\UpdateCompanyRequest;

class CompanyController extends Controller
{
    public function store(UpdateCompanyRequest $request)
{
    if ($request->user()->company) {
        return response()->json(['message' => 'Company profile already exists'], 409);
    }

    $data = $request->validated();

    if ($request->hasFile('logo')) {
        $data['logo'] = $this->fileUploadService->upload($request->file('logo'), 'logos');
    }

    $data['user_id'] = $request->user()->id;
    $company = Company::create($data);

    return response()->json(['message' => 'Company profile created', 'company' => $company], 201);
}
}
