<?php

namespace App\Http\Controllers;

use App\Services\AIAgentService;
use Illuminate\Http\Request;

class AIAgentController extends Controller
{
    public function interact(Request $request, AIAgentService $aiService)
    {
        $validated = $request->validate([
            'prompt' => ['required', 'string', 'max:1000'],
            'mode' => ['nullable', 'in:chat,simulate,log,kayaba'],
            'reserve_id' => ['nullable'],
            'force_baon' => ['nullable', 'boolean'],
            'target_date' => ['nullable', 'date'],
            'history' => ['nullable', 'array', 'max:20'],
        ]);

        $forcedReserveId = null;
        if ($request->filled('reserve_id')) {
            $rawReserve = $request->input('reserve_id');
            if ($rawReserve === 'none' || $rawReserve === '0') {
                $forcedReserveId = -1; // -1 means explicitly Daily Baon (no vault)
            } elseif (is_numeric($rawReserve) && (int)$rawReserve > 0) {
                $forcedReserveId = (int)$rawReserve;
            }
        } elseif ($request->boolean('force_baon')) {
            $forcedReserveId = -1;
        }

        $targetDate = $validated['target_date'] ?? null;
        if ($targetDate) {
            $parsedDate = \Carbon\Carbon::parse($targetDate, 'Asia/Manila')->startOfDay();
            $today = \Carbon\Carbon::now('Asia/Manila')->startOfDay();
            if ($parsedDate->greaterThan($today)) {
                return response()->json([
                    'status' => 'warning',
                    'reply' => '**TiPig:** Hindi pa puwedeng maglista ng gastos para sa future date dahil hindi pa ito nangyayari! Gamitin ang *Schedule Payment* para maglaan ng pondo sa darating na araw.',
                    'mood' => 'warning',
                    'provider' => 'TiPig AI',
                ], 422);
            }
        }

        $user = $request->user();
        $cycle = $user->activeCycle;

        if (!$cycle) {
            return response()->json([
                'status' => 'warning',
                'reply' => '**TiPig:** Please set up your Budget Cycle first so I can provide personalized guidance!',
                'mood' => 'warning',
                'provider' => 'TiPig AI',
            ]);
        }

        $result = $aiService->process(
            $user,
            $cycle,
            $validated['prompt'],
            $validated['mode'] ?? 'chat',
            $forcedReserveId,
            $validated['history'] ?? [],
            $targetDate
        );

        if (!empty($result['refresh'])) {
            $result['dashboard'] = $cycle->fresh()->computeDashboard();
        }

        return response()->json($result);
    }
}
