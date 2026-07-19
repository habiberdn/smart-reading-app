<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SuperadminDashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('superadmin/dashboard');
    }
}
