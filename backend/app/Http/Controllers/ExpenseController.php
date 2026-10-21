<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ReservedExpense;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $cycle = $request->user()->activeCycle;
        if (!$cycle) {
            return response()->json([]);
        }

        $query = Expense::where('cycle_id', $cycle->id)->orderBy('logged_at', 'desc');

        if ($request->has('category') && !empty($request->category)) {
            $query->where('category', $request->category);
        }

        $expenses = $query->paginate(20);
        return response()->json($expenses);
    }

    public function store(Request $request)
    {
        $cycle = $request->user()->activeCycle;
        if (!$cycle) {
            return response()->json(['error' => 'Kailangan munang mag-setup ng budget cycle bago maglista ng gastos.'], 422);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'category' => ['required', 'in:Food,Transportation,School Expenses,Personal Needs'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reserve_id' => ['nullable', 'exists:reserved_expenses,id'],
            'is_from_reserved' => ['nullable', 'boolean'],
            'logged_at' => ['nullable', 'date'],
        ]);

        return DB::transaction(function () use ($request, $cycle, $validated) {
            $reserveId = $validated['reserve_id'] ?? null;
            $isFromReserved = (bool)($validated['is_from_reserved'] ?? false);

            if ($reserveId) {
                $reserve = ReservedExpense::where('id', $reserveId)
                    ->where('cycle_id', $cycle->id)
                    ->first();
                if ($reserve) {
                    $isFromReserved = true;
                    $reserve->increment('spent_amount', $validated['amount']);
                } else {
                    $reserveId = null;
                    $isFromReserved = false;
                }
            }

            $loggedAt = !empty($validated['logged_at'])
                ? Carbon::parse($validated['logged_at'], 'Asia/Manila')->setTimezone('Asia/Manila')
                : Carbon::now('Asia/Manila');

            $todayEnd = Carbon::now('Asia/Manila')->endOfDay();
            if ($loggedAt->greaterThan($todayEnd)) {
                return response()->json([
                    'error' => 'Hindi pa puwedeng maglista ng gastos para sa future date dahil hindi pa ito nangyayari. Gamitin ang "Schedule Payment" para maglaan ng pondo sa darating na araw.',
                ], 422);
            }

            $expense = Expense::create([
                'user_id' => $request->user()->id,
                'cycle_id' => $cycle->id,
                'reserve_id' => $reserveId,
                'title' => $validated['title'],
                'category' => $validated['category'],
                'amount' => $validated['amount'],
                'is_from_reserved' => $isFromReserved,
                'logged_via' => 'Manual',
                'logged_at' => $loggedAt,
            ]);

            return response()->json([
                'message' => 'Expense recorded successfully.',
                'expense' => $expense,
                'dashboard' => $cycle->fresh()->computeDashboard(),
            ], 201);
        });
    }

    public function update(Request $request, Expense $expense)
    {
        if ($expense->user_id !== $request->user()->id) {
            abort(403);
        }

        $cycle = $expense->budgetCycle;
        if (!$cycle) {
            return response()->json(['error' => 'Active budget cycle not found.'], 422);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'category' => ['required', 'in:Food,Transportation,School Expenses,Personal Needs'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reserve_id' => ['nullable', 'exists:reserved_expenses,id'],
            'is_from_reserved' => ['nullable', 'boolean'],
            'logged_at' => ['nullable', 'date'],
        ]);

        return DB::transaction(function () use ($request, $expense, $cycle, $validated) {
            $oldReserveId = $expense->reserve_id;
            $oldIsFromReserved = (bool)$expense->is_from_reserved;
            $oldAmount = (float)$expense->amount;

            $newReserveId = $validated['reserve_id'] ?? null;
            $newIsFromReserved = (bool)($validated['is_from_reserved'] ?? false);
            $newAmount = (float)$validated['amount'];

            if ($newReserveId) {
                $reserve = ReservedExpense::where('id', $newReserveId)
                    ->where('cycle_id', $cycle->id)
                    ->first();
                if ($reserve) {
                    $newIsFromReserved = true;
                } else {
                    $newReserveId = null;
                    $newIsFromReserved = false;
                }
            }

            // Adjust old reserve balance if previously linked
            if ($oldIsFromReserved && $oldReserveId) {
                $oldReserve = ReservedExpense::find($oldReserveId);
                if ($oldReserve) {
                    $oldReserve->decrement('spent_amount', min($oldReserve->spent_amount, $oldAmount));
                }
            }

            // Adjust new reserve balance if newly linked
            if ($newIsFromReserved && $newReserveId) {
                $newReserve = ReservedExpense::find($newReserveId);
                if ($newReserve) {
                    $newReserve->increment('spent_amount', $newAmount);
                }
            }

            $loggedAt = !empty($validated['logged_at'])
                ? Carbon::parse($validated['logged_at'], 'Asia/Manila')->setTimezone('Asia/Manila')
                : $expense->logged_at;

            $todayEnd = Carbon::now('Asia/Manila')->endOfDay();
            if ($loggedAt->greaterThan($todayEnd)) {
                return response()->json([
                    'error' => 'Hindi pa puwedeng ilipat ang gastos sa future date dahil hindi pa ito nangyayari.',
                ], 422);
            }

            $expense->update([
                'reserve_id' => $newReserveId,
                'title' => $validated['title'],
                'category' => $validated['category'],
                'amount' => $newAmount,
                'is_from_reserved' => $newIsFromReserved,
                'logged_at' => $loggedAt,
            ]);

            return response()->json([
                'message' => 'Expense updated successfully.',
                'expense' => $expense->fresh(),
                'dashboard' => $cycle->fresh()->computeDashboard(),
            ]);
        });
    }

    public function destroy(Request $request, Expense $expense)
    {
        if ($expense->user_id !== $request->user()->id) {
            abort(403);
        }

        return DB::transaction(function () use ($expense) {
            $cycle = $expense->budgetCycle;

            if ($expense->is_from_reserved && $expense->reserve_id) {
                $reserve = ReservedExpense::find($expense->reserve_id);
                if ($reserve) {
                    $reserve->decrement('spent_amount', min($reserve->spent_amount, $expense->amount));
                }
            }

            $expense->delete();

            return response()->json([
                'message' => 'Expense deleted successfully.',
                'dashboard' => $cycle ? $cycle->computeDashboard() : null,
            ]);
        });
    }
}
