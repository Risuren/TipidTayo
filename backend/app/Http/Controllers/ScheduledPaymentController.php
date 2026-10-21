<?php

namespace App\Http\Controllers;

use App\Models\ScheduledPayment;
use App\Models\Expense;
use App\Models\ReservedExpense;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduledPaymentController extends Controller
{
    /**
     * Get all scheduled payments for the user's active cycle
     */
    public function index(Request $request)
    {
        $cycle = $request->user()->activeCycle;
        if (!$cycle) {
            return response()->json([]);
        }

        $payments = ScheduledPayment::where('cycle_id', $cycle->id)
            ->with(['reservedExpense', 'paidExpense'])
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json($payments);
    }

    /**
     * Create a new scheduled future payment / vault commitment
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $cycle = $user->activeCycle;
        if (!$cycle) {
            return response()->json(['error' => 'Kailangan munang mag-setup ng budget cycle bago mag-schedule ng payment.'], 422);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'category' => ['required', 'in:Food,Transportation,School Expenses,Personal Needs'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'target_day' => ['required', 'integer', 'min:1', 'max:' . $cycle->total_days],
            'due_date' => ['required', 'date'],
            'reserve_id' => ['nullable', 'exists:reserved_expenses,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $tz = 'Asia/Manila';
        $today = Carbon::now($tz)->startOfDay();
        $dueDate = Carbon::parse($validated['due_date'], $tz)->startOfDay();

        // Must not be in the past
        if ($dueDate->lessThan($today)) {
            return response()->json([
                'error' => 'Hindi puwedeng mag-schedule ng payment sa nakalipas na petsa. Piliin ang araw ngayon o darating na araw.',
            ], 422);
        }

        $scheduled = ScheduledPayment::create([
            'user_id' => $user->id,
            'cycle_id' => $cycle->id,
            'reserve_id' => $validated['reserve_id'] ?? null,
            'title' => trim($validated['title']),
            'category' => $validated['category'],
            'amount' => (float)$validated['amount'],
            'target_day' => (int)$validated['target_day'],
            'due_date' => $dueDate->toDateString(),
            'status' => 'scheduled',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Nai-schedule ang payment para sa Day ' . $scheduled->target_day . '!',
            'scheduled_payment' => $scheduled->load('reservedExpense'),
            'dashboard' => $cycle->fresh()->computeDashboard(),
        ], 201);
    }

    /**
     * Convert scheduled payment into an official recorded Expense (1-click Pay)
     */
    public function pay(Request $request, ScheduledPayment $scheduledPayment)
    {
        $user = $request->user();
        if ($scheduledPayment->user_id !== $user->id) {
            abort(403);
        }

        if ($scheduledPayment->status === 'paid') {
            return response()->json(['error' => 'Nai-bayad na ang scheduled payment na ito.'], 422);
        }

        $cycle = $scheduledPayment->budgetCycle;
        if (!$cycle) {
            return response()->json(['error' => 'Active budget cycle not found.'], 422);
        }

        return DB::transaction(function () use ($user, $cycle, $scheduledPayment) {
            $tz = 'Asia/Manila';
            $reserveId = $scheduledPayment->reserve_id;
            $isFromReserved = false;

            if ($reserveId) {
                $reserve = ReservedExpense::where('id', $reserveId)->where('cycle_id', $cycle->id)->first();
                if ($reserve) {
                    $isFromReserved = true;
                    $reserve->increment('spent_amount', $scheduledPayment->amount);
                } else {
                    $reserveId = null;
                }
            }

            $expense = Expense::create([
                'user_id' => $user->id,
                'cycle_id' => $cycle->id,
                'reserve_id' => $reserveId,
                'title' => $scheduledPayment->title,
                'category' => $scheduledPayment->category,
                'amount' => $scheduledPayment->amount,
                'is_from_reserved' => $isFromReserved,
                'logged_via' => 'Manual',
                'logged_at' => Carbon::now($tz),
            ]);

            $scheduledPayment->update([
                'status' => 'paid',
                'paid_expense_id' => $expense->id,
            ]);

            return response()->json([
                'message' => 'Matagumpay na na-record ang gastos para sa ' . $scheduledPayment->title . '!',
                'expense' => $expense,
                'scheduled_payment' => $scheduledPayment->fresh(['reservedExpense', 'paidExpense']),
                'dashboard' => $cycle->fresh()->computeDashboard(),
            ]);
        });
    }

    /**
     * Cancel / delete a scheduled payment
     */
    public function destroy(Request $request, ScheduledPayment $scheduledPayment)
    {
        if ($scheduledPayment->user_id !== $request->user()->id) {
            abort(403);
        }

        $cycle = $scheduledPayment->budgetCycle;
        $scheduledPayment->delete();

        return response()->json([
            'message' => 'Nai-cancel ang scheduled payment.',
            'dashboard' => $cycle ? $cycle->fresh()->computeDashboard() : null,
        ]);
    }
}
