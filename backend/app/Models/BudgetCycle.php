<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class BudgetCycle extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'label',
        'total_allowance',
        'total_days',
        'start_date',
        'savings_goal',
        'is_active',
        'ai_provider',
        'api_key',
    ];

    protected $casts = [
        'total_allowance' => 'decimal:2',
        'total_days' => 'integer',
        'savings_goal' => 'decimal:2',
        'is_active' => 'boolean',
        'start_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reservedExpenses()
    {
        return $this->hasMany(ReservedExpense::class, 'cycle_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'cycle_id');
    }

    public function scheduledPayments()
    {
        return $this->hasMany(ScheduledPayment::class, 'cycle_id');
    }

    /**
     * Compute real-time Duolingo-style 5-step budget metrics and TiPig mascot state.
     */
    public function computeDashboard(): array
    {
        $tz = 'Asia/Manila';
        $today = Carbon::now($tz)->startOfDay();

        // 1. Precise Calendar Day Parsing
        $startDateRaw = $this->getRawOriginal('start_date') ?: (string)$this->start_date;
        $startDateStr = substr($startDateRaw, 0, 10);
        $startDate = Carbon::createFromFormat('Y-m-d', $startDateStr, $tz)->startOfDay();

        // Calendar day difference
        $diffDays = (int) $startDate->diffInDays($today, false);
        $currentDay = $diffDays < 0 ? 1 : min($this->total_days, $diffDays + 1);
        $remainingDays = max(1, $this->total_days - $currentDay + 1);
        $daysLeft = max(0, $this->total_days - $currentDay);
        $isLastDay = $currentDay >= $this->total_days;

        // Step 2: Reserves
        $reserves = $this->reservedExpenses()->get();
        $totalReserved = (float) $reserves->sum('allocated_amount');

        // Unreserved allowance
        $totalAllowance = (float) $this->total_allowance;
        $savingsGoal = (float) $this->savings_goal;
        $unreservedPool = max(0, $totalAllowance - $totalReserved - $savingsGoal);

        // Step 3 & 4: Expenses
        $allExpenses = $this->expenses()->with('reservedExpense')->orderBy('logged_at', 'desc')->get();
        $totalSpentAll = (float) $allExpenses->sum('amount');

        $unreservedSpent = 0.0;
        $pastUnreservedSpent = 0.0;
        $todayUnreservedSpent = 0.0;
        $todayReservedSpent = 0.0;
        $todaySpentAll = 0.0;
        $categoryTotals = [
            'Food' => 0.0,
            'Transportation' => 0.0,
            'School Expenses' => 0.0,
            'Personal Needs' => 0.0,
        ];

        $todayExpenses = [];
        $todayDateStr = $today->toDateString();

        foreach ($allExpenses as $exp) {
            $amt = (float) $exp->amount;
            $cat = $exp->category;
            if (isset($categoryTotals[$cat])) {
                $categoryTotals[$cat] += $amt;
            }

            // Convert to Manila timezone
            $expManila = Carbon::parse($exp->logged_at)->setTimezone($tz);
            $expDateStr = $expManila->toDateString();

            if ($expDateStr === $todayDateStr) {
                $todaySpentAll += $amt;
                $todayExpenses[] = [
                    'id' => $exp->id,
                    'title' => $exp->title,
                    'category' => $exp->category,
                    'amount' => $amt,
                    'is_from_reserved' => (bool)$exp->is_from_reserved,
                    'time_formatted' => $expManila->format('h:i A'),
                    'logged_at' => $expManila->toIso8601String(),
                ];

                if ($exp->is_from_reserved) {
                    $todayReservedSpent += $amt;
                } else {
                    $todayUnreservedSpent += $amt;
                }
            } elseif ($expDateStr < $todayDateStr) {
                if (!$exp->is_from_reserved) {
                    $pastUnreservedSpent += $amt;
                }
            }

            if (!$exp->is_from_reserved) {
                $unreservedSpent += $amt;
            }
        }

        // Available spendable pool at beginning of today (before today's expenses)
        $startOfTodayPool = max(0, $unreservedPool - $pastUnreservedSpent);

        // Base daily limit for today (spread across remaining days including today)
        $baseDailyLimit = $remainingDays > 0 ? round($startOfTodayPool / $remainingDays, 2) : 0.0;
        $dailyGuide = $baseDailyLimit;

        // Free money remaining for today
        $todayRemaining = max(0, round($baseDailyLimit - $todayUnreservedSpent, 2));

        // Overspend amount for today
        $overspentToday = max(0, round($todayUnreservedSpent - $baseDailyLimit, 2));

        // Projected future daily limit
        $projectedFutureDaily = $dailyGuide;
        if ($remainingDays > 1) {
            if ($overspentToday > 0) {
                $poolLeftForFuture = max(0, $startOfTodayPool - $todayUnreservedSpent);
                $projectedFutureDaily = round($poolLeftForFuture / ($remainingDays - 1), 2);
            } else {
                $projectedFutureDaily = $dailyGuide;
            }
        } else {
            $projectedFutureDaily = 0.0;
        }

        $remainingUnreserved = max(0, $unreservedPool - $unreservedSpent);

        // Savings Tracking
        $savingsUsed = 0.0;
        if ($unreservedSpent > $unreservedPool && $savingsGoal > 0) {
            $savingsUsed = min($savingsGoal, round($unreservedSpent - $unreservedPool, 2));
        }
        $savingsIntact = max(0, round($savingsGoal - $savingsUsed, 2));
        $savingsStatus = 'intact';
        if ($savingsUsed > 0) {
            $savingsStatus = $savingsIntact <= 0 ? 'exhausted' : 'partially_used';
        }

        // Mascot State
        $mascotState = 'safe';
        $tipigQuote = 'You are on track today! Your spending is well within your daily budget.';

        if ($savingsUsed > 0) {
            $mascotState = 'warning';
            $usedStr = number_format($savingsUsed, 2);
            $goalStr = number_format($savingsGoal, 2);
            if ($isLastDay) {
                $tipigQuote = "Cycle complete! You used ₱{$usedStr} of your ₱{$goalStr} Target Savings fund. That is part of learning—let's aim to protect more next cycle!";
            } else {
                $tipigQuote = "Notice: You have used ₱{$usedStr} of your ₱{$goalStr} Target Savings fund due to overspending. Slow down on non-essentials to preserve remaining savings!";
            }
        } elseif ($baseDailyLimit > 0) {
            $paceRatio = $todayUnreservedSpent / $baseDailyLimit;

            if ($todayUnreservedSpent > $baseDailyLimit) {
                $mascotState = 'peligro';
                $overStr = number_format($overspentToday, 2);
                $futStr = number_format($projectedFutureDaily, 2);
                if ($remainingDays > 1) {
                    $tipigQuote = "Caution: You exceeded your daily budget by ₱{$overStr} today. Your recommended limit for upcoming days will adjust to ₱{$futStr}/day.";
                } else {
                    $tipigQuote = "Caution: You exceeded your daily budget by ₱{$overStr} on the final day of your cycle.";
                }
            } elseif ($paceRatio >= 0.8) {
                $mascotState = 'warning';
                $remStr = number_format($todayRemaining, 2);
                $tipigQuote = "Heads up: You have ₱{$remStr} remaining for today. Keep an eye on extra food or casual purchases!";
            } else {
                $mascotState = 'safe';
                $remStr = number_format($todayRemaining, 2);
                $tipigQuote = "Looking good! Your expenses are within your daily limit. You still have ₱{$remStr} available today.";
            }
        } elseif ($remainingUnreserved <= 0 && $totalAllowance > 0) {
            $mascotState = 'peligro';
            $tipigQuote = 'Your spendable allowance for this cycle is depleted. Time to rely on essential reserves only!';
        }

        // Build Calendar Days Array & Past Daily History
        $calendarDays = [];
        $dailyHistory = [];
        $initialDailyQuota = $this->total_days > 0 ? round($unreservedPool / $this->total_days, 2) : 0.0;

        // Fetch all active scheduled payments for this cycle
        $allScheduled = $this->scheduledPayments()->with('reservedExpense')->get();

        for ($i = 0; $i < $this->total_days; $i++) {
            $dayNum = $i + 1;
            $dayCarbon = $startDate->copy()->addDays($i);
            $dayDateStr = $dayCarbon->toDateString();

            $isPast = $dayNum < $currentDay;
            $isCurrent = $dayNum === $currentDay;
            $isFuture = $dayNum > $currentDay;

            // Expenses on this day
            $dayExpenses = $allExpenses->filter(function ($e) use ($dayDateStr, $tz) {
                return Carbon::parse($e->logged_at)->setTimezone($tz)->toDateString() === $dayDateStr;
            })->map(function ($e) use ($tz) {
                $m = Carbon::parse($e->logged_at)->setTimezone($tz);
                return [
                    'id' => $e->id,
                    'title' => $e->title,
                    'category' => $e->category,
                    'amount' => (float)$e->amount,
                    'is_from_reserved' => (bool)$e->is_from_reserved,
                    'time_formatted' => $m->format('h:i A'),
                    'logged_at' => $m->toIso8601String(),
                ];
            })->values();

            // Scheduled payments on this day
            $dayScheduled = $allScheduled->filter(function ($sp) use ($dayDateStr, $dayNum) {
                $spDate = $sp->due_date ? Carbon::parse($sp->due_date)->toDateString() : null;
                return $sp->status === 'scheduled' && ($spDate === $dayDateStr || $sp->target_day === $dayNum);
            })->values();

            $dayScheduledTotal = (float)$dayScheduled->sum('amount');

            $dayUnreservedSpent = (float) $dayExpenses->where('is_from_reserved', false)->sum('amount');
            $dayReservedSpent = (float) $dayExpenses->where('is_from_reserved', true)->sum('amount');
            $dayTotalSpent = $dayUnreservedSpent + $dayReservedSpent;

            $status = 'upcoming';
            $dayQuota = $initialDailyQuota;

            if ($isCurrent) {
                $status = $todayUnreservedSpent > $dailyGuide ? 'overspent' : 'active';
                $dayQuota = $dailyGuide;
            } elseif ($isPast) {
                $status = $dayUnreservedSpent > $initialDailyQuota ? 'overspent' : ($dayUnreservedSpent < $initialDailyQuota ? 'saved' : 'met');
                $dayQuota = $initialDailyQuota;
            } elseif ($isFuture) {
                $status = 'upcoming';
                // Future days dynamically receive the adjusted carryover quota ($dailyGuide),
                // or the reduced projectedFutureDaily if today is overspent.
                $dayQuota = $overspentToday > 0 ? $projectedFutureDaily : $dailyGuide;
            }

            $dayObj = [
                'day_number' => $dayNum,
                'date' => $dayDateStr,
                'formatted_date' => $dayCarbon->format('M d (D)'),
                'is_past' => $isPast,
                'is_current' => $isCurrent,
                'is_future' => $isFuture,
                'status' => $status,
                'quota' => $dayQuota,
                'spent' => $dayUnreservedSpent,
                'reserved_spent' => $dayReservedSpent,
                'total_spent' => $dayTotalSpent,
                'expenses_count' => $dayExpenses->count(),
                'expenses' => $dayExpenses,
                'scheduled_payments' => $dayScheduled->map(function ($sp) {
                    return [
                        'id' => $sp->id,
                        'title' => $sp->title,
                        'category' => $sp->category,
                        'amount' => (float)$sp->amount,
                        'reserve_id' => $sp->reserve_id,
                        'reserve_title' => $sp->reservedExpense ? $sp->reservedExpense->title : null,
                        'target_day' => $sp->target_day,
                        'due_date' => $sp->due_date ? Carbon::parse($sp->due_date)->toDateString() : null,
                        'status' => $sp->status,
                        'notes' => $sp->notes,
                    ];
                })->values(),
                'scheduled_total' => $dayScheduledTotal,
                'has_scheduled' => $dayScheduled->count() > 0,
            ];

            $calendarDays[] = $dayObj;

            if ($isPast && $dayExpenses->count() > 0) {
                $dailyHistory[] = $dayObj;
            }
        }

        // Summary of Yesterday for quick context
        $yesterdaySummary = null;
        if ($currentDay > 1) {
            $yesterdayIndex = $currentDay - 2;
            if (isset($calendarDays[$yesterdayIndex])) {
                $yDay = $calendarDays[$yesterdayIndex];
                $ySaved = round($yDay['quota'] - $yDay['spent'], 2);
                $yesterdaySummary = [
                    'day_number' => $yDay['day_number'],
                    'date' => $yDay['formatted_date'],
                    'spent' => $yDay['spent'],
                    'quota' => $yDay['quota'],
                    'saved' => $ySaved,
                    'is_saved' => $ySaved > 0,
                    'expenses' => $yDay['expenses'],
                ];
            }
        }

        // Scheduled payments due today or overdue
        $dueScheduledToday = $allScheduled->filter(function ($sp) use ($todayDateStr, $currentDay) {
            $spDate = $sp->due_date ? Carbon::parse($sp->due_date)->toDateString() : null;
            $isDue = ($spDate && $spDate <= $todayDateStr) || ($sp->target_day && $sp->target_day <= $currentDay);
            return $sp->status === 'scheduled' && $isDue;
        })->map(function ($sp) {
            return [
                'id' => $sp->id,
                'title' => $sp->title,
                'category' => $sp->category,
                'amount' => (float)$sp->amount,
                'reserve_id' => $sp->reserve_id,
                'reserve_title' => $sp->reservedExpense ? $sp->reservedExpense->title : null,
                'target_day' => $sp->target_day,
                'due_date' => $sp->due_date ? Carbon::parse($sp->due_date)->toDateString() : null,
                'status' => $sp->status,
                'notes' => $sp->notes,
            ];
        })->values();

        // Compute Review, Streak & Pacing Analytics
        $evaluatedDaysCount = min($this->total_days, max(1, $currentDay));
        $underQuotaDaysCount = 0;
        $tipidStreak = 0;
        $checkingStreak = true;

        $peakSaverDay = null;
        $maxSavedMargin = -999999.0;
        $heaviestDay = null;
        $maxSpentAmount = -1.0;

        for ($dIdx = $evaluatedDaysCount - 1; $dIdx >= 0; $dIdx--) {
            $d = $calendarDays[$dIdx];
            $isUnder = $d['spent'] <= $d['quota'];
            if ($isUnder) {
                $underQuotaDaysCount++;
                if ($checkingStreak) {
                    $tipidStreak++;
                }
            } else {
                $checkingStreak = false;
            }

            $savedMargin = round($d['quota'] - $d['spent'], 2);
            if ($savedMargin > $maxSavedMargin && $savedMargin > 0) {
                $maxSavedMargin = $savedMargin;
                $peakSaverDay = [
                    'day_number' => $d['day_number'],
                    'formatted_date' => $d['formatted_date'],
                    'saved_amount' => $savedMargin,
                ];
            }

            if ($d['spent'] > $maxSpentAmount && $d['spent'] > 0) {
                $maxSpentAmount = $d['spent'];
                $heaviestDay = [
                    'day_number' => $d['day_number'],
                    'formatted_date' => $d['formatted_date'],
                    'spent_amount' => $d['spent'],
                ];
            }
        }

        $disciplineRatePct = $evaluatedDaysCount > 0 ? round(($underQuotaDaysCount / $evaluatedDaysCount) * 100, 1) : 100.0;

        if ($savingsStatus === 'exhausted') {
            $pacingGrade = 'Needs Work';
            $pacingTitle = 'Target Savings Breached';
        } elseif ($disciplineRatePct >= 90) {
            $pacingGrade = 'A+';
            $pacingTitle = 'Diskarte Master';
        } elseif ($disciplineRatePct >= 75) {
            $pacingGrade = 'A';
            $pacingTitle = 'Solid Tipid';
        } elseif ($disciplineRatePct >= 60) {
            $pacingGrade = 'B';
            $pacingTitle = 'Balanced Saver';
        } else {
            $pacingGrade = 'C';
            $pacingTitle = 'Tight Margin';
        }

        $actualSavedTotal = max(0, $totalAllowance - $totalSpentAll);
        $surplusSavings = max(0, $actualSavedTotal - $savingsGoal);

        return [
            'analytics' => [
                'tipid_streak_days' => $tipidStreak,
                'discipline_rate_pct' => $disciplineRatePct,
                'under_quota_days' => $underQuotaDaysCount,
                'evaluated_days' => $evaluatedDaysCount,
                'pacing_grade' => $pacingGrade,
                'pacing_title' => $pacingTitle,
                'peak_saver_day' => $peakSaverDay,
                'heaviest_splurge_day' => $heaviestDay,
                'actual_saved_total' => round($actualSavedTotal, 2),
                'surplus_savings' => round($surplusSavings, 2),
            ],
            'cycle' => [
                'id' => $this->id,
                'label' => $this->label,
                'total_allowance' => $totalAllowance,
                'total_days' => $this->total_days,
                'start_date' => $startDateStr,
                'savings_goal' => $savingsGoal,
                'is_active' => $this->is_active,
                'ai_provider' => $this->ai_provider,
            ],
            'time' => [
                'current_day' => $currentDay,
                'total_days' => $this->total_days,
                'days_left' => $daysLeft,
                'remaining_days' => $remainingDays,
                'is_last_day' => $isLastDay,
                'progress_pct' => round(($currentDay / max(1, $this->total_days)) * 100, 1),
            ],
            'financials' => [
                'total_allowance' => $totalAllowance,
                'total_reserved' => $totalReserved,
                'savings_goal' => $savingsGoal,
                'savings_intact' => $savingsIntact,
                'savings_used' => $savingsUsed,
                'savings_status' => $savingsStatus,
                'unreserved_pool' => $unreservedPool,
                'unreserved_spent' => $unreservedSpent,
                'remaining_unreserved' => $remainingUnreserved,
                'total_spent_all' => $totalSpentAll,
                'daily_guide' => round($dailyGuide, 2),
                'today_spent' => round($todayUnreservedSpent, 2),
                'today_reserved_spent' => round($todayReservedSpent, 2),
                'today_spent_all' => round($todaySpentAll, 2),
                'today_remaining' => round($todayRemaining, 2),
                'overspent_today' => round($overspentToday, 2),
                'projected_future_daily' => round($projectedFutureDaily, 2),
                'spending_pace_pct' => $baseDailyLimit > 0 ? round(($todayUnreservedSpent / $baseDailyLimit) * 100, 1) : 0,
            ],
            'calendar' => [
                'cycle_start' => $startDateStr,
                'cycle_end' => $startDate->copy()->addDays($this->total_days - 1)->toDateString(),
                'today' => $todayDateStr,
                'current_day' => $currentDay,
                'days' => $calendarDays,
            ],
            'today_expenses' => $todayExpenses,
            'daily_history' => $dailyHistory,
            'yesterday_summary' => $yesterdaySummary,
            'due_scheduled_today' => $dueScheduledToday,
            'all_scheduled_payments' => $allScheduled,
            'categories' => $categoryTotals,
            'mascot' => [
                'name' => 'TiPig',
                'state' => $mascotState,
                'quote' => $tipigQuote,
            ],
            'reserves' => $reserves,
            'recent_expenses' => $allExpenses,
            'all_expenses' => $allExpenses,
        ];
    }

    /**
     * Helper: Resolve day number for a given Carbon date within this cycle
     */
    public function getDayNumberForDate($date): int
    {
        $tz = 'Asia/Manila';
        $startDateRaw = $this->getRawOriginal('start_date') ?: (string)$this->start_date;
        $startDate = Carbon::createFromFormat('Y-m-d', substr($startDateRaw, 0, 10), $tz)->startOfDay();
        $target = ($date instanceof Carbon ? $date : Carbon::parse($date, $tz))->copy()->setTimezone($tz)->startOfDay();
        $diff = (int)$startDate->diffInDays($target, false);
        return max(1, min($this->total_days, $diff + 1));
    }

    /**
     * Helper: Resolve date string for a given day number in this cycle
     */
    public function getDateForDayNumber(int $dayNumber): string
    {
        $tz = 'Asia/Manila';
        $startDateRaw = $this->getRawOriginal('start_date') ?: (string)$this->start_date;
        $startDate = Carbon::createFromFormat('Y-m-d', substr($startDateRaw, 0, 10), $tz)->startOfDay();
        return $startDate->addDays(max(0, $dayNumber - 1))->toDateString();
    }
}
