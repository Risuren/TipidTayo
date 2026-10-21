<?php

namespace App\Http\Controllers;

use App\Models\BudgetCycle;
use App\Models\ReservedExpense;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    /**
     * Complete interactive onboarding: creates initial budget cycle + reserves + optional past expenses
     */
    public function complete(Request $request)
    {
        $validated = $request->validate([
            'total_allowance' => ['required', 'numeric', 'min:1'],
            'total_days' => ['required', 'integer', 'min:1', 'max:365'],
            'savings_goal' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'reserves' => ['nullable', 'array'],
            'reserves.*.title' => ['required', 'string', 'max:150'],
            'reserves.*.category' => ['required', 'in:Food,Transportation,School Expenses,Personal Needs'],
            'reserves.*.allocated_amount' => ['required', 'numeric', 'min:0'],
            'reserves.*.is_optional' => ['nullable', 'boolean'],
            'past_spent_amount' => ['nullable', 'numeric', 'min:0'],
            'past_spent_note' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($user, $validated) {
            // Deactivate any existing cycles
            BudgetCycle::where('user_id', $user->id)->update(['is_active' => false]);

            $startDate = !empty($validated['start_date'])
                ? Carbon::parse($validated['start_date'], 'Asia/Manila')->toDateString()
                : Carbon::now('Asia/Manila')->toDateString();

            $cycle = BudgetCycle::create([
                'user_id' => $user->id,
                'label' => 'My First Budget Cycle',
                'total_allowance' => $validated['total_allowance'],
                'total_days' => $validated['total_days'],
                'start_date' => $startDate,
                'savings_goal' => $validated['savings_goal'] ?? 0,
                'is_active' => true,
                'ai_provider' => 'groq',
            ]);

            if (!empty($validated['reserves'])) {
                foreach ($validated['reserves'] as $res) {
                    if ((float)$res['allocated_amount'] > 0) {
                        ReservedExpense::create([
                            'user_id' => $user->id,
                            'cycle_id' => $cycle->id,
                            'title' => $res['title'],
                            'category' => $res['category'],
                            'allocated_amount' => $res['allocated_amount'],
                            'spent_amount' => 0,
                            'is_optional' => (bool)($res['is_optional'] ?? false),
                        ]);
                    }
                }
            }

            // If the user started their cycle in the past and logged previous expenses
            if (!empty($validated['past_spent_amount']) && (float)$validated['past_spent_amount'] > 0) {
                $tz = 'Asia/Manila';
                $today = Carbon::now($tz)->startOfDay();
                $startDateObj = Carbon::parse($startDate, $tz)->startOfDay();

                // Assign logged_at to the cycle start date or yesterday so it is accurately counted as past unreserved spent
                $loggedAt = $startDateObj->copy()->setTime(12, 0, 0);
                if ($loggedAt->gte($today)) {
                    $loggedAt = $today->copy()->subDay()->setTime(12, 0, 0);
                }

                Expense::create([
                    'user_id' => $user->id,
                    'cycle_id' => $cycle->id,
                    'reserve_id' => null,
                    'title' => !empty($validated['past_spent_note']) ? trim($validated['past_spent_note']) : 'Previous Days Expenses (Pre-TipidTayo)',
                    'category' => 'Food',
                    'amount' => (float)$validated['past_spent_amount'],
                    'is_from_reserved' => false,
                    'logged_via' => 'onboarding_setup',
                    'logged_at' => $loggedAt,
                ]);
            }

            $user->update([
                'onboarding_completed' => true,
                'has_seen_tutorial' => false,
            ]);

            return response()->json([
                'message' => 'Naka-set up na ang iyong allowance at reserves! Simulan na natin!',
                'cycle' => $cycle,
                'dashboard' => $cycle->computeDashboard(),
                'user' => $user->fresh(),
            ], 201);
        });
    }

    /**
     * Mark walkthrough tutorial as completed
     */
    public function markTutorialSeen(Request $request)
    {
        $request->user()->update(['has_seen_tutorial' => true]);
        return response()->json(['message' => 'Tutorial marked as seen.']);
    }

    /**
     * Reset tutorial status so user can replay the interactive walkthrough
     */
    public function replayTutorial(Request $request)
    {
        $request->user()->update(['has_seen_tutorial' => false]);
        return response()->json(['message' => 'Tutorial reset. Ready for walkthrough.']);
    }
}
