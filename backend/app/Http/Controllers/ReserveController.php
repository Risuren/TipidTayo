<?php

namespace App\Http\Controllers;

use App\Models\ReservedExpense;
use Illuminate\Http\Request;

class ReserveController extends Controller
{
    public function index(Request $request)
    {
        $cycle = $request->user()->activeCycle;
        if (!$cycle) {
            return response()->json([]);
        }
        $reserves = ReservedExpense::where('cycle_id', $cycle->id)
            ->with(['scheduledPayments' => function ($q) {
                $q->where('status', 'scheduled');
            }])
            ->get();
        return response()->json($reserves);
    }

    public function store(Request $request)
    {
        $cycle = $request->user()->activeCycle;
        if (!$cycle) {
            return response()->json(['error' => 'Kailangan munang mag-setup ng budget cycle bago mag-reserve.'], 422);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'category' => ['required', 'in:Food,Transportation,School Expenses,Personal Needs'],
            'allocated_amount' => ['required', 'numeric', 'min:0'],
            'is_optional' => ['nullable', 'boolean'],
        ]);

        $reserve = ReservedExpense::create([
            'user_id' => $request->user()->id,
            'cycle_id' => $cycle->id,
            'title' => $validated['title'],
            'category' => $validated['category'],
            'allocated_amount' => $validated['allocated_amount'],
            'spent_amount' => 0,
            'is_optional' => (bool)($validated['is_optional'] ?? false),
        ]);

        return response()->json([
            'message' => 'Naitabi na ang pondo para sa ' . $reserve->title . '!',
            'reserve' => $reserve,
            'dashboard' => $cycle->fresh()->computeDashboard(),
        ], 201);
    }

    public function update(Request $request, $reserve)
    {
        $model = $reserve instanceof ReservedExpense ? $reserve : ReservedExpense::findOrFail($reserve);
        if ($model->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'category' => ['sometimes', 'required', 'in:Food,Transportation,School Expenses,Personal Needs'],
            'allocated_amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_optional' => ['nullable', 'boolean'],
        ]);

        $model->update($validated);
        $cycle = $model->budgetCycle;

        return response()->json([
            'message' => 'Na-update na ang reserved item!',
            'reserve' => $model->fresh()->load(['scheduledPayments' => function ($q) {
                $q->where('status', 'scheduled');
            }]),
            'dashboard' => $cycle ? $cycle->fresh()->computeDashboard() : null,
        ]);
    }

    public function destroy(Request $request, $reserve)
    {
        $model = $reserve instanceof ReservedExpense ? $reserve : ReservedExpense::findOrFail($reserve);
        if ($model->user_id !== $request->user()->id) {
            abort(403);
        }

        $cycle = $model->budgetCycle;
        $model->delete();

        return response()->json([
            'message' => 'Na-alis na sa reserved list.',
            'dashboard' => $cycle ? $cycle->fresh()->computeDashboard() : null,
        ]);
    }
}
