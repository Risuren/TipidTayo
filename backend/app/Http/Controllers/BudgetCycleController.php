<?php

namespace App\Http\Controllers;

use App\Models\BudgetCycle;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BudgetCycleController extends Controller
{
    public function index(Request $request)
    {
        $cycles = $request->user()->budgetCycles()->with('expenses')->orderBy('id', 'asc')->get();
        $tz = 'Asia/Manila';
        $today = Carbon::now($tz)->startOfDay();

        $data = $cycles->map(function ($c, $idx) use ($tz, $today) {
            $totalSpent = (float) $c->expenses->sum('amount');
            $allowance = (float) $c->total_allowance;
            $goal = (float) $c->savings_goal;
            $actualSaved = max(0, $allowance - $totalSpent);
            $surplus = max(0, $actualSaved - $goal);

            $startDateRaw = $c->getRawOriginal('start_date') ?: (string)$c->start_date;
            $startDateStr = substr($startDateRaw, 0, 10);
            $startDate = Carbon::createFromFormat('Y-m-d', $startDateStr, $tz)->startOfDay();
            $diffDays = (int) $startDate->diffInDays($today, false);
            $currentDay = $diffDays < 0 ? 1 : min($c->total_days, $diffDays + 1);

            return [
                'id' => $c->id,
                'cycle_number' => $idx + 1,
                'label' => $c->label ?: "Cycle #" . ($idx + 1),
                'total_allowance' => $allowance,
                'total_days' => $c->total_days,
                'start_date' => $startDateStr,
                'current_day' => $currentDay,
                'savings_goal' => $goal,
                'total_spent' => round($totalSpent, 2),
                'actual_saved' => round($actualSaved, 2),
                'surplus' => round($surplus, 2),
                'savings_achieved' => $actualSaved >= $goal,
                'is_active' => (bool) $c->is_active,
                'created_at' => $c->created_at ? $c->created_at->toDateString() : null,
            ];
        });

        return response()->json($data);
    }

    public function active(Request $request)
    {
        $cycle = $request->user()->activeCycle;
        if (!$cycle) {
            return response()->json(['message' => 'Walang active budget cycle.', 'dashboard' => null]);
        }
        return response()->json([
            'cycle' => $cycle,
            'dashboard' => $cycle->computeDashboard(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:100'],
            'total_allowance' => ['required', 'numeric', 'min:1'],
            'total_days' => ['required', 'integer', 'min:1', 'max:365'],
            'start_date' => ['nullable', 'date'],
            'savings_goal' => ['nullable', 'numeric', 'min:0'],
            'ai_provider' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($user, $validated) {
            BudgetCycle::where('user_id', $user->id)->update(['is_active' => false]);

            $cycle = BudgetCycle::create([
                'user_id' => $user->id,
                'label' => $validated['label'] ?: 'My Budget Cycle',
                'total_allowance' => $validated['total_allowance'],
                'total_days' => $validated['total_days'],
                'start_date' => !empty($validated['start_date']) ? Carbon::parse($validated['start_date'], 'Asia/Manila')->toDateString() : Carbon::now('Asia/Manila')->toDateString(),
                'savings_goal' => $validated['savings_goal'] ?? 0,
                'is_active' => true,
                'ai_provider' => $validated['ai_provider'] ?? 'groq',
            ]);

            return response()->json([
                'message' => 'Budget cycle successfully created!',
                'cycle' => $cycle,
                'dashboard' => $cycle->computeDashboard(),
            ], 201);
        });
    }

    public function show(Request $request, BudgetCycle $budgetCycle)
    {
        if ($budgetCycle->user_id !== $request->user()->id) {
            abort(403);
        }
        return response()->json([
            'cycle' => $budgetCycle,
            'dashboard' => $budgetCycle->computeDashboard(),
        ]);
    }

    public function update(Request $request, BudgetCycle $budgetCycle)
    {
        if ($budgetCycle->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:100'],
            'total_allowance' => ['sometimes', 'required', 'numeric', 'min:1'],
            'total_days' => ['sometimes', 'required', 'integer', 'min:1', 'max:365'],
            'start_date' => ['nullable', 'date'],
            'savings_goal' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'ai_provider' => ['nullable', 'string'],
            'api_key' => ['nullable', 'string'],
        ]);

        $budgetCycle->update($validated);

        return response()->json([
            'message' => 'Budget cycle successfully updated!',
            'cycle' => $budgetCycle,
            'dashboard' => $budgetCycle->computeDashboard(),
        ]);
    }

    public function destroy(Request $request, BudgetCycle $budgetCycle)
    {
        if ($budgetCycle->user_id !== $request->user()->id) {
            abort(403);
        }

        $budgetCycle->delete();
        return response()->json(['message' => 'Na-delete na ang budget cycle.']);
    }

    public function dashboard(Request $request, $id = null)
    {
        $cycle = $id 
            ? BudgetCycle::where('user_id', $request->user()->id)->findOrFail($id)
            : $request->user()->activeCycle;

        if (!$cycle) {
            return response()->json(['dashboard' => null]);
        }

        return response()->json($cycle->computeDashboard());
    }
}
