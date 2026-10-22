<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\GoogleOAuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\BudgetCycleController;
use App\Http\Controllers\ReserveController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\AIAgentController;
use App\Http\Controllers\ScheduledPaymentController;
use App\Http\Controllers\CommunityTipController;

/*
|--------------------------------------------------------------------------
| API Routes — TipidTayo Full-Stack
|--------------------------------------------------------------------------
*/

// System Health & Database Diagnostic Route
Route::get('/health', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbName = \Illuminate\Support\Facades\DB::connection()->getDatabaseName();
        $tables = \Illuminate\Support\Facades\DB::select('SHOW TABLES');
        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
            'database_name' => $dbName,
            'tables_count' => count($tables),
            'tables' => $tables,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'database' => 'connection_failed',
            'message' => $e->getMessage(),
        ], 500);
    }
});

// Public Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/forgot-password', [PasswordResetController::class, 'sendLink']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);
Route::get('/auth/google/redirect', [GoogleOAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleOAuthController::class, 'callback']);

// Protected User & Budget Routes
Route::middleware('auth:sanctum')->group(function () {
    // Current User & Session
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Onboarding & Tutorial Walkthrough
    Route::post('/onboarding/complete', [OnboardingController::class, 'complete']);
    Route::post('/onboarding/tutorial/seen', [OnboardingController::class, 'markTutorialSeen']);
    Route::post('/onboarding/tutorial/replay', [OnboardingController::class, 'replayTutorial']);

    // Budget Cycles & Real-time Math Dashboard
    Route::get('/budget-cycles/active', [BudgetCycleController::class, 'active']);
    Route::get('/budget-cycles/{id}/dashboard', [BudgetCycleController::class, 'dashboard']);
    Route::apiResource('budget-cycles', BudgetCycleController::class);

    // Reserved Essentials Vaults
    Route::apiResource('reserves', ReserveController::class);

    // Expenses & Purchases
    Route::apiResource('expenses', ExpenseController::class);

    // Scheduled Future Vault Payments & Commitments
    Route::get('/scheduled-payments', [ScheduledPaymentController::class, 'index']);
    Route::post('/scheduled-payments', [ScheduledPaymentController::class, 'store']);
    Route::post('/scheduled-payments/{scheduledPayment}/pay', [ScheduledPaymentController::class, 'pay']);
    Route::delete('/scheduled-payments/{scheduledPayment}', [ScheduledPaymentController::class, 'destroy']);

    // TiPig AI Agent Integration (Chat, What-if Simulator, Taglish Expense Parser)
    Route::post('/ai/interact', [AIAgentController::class, 'interact']);

    // Community Diskarte Hub (Peer student tips, survival hacks & upvotes)
    Route::get('/community-tips', [CommunityTipController::class, 'index']);
    Route::post('/community-tips', [CommunityTipController::class, 'store']);
    Route::post('/community-tips/{id}/upvote', [CommunityTipController::class, 'upvote']);
});
