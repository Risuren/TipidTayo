<?php
require_once 'api/db.php';

// 1. Load Active Budget Cycle (Step 1)
$cycle = $conn->query("SELECT * FROM budget_cycles WHERE id=1")->fetch_assoc();
$totalAllowance = floatval($cycle['total_allowance']);
$totalDays = max(1, intval($cycle['total_days']));
$currentDay = max(1, min($totalDays, intval($cycle['current_day'])));
$remainingDays = max(1, $totalDays - $currentDay + 1);
$savingsGoal = floatval($cycle['savings_goal']);

// 2. Load Reserved Essential Expenses (Step 2)
$reservesResult = $conn->query("SELECT * FROM reserved_expenses WHERE cycle_id=1 ORDER BY id ASC");
$reserves = [];
$totalReservedAllocated = 0;
$unspentReservedLock = 0;
while ($r = $reservesResult->fetch_assoc()) {
    $reserves[] = $r;
    $totalReservedAllocated += floatval($r['allocated_amount']);
    $unspentReservedLock += max(0, floatval($r['allocated_amount']) - floatval($r['spent_amount']));
}

// 3. Load Expenses & Compute Daily Guide (Steps 3, 4, 5)
$expensesResult = $conn->query("SELECT * FROM expenses WHERE cycle_id=1 ORDER BY id DESC");
$expenses = [];
$totalSpentAll = 0;
$unreservedSpentAll = 0;
$todayUnreservedSpent = 0;
$catTotals = ['Food' => 0, 'Transportation' => 0, 'School Expenses' => 0, 'Personal Needs' => 0];

while ($e = $expensesResult->fetch_assoc()) {
    $expenses[] = $e;
    $amt = floatval($e['amount']);
    $totalSpentAll += $amt;
    if (isset($catTotals[$e['category']])) {
        $catTotals[$e['category']] += $amt;
    }
    if (intval($e['is_from_reserved']) === 0) {
        $unreservedSpentAll += $amt;
        if (intval($e['day_logged']) === $currentDay) {
            $todayUnreservedSpent += $amt;
        }
    }
}

$totalRemainingCash = $totalAllowance - $totalSpentAll;
$lockedPool = $unspentReservedLock + $savingsGoal;
$freeSpendablePool = max(0, $totalRemainingCash - $lockedPool);
$recommendedDailyLimit = round($freeSpendablePool / $remainingDays, 2);
$safeToSpendToday = round($recommendedDailyLimit - $todayUnreservedSpent, 2);

// Sustainability Pace & Mascot State
$avgDailyBurn = round($unreservedSpentAll / max(1, $currentDay), 2);
if ($safeToSpendToday < 0 || $freeSpendablePool <= 0) {
    $mascotState = 'peligro';
    $statusLabel = 'PETSA DE PELIGRO ALERT';
    $mascotQuote = "Naku po! Lumagpas ka na sa daily limit mo ngayon. Ingatan ang naka-lock na pamasahe at pang-school!";
} elseif ($safeToSpendToday < ($recommendedDailyLimit * 0.35)) {
    $mascotState = 'warning';
    $statusLabel = 'ALANGANIN PACE (TIGHT)';
    $mascotQuote = "Hinay-hinay muna! ₱" . number_format($safeToSpendToday, 2) . " na lang ang ligtas gastusin ngayong Day {$currentDay}.";
} else {
    $mascotState = 'safe';
    $statusLabel = 'SUSTAINABLE PACE (BUSOG)';
    $mascotQuote = "Ayos Iskolar! May ₱" . number_format($safeToSpendToday, 2) . " ka pang safe gastusin ngayong araw nang hindi nagagalaw ang ipon at pamasahe!";
}

// Category icon map
$catIcons = [
    'Food' => '🍱',
    'Transportation' => '🚌',
    'School Expenses' => '📚',
    'Personal Needs' => '🧴'
];

// Category color map for the donut chart
$catColors = [
    'Food' => '#4ade80',
    'Transportation' => '#60a5fa',
    'School Expenses' => '#a78bfa',
    'Personal Needs' => '#fb923c'
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>TipidTayo — Smart Student Budget & AI Companion</title>
    <meta name="description" content="TipidTayo is a smart student allowance companion that helps Filipino college students track daily spending, protect reserved funds, and get AI-powered budget advice in Taglish.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        /* ============================================================
           DESIGN SYSTEM — TipidTayo Modern Premium
           Inspired by: Delibix, UPfinance, FinSight dashboards
           ============================================================ */
        :root {
            /* Surfaces */
            --bg-shell: #F3F4F0;
            --bg-card: #FFFFFF;
            --bg-card-alt: #F7FAF5;
            --bg-accent: #D6F5D6;
            --bg-accent-strong: #4CAF50;
            --bg-accent-gradient: linear-gradient(135deg, #C8F7C5 0%, #81E47E 50%, #4CAF50 100%);
            --bg-vault: #EEF2FF;

            /* Text */
            --text-primary: #1A1D1F;
            --text-secondary: #6F767E;
            --text-tertiary: #9A9FA5;
            --text-on-accent: #FFFFFF;

            /* Accent */
            --accent-green: #4CAF50;
            --accent-green-light: #81E47E;
            --accent-green-pale: #E8F5E9;
            --accent-gold: #F59E0B;

            /* Status */
            --status-safe: #4CAF50;
            --status-warn: #FF9800;
            --status-danger: #F44336;
            --ai-indigo: #6366F1;

            /* Shadows & Borders */
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
            --shadow-md: 0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
            --shadow-lg: 0 8px 30px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
            --shadow-accent: 0 4px 20px rgba(76,175,80,0.25);
            --radius-sm: 12px;
            --radius-md: 18px;
            --radius-lg: 24px;
            --radius-xl: 32px;
            --radius-full: 999px;
        }

        /* Reset & Base */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; -webkit-tap-highlight-color: transparent; }
        body {
            background: var(--bg-shell);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.55;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        /* Utility */
        .mono { font-family: 'Inter', monospace; font-weight: 800; font-variant-numeric: tabular-nums; }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

        /* ============================================================
           TOP NAVBAR — Desktop
           ============================================================ */
        .top-nav {
            position: sticky;
            top: 0;
            z-index: 100;
            background: rgba(243, 244, 240, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .top-nav-inner {
            max-width: 1320px;
            margin: 0 auto;
            padding: 12px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }
        .nav-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .nav-brand-icon {
            width: 42px;
            height: 42px;
            background: var(--bg-accent-gradient);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.3rem;
            box-shadow: var(--shadow-accent);
        }
        .nav-brand-text {
            font-weight: 800;
            font-size: 1.25rem;
            letter-spacing: -0.5px;
        }
        .nav-brand-sub {
            font-size: 0.72rem;
            font-weight: 500;
            color: var(--text-secondary);
        }
        .nav-tabs {
            display: flex;
            align-items: center;
            background: var(--bg-card);
            border-radius: var(--radius-full);
            padding: 4px;
            box-shadow: var(--shadow-sm);
        }
        .nav-tab {
            padding: 8px 20px;
            border-radius: var(--radius-full);
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
            border: none;
            background: none;
            white-space: nowrap;
        }
        .nav-tab.active {
            background: var(--accent-green);
            color: var(--text-on-accent);
            box-shadow: var(--shadow-accent);
        }
        .nav-tab:hover:not(.active) { background: var(--bg-card-alt); color: var(--text-primary); }
        .nav-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .nav-day-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            background: var(--bg-card);
            border-radius: var(--radius-full);
            padding: 8px 16px;
            font-size: 0.82rem;
            font-weight: 700;
            box-shadow: var(--shadow-sm);
        }
        .nav-day-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent-green);
            animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.3); }
        }

        /* ============================================================
           MAIN LAYOUT — Bento Grid
           ============================================================ */
        .app-shell {
            max-width: 1320px;
            margin: 0 auto;
            padding: 20px 20px 100px 20px;
        }
        .bento-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 16px;
        }
        .card {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-md);
            padding: 24px;
            transition: box-shadow 0.3s ease, transform 0.3s ease;
            overflow: hidden;
            position: relative;
        }
        .card:hover { box-shadow: var(--shadow-lg); }
        .col-8 { grid-column: span 8; }
        .col-7 { grid-column: span 7; }
        .col-6 { grid-column: span 6; }
        .col-5 { grid-column: span 5; }
        .col-4 { grid-column: span 4; }
        .col-3 { grid-column: span 3; }
        .col-12 { grid-column: span 12; }

        /* ============================================================
           CARD HEADERS
           ============================================================ */
        .card-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 18px;
        }
        .card-header-icon {
            width: 36px;
            height: 36px;
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            flex-shrink: 0;
        }
        .card-header-icon.green { background: var(--accent-green-pale); }
        .card-header-icon.indigo { background: #EEF2FF; }
        .card-header-icon.gold { background: #FEF3C7; }
        .card-header-icon.warm { background: #FFF7ED; }
        .card-header-title {
            font-weight: 700;
            font-size: 1rem;
            letter-spacing: -0.2px;
        }
        .card-header-sub {
            font-size: 0.75rem;
            color: var(--text-secondary);
            font-weight: 500;
        }
        .card-header-right {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .step-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: var(--radius-full);
            font-size: 0.68rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: var(--text-primary);
            color: #fff;
        }
        .step-chip.green { background: var(--accent-green); }
        .step-chip.indigo { background: var(--ai-indigo); }

        /* ============================================================
           HERO BALANCE CARD
           ============================================================ */
        .hero-balance {
            background: var(--bg-card);
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 28px;
            align-items: center;
        }
        .mascot-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        .mascot-ring {
            width: 160px;
            height: 160px;
            border-radius: 50%;
            background: var(--bg-card-alt);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .mascot-ring::before {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            padding: 4px;
            background: var(--bg-accent-gradient);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            opacity: 0.6;
        }
        .piso-svg { width: 120px; height: 120px; animation: floatPiso 4s ease-in-out infinite; }
        @keyframes floatPiso {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
        }
        .mascot-state-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 14px;
            border-radius: var(--radius-full);
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.3px;
        }
        .badge-safe { background: var(--accent-green-pale); color: var(--status-safe); }
        .badge-warning { background: #FFF3E0; color: var(--status-warn); }
        .badge-peligro { background: #FFEBEE; color: var(--status-danger); }

        .balance-section h2 {
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 4px;
        }
        .balance-amount {
            font-size: 3rem;
            font-weight: 900;
            letter-spacing: -2px;
            line-height: 1.1;
            margin-bottom: 4px;
        }
        .balance-sub {
            font-size: 0.85rem;
            color: var(--text-secondary);
            font-weight: 500;
            margin-bottom: 18px;
        }
        .balance-sub strong { color: var(--text-primary); }
        .mascot-quote-bubble {
            background: var(--bg-card-alt);
            border-radius: var(--radius-md);
            padding: 12px 16px;
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--text-secondary);
            line-height: 1.5;
            border-left: 3px solid var(--accent-green);
            margin-top: 6px;
        }

        /* KPI mini row */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        .kpi-item {
            background: var(--bg-card-alt);
            border-radius: var(--radius-md);
            padding: 14px 16px;
            transition: background 0.2s;
        }
        .kpi-item:hover { background: var(--accent-green-pale); }
        .kpi-label {
            font-size: 0.72rem;
            font-weight: 600;
            color: var(--text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .kpi-value {
            font-size: 1.15rem;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        .kpi-value.green { color: var(--status-safe); }
        .kpi-value.indigo { color: var(--ai-indigo); }

        /* ============================================================
           REWARDS / SAVINGS ACCENT CARD
           ============================================================ */
        .accent-card {
            background: var(--bg-accent-gradient);
            color: var(--text-primary);
            position: relative;
            overflow: hidden;
        }
        .accent-card::after {
            content: '';
            position: absolute;
            top: -30%;
            right: -15%;
            width: 180px;
            height: 180px;
            background: rgba(255,255,255,0.15);
            border-radius: 50%;
        }
        .accent-card .card-header-title { color: var(--text-primary); }
        .savings-amount {
            font-size: 2rem;
            font-weight: 900;
            letter-spacing: -1px;
            margin-bottom: 6px;
            position: relative;
            z-index: 1;
        }
        .savings-change {
            display: inline-block;
            padding: 3px 10px;
            background: rgba(255,255,255,0.4);
            border-radius: var(--radius-full);
            font-size: 0.73rem;
            font-weight: 700;
            margin-bottom: 14px;
            position: relative;
            z-index: 1;
        }
        .accent-sub-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            position: relative;
            z-index: 1;
        }
        .accent-sub-item {
            background: rgba(255,255,255,0.45);
            backdrop-filter: blur(10px);
            border-radius: var(--radius-sm);
            padding: 12px;
        }
        .accent-sub-label {
            font-size: 0.7rem;
            font-weight: 600;
            color: rgba(0,0,0,0.55);
            margin-bottom: 2px;
        }
        .accent-sub-value {
            font-size: 1.05rem;
            font-weight: 800;
        }

        /* ============================================================
           FORMS & INPUTS — Clean Modern
           ============================================================ */
        .input-group { margin-bottom: 14px; }
        .input-label {
            display: block;
            font-size: 0.78rem;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 6px;
        }
        input[type="text"],
        input[type="number"],
        select {
            width: 100%;
            padding: 11px 14px;
            border: 1.5px solid #E5E7EB;
            border-radius: var(--radius-sm);
            font-size: 0.88rem;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            background: var(--bg-card);
            color: var(--text-primary);
            transition: border-color 0.2s, box-shadow 0.2s;
            outline: none;
        }
        input:focus, select:focus {
            border-color: var(--accent-green);
            box-shadow: 0 0 0 3px rgba(76,175,80,0.12);
        }
        input::placeholder { color: var(--text-tertiary); font-weight: 400; }

        /* Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
            border: none;
            border-radius: var(--radius-full);
            padding: 11px 22px;
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            font-size: 0.85rem;
            transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
            white-space: nowrap;
        }
        .btn-primary {
            background: var(--accent-green);
            color: #fff;
            box-shadow: var(--shadow-accent);
        }
        .btn-primary:hover { background: #43A047; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(76,175,80,0.3); }
        .btn-primary:active { transform: translateY(0); box-shadow: var(--shadow-sm); }

        .btn-ai {
            background: var(--ai-indigo);
            color: #fff;
            box-shadow: 0 4px 16px rgba(99,102,241,0.25);
        }
        .btn-ai:hover { background: #4F46E5; transform: translateY(-1px); }

        .btn-outline {
            background: var(--bg-card);
            color: var(--text-primary);
            border: 1.5px solid #E5E7EB;
        }
        .btn-outline:hover { border-color: var(--accent-green); color: var(--accent-green); background: var(--accent-green-pale); }

        .btn-gold {
            background: var(--accent-gold);
            color: var(--text-primary);
            box-shadow: 0 4px 16px rgba(245,158,11,0.25);
        }
        .btn-gold:hover { background: #D97706; transform: translateY(-1px); }

        .btn-block { width: 100%; }

        /* ============================================================
           PROGRESS BARS
           ============================================================ */
        .progress-track {
            width: 100%;
            height: 8px;
            background: #F3F4F6;
            border-radius: var(--radius-full);
            overflow: hidden;
            margin-top: 6px;
        }
        .progress-fill {
            height: 100%;
            border-radius: var(--radius-full);
            background: var(--accent-green);
            transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
        }

        /* ============================================================
           RESERVE VAULT ITEMS
           ============================================================ */
        .vault-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px;
            background: var(--bg-card-alt);
            border-radius: var(--radius-md);
            margin-bottom: 10px;
            transition: background 0.2s;
        }
        .vault-item:hover { background: var(--accent-green-pale); }
        .vault-icon {
            width: 40px;
            height: 40px;
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            flex-shrink: 0;
        }
        .vault-icon.food { background: #DCFCE7; }
        .vault-icon.transport { background: #DBEAFE; }
        .vault-icon.school { background: #EDE9FE; }
        .vault-icon.personal { background: #FFF7ED; }
        .vault-info { flex: 1; min-width: 0; }
        .vault-title {
            font-size: 0.88rem;
            font-weight: 700;
            margin-bottom: 1px;
        }
        .vault-cat {
            font-size: 0.72rem;
            font-weight: 500;
            color: var(--text-tertiary);
        }
        .vault-amounts {
            text-align: right;
            flex-shrink: 0;
        }
        .vault-spent {
            font-size: 0.92rem;
            font-weight: 800;
        }
        .vault-alloc {
            font-size: 0.72rem;
            color: var(--text-tertiary);
            font-weight: 500;
        }

        /* ============================================================
           TRANSACTION LIST
           ============================================================ */
        .tx-list { list-style: none; }
        .tx-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 13px 0;
            border-bottom: 1px solid #F3F4F6;
            transition: background 0.15s;
        }
        .tx-item:last-child { border-bottom: none; }
        .tx-icon {
            width: 40px;
            height: 40px;
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            flex-shrink: 0;
        }
        .tx-info { flex: 1; min-width: 0; }
        .tx-title {
            font-size: 0.88rem;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .tx-meta {
            font-size: 0.73rem;
            color: var(--text-tertiary);
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .tx-vault-badge {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            padding: 1px 7px;
            background: #EEF2FF;
            color: var(--ai-indigo);
            border-radius: var(--radius-full);
            font-size: 0.65rem;
            font-weight: 700;
        }
        .tx-amount {
            font-size: 0.95rem;
            font-weight: 800;
            color: var(--status-danger);
            flex-shrink: 0;
        }

        /* ============================================================
           DONUT CHART (SVG-based)
           ============================================================ */
        .donut-container {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 160px;
            height: 160px;
            margin: 0 auto 16px auto;
        }
        .donut-center {
            position: absolute;
            text-align: center;
        }
        .donut-center-amount {
            font-size: 1.2rem;
            font-weight: 900;
            letter-spacing: -0.5px;
        }
        .donut-center-label {
            font-size: 0.68rem;
            color: var(--text-tertiary);
            font-weight: 500;
        }
        .cat-legend {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        .cat-legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-radius: var(--radius-sm);
            background: var(--bg-card-alt);
            transition: background 0.2s;
        }
        .cat-legend-item:hover { background: var(--accent-green-pale); }
        .cat-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .cat-legend-text { min-width: 0; }
        .cat-legend-name { font-size: 0.73rem; font-weight: 600; color: var(--text-secondary); }
        .cat-legend-value { font-size: 0.85rem; font-weight: 800; }

        /* ============================================================
           AI COMMAND CENTER
           ============================================================ */
        .ai-card {
            background: linear-gradient(135deg, #EEF2FF 0%, #F0ECFF 100%);
            border: 1px solid rgba(99,102,241,0.12);
        }
        .ai-input-row {
            display: flex;
            gap: 8px;
            align-items: stretch;
        }
        .ai-input-row input {
            flex: 1;
            border-color: rgba(99,102,241,0.2);
            background: rgba(255,255,255,0.8);
        }
        .ai-input-row input:focus {
            border-color: var(--ai-indigo);
            box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .ai-btn-group {
            display: flex;
            gap: 6px;
        }
        .ai-response {
            margin-top: 12px;
            padding: 14px 18px;
            background: rgba(255,255,255,0.85);
            border-radius: var(--radius-md);
            font-size: 0.88rem;
            font-weight: 600;
            line-height: 1.6;
            display: none;
            border-left: 3px solid var(--ai-indigo);
            animation: fadeSlideIn 0.3s ease;
        }
        @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* ============================================================
           FORM GRIDS
           ============================================================ */
        .form-row {
            display: grid;
            gap: 10px;
        }
        .form-2col { grid-template-columns: 1fr 1fr; }
        .form-3col { grid-template-columns: 1fr 1fr 1fr; }
        .form-reserve { grid-template-columns: 2fr 1.2fr 1fr auto; }
        .form-expense { grid-template-columns: 1.6fr 1.2fr 1fr; }
        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 4px 0;
        }
        .checkbox-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: var(--accent-green);
            cursor: pointer;
        }

        /* ============================================================
           SDG PILLS (desktop nav)
           ============================================================ */
        .sdg-pills {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
        }
        .sdg-pill {
            font-size: 0.65rem;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: var(--radius-full);
            background: var(--accent-green-pale);
            color: var(--accent-green);
        }

        /* ============================================================
           MOBILE BOTTOM NAV
           ============================================================ */
        .bottom-nav {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 200;
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-top: 1px solid rgba(0,0,0,0.06);
            padding: 6px 0;
            padding-bottom: max(6px, env(safe-area-inset-bottom));
        }
        .bottom-nav-inner {
            display: flex;
            justify-content: space-around;
            align-items: center;
            max-width: 500px;
            margin: 0 auto;
        }
        .bnav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            background: none;
            font-family: 'Inter', sans-serif;
        }
        .bnav-item.active .bnav-icon {
            background: var(--accent-green);
            color: #fff;
            box-shadow: var(--shadow-accent);
        }
        .bnav-icon {
            width: 42px;
            height: 34px;
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.15rem;
            transition: all 0.25s;
        }
        .bnav-label {
            font-size: 0.62rem;
            font-weight: 600;
            color: var(--text-tertiary);
        }
        .bnav-item.active .bnav-label { color: var(--accent-green); font-weight: 700; }

        /* ============================================================
           SECTION VISIBILITY (controlled by bottom nav on mobile)
           ============================================================ */
        .section-panel { display: block; }

        /* ============================================================
           RESPONSIVE BREAKPOINTS
           ============================================================ */
        @media (max-width: 1024px) {
            .col-8, .col-7 { grid-column: span 12; }
            .col-5, .col-4 { grid-column: span 12; }
            .col-6 { grid-column: span 6; }
            .hero-balance { grid-template-columns: 1fr; }
            .mascot-container { flex-direction: row; gap: 16px; }
            .mascot-ring { width: 100px; height: 100px; }
            .piso-svg { width: 70px; height: 70px; }
            .balance-amount { font-size: 2.4rem; }
        }
        @media (max-width: 768px) {
            .top-nav { display: none; }
            .bottom-nav { display: block; }
            .app-shell { padding: 16px 14px 100px 14px; }
            .bento-grid { gap: 14px; }
            .col-6, .col-5, .col-4, .col-3, .col-8, .col-7 { grid-column: span 12; }
            .card { padding: 18px; border-radius: var(--radius-md); }
            .hero-balance { grid-template-columns: 1fr; gap: 16px; }
            .mascot-container {
                flex-direction: row;
                align-items: center;
                gap: 14px;
            }
            .mascot-ring { width: 80px; height: 80px; }
            .mascot-ring::before { inset: -3px; padding: 3px; }
            .piso-svg { width: 56px; height: 56px; }
            .balance-amount { font-size: 2.2rem; letter-spacing: -1.5px; }
            .kpi-grid { grid-template-columns: 1fr; gap: 8px; }
            .kpi-item { padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
            .ai-input-row { flex-direction: column; }
            .ai-btn-group { flex-direction: column; }
            .ai-btn-group .btn { width: 100%; }
            .form-reserve, .form-expense { grid-template-columns: 1fr; }
            .form-2col { grid-template-columns: 1fr; }
            .cat-legend { grid-template-columns: 1fr; }
            .savings-amount { font-size: 1.6rem; }
            .accent-sub-cards { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
            .app-shell { padding: 10px 10px 100px 10px; }
            .bento-grid { gap: 10px; }
            .card { padding: 16px; border-radius: 16px; }
            .balance-amount { font-size: 1.9rem; }
            .kpi-value { font-size: 1rem; }
        }

        /* ============================================================
           SCROLL & OVERFLOW
           ============================================================ */
        .scroll-area {
            max-height: 300px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #D1D5DB transparent;
        }
        .scroll-area::-webkit-scrollbar { width: 5px; }
        .scroll-area::-webkit-scrollbar-track { background: transparent; }
        .scroll-area::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 99px; }

        /* ============================================================
           UTILITY ANIMATIONS
           ============================================================ */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .card { animation: fadeIn 0.4s ease backwards; }
        .card:nth-child(1) { animation-delay: 0.05s; }
        .card:nth-child(2) { animation-delay: 0.1s; }
        .card:nth-child(3) { animation-delay: 0.15s; }
        .card:nth-child(4) { animation-delay: 0.2s; }
        .card:nth-child(5) { animation-delay: 0.25s; }
        .card:nth-child(6) { animation-delay: 0.3s; }
        .card:nth-child(7) { animation-delay: 0.35s; }

        /* Empty / Loading states */
        .empty-state {
            text-align: center;
            padding: 30px 20px;
            color: var(--text-tertiary);
        }
        .empty-state-icon { font-size: 2rem; margin-bottom: 8px; }
        .empty-state-text { font-size: 0.85rem; font-weight: 500; }

        /* More-options dots button */
        .more-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--bg-card-alt);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            color: var(--text-secondary);
            transition: background 0.2s;
        }
        .more-btn:hover { background: #E5E7EB; }

        /* Arrow CTA button */
        .cta-arrow {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--text-primary);
            color: #fff;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: var(--shadow-md);
        }
        .cta-arrow:hover { transform: scale(1.08); box-shadow: var(--shadow-lg); }
        .cta-arrow svg { width: 20px; height: 20px; }

        /* Divider */
        .divider {
            height: 1px;
            background: #F3F4F6;
            margin: 14px 0;
        }

        /* SDG pills row for mobile */
        .mobile-sdg-header {
            display: none;
        }
        @media (max-width: 768px) {
            .mobile-sdg-header {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                padding: 14px 14px 0 14px;
                max-width: 1320px;
                margin: 0 auto;
                align-items: center;
            }
            .mobile-sdg-header .brand-mobile {
                font-weight: 800;
                font-size: 1.15rem;
                margin-right: 8px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .mobile-sdg-header .nav-brand-icon {
                width: 32px;
                height: 32px;
                font-size: 1rem;
                border-radius: 10px;
            }
        }
    </style>
</head>
<body>

    <!-- =============== TOP NAVIGATION (Desktop) =============== -->
    <nav class="top-nav" id="topNav">
        <div class="top-nav-inner">
            <div class="nav-brand">
                <div class="nav-brand-icon">🐾</div>
                <div>
                    <div class="nav-brand-text">TipidTayo</div>
                    <div class="sdg-pills">
                        <span class="sdg-pill">SDG 1: No Poverty</span>
                        <span class="sdg-pill">SDG 2: Zero Hunger</span>
                        <span class="sdg-pill">SDG 4: Education</span>
                        <span class="sdg-pill">SDG 12: Responsible Consumption</span>
                    </div>
                </div>
            </div>
            <div class="nav-tabs" id="desktopTabs">
                <button class="nav-tab active" data-section="overview" onclick="switchSection('overview', this)">Overview</button>
                <button class="nav-tab" data-section="reserves" onclick="switchSection('reserves', this)">Reserves</button>
                <button class="nav-tab" data-section="expenses" onclick="switchSection('expenses', this)">Expenses</button>
                <button class="nav-tab" data-section="analytics" onclick="switchSection('analytics', this)">Analytics</button>
            </div>
            <div class="nav-right">
                <div class="nav-day-badge">
                    <span class="nav-day-dot"></span>
                    Day <?= $currentDay ?> of <?= $totalDays ?> &middot; <?= $remainingDays ?> left
                </div>
            </div>
        </div>
    </nav>

    <!-- =============== MOBILE BRAND HEADER =============== -->
    <div class="mobile-sdg-header">
        <div class="brand-mobile">
            <span class="nav-brand-icon">🐾</span>
            TipidTayo
        </div>
        <span class="sdg-pill">SDG 1</span>
        <span class="sdg-pill">SDG 2</span>
        <span class="sdg-pill">SDG 4</span>
        <span class="sdg-pill">SDG 12</span>
        <div style="margin-left: auto;">
            <div class="nav-day-badge" style="font-size:0.75rem; padding: 5px 12px;">
                <span class="nav-day-dot"></span>
                Day <?= $currentDay ?>/<?= $totalDays ?>
            </div>
        </div>
    </div>

    <!-- =============== MAIN APPLICATION SHELL =============== -->
    <div class="app-shell">
        <div class="bento-grid">

            <!-- ╔══════════════════════════════════════════════════════╗
                 ║  HERO CARD — Balance + Mascot (Always visible)      ║
                 ╚══════════════════════════════════════════════════════╝ -->
            <section class="card col-8 hero-balance section-panel" data-section="overview">
                <div class="mascot-container">
                    <div class="mascot-ring">
                        <!-- Interactive Inline SVG Mascot: Piso the Campus Puspin -->
                        <svg class="piso-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <!-- Floating Coin -->
                            <circle cx="100" cy="24" r="14" fill="#F59E0B" stroke="#fff" stroke-width="3"/>
                            <text x="100" y="29" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff">₱</text>
                            <!-- Cat Ears -->
                            <polygon points="45,85 35,38 80,62" fill="#F59E0B" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
                            <polygon points="155,85 165,38 120,62" fill="#4CAF50" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
                            <!-- Head -->
                            <ellipse cx="100" cy="110" rx="62" ry="52" fill="#FFFDF7" stroke="#E5E7EB" stroke-width="3"/>
                            <!-- Calico Patch -->
                            <path d="M115,60 C145,65 160,90 155,115 C135,105 120,85 115,60 Z" fill="#F59E0B" opacity="0.5"/>
                            <!-- Glasses -->
                            <circle cx="76" cy="105" r="18" fill="none" stroke="#6366F1" stroke-width="3.5"/>
                            <circle cx="124" cy="105" r="18" fill="none" stroke="#6366F1" stroke-width="3.5"/>
                            <line x1="94" y1="105" x2="106" y2="105" stroke="#6366F1" stroke-width="3.5"/>
                            <!-- Eyes (Morphs by state) -->
                            <?php if ($mascotState === 'peligro'): ?>
                                <text x="76" y="111" text-anchor="middle" font-size="18" font-weight="bold" fill="#F44336">T</text>
                                <text x="124" y="111" text-anchor="middle" font-size="18" font-weight="bold" fill="#F44336">T</text>
                                <path d="M88,136 Q100,126 112,136" fill="none" stroke="#F44336" stroke-width="3.5" stroke-linecap="round"/>
                            <?php elseif ($mascotState === 'warning'): ?>
                                <line x1="68" y1="105" x2="84" y2="105" stroke="#FF9800" stroke-width="3.5" stroke-linecap="round"/>
                                <line x1="116" y1="105" x2="132" y2="105" stroke="#FF9800" stroke-width="3.5" stroke-linecap="round"/>
                                <line x1="90" y1="133" x2="110" y2="133" stroke="#FF9800" stroke-width="3.5" stroke-linecap="round"/>
                            <?php else: ?>
                                <circle cx="76" cy="105" r="6" fill="#1A1D1F"/>
                                <circle cx="124" cy="105" r="6" fill="#1A1D1F"/>
                                <path d="M86,128 Q100,140 114,128" fill="none" stroke="#4CAF50" stroke-width="3.5" stroke-linecap="round"/>
                            <?php endif; ?>
                            <!-- Whiskers -->
                            <line x1="25" y1="112" x2="48" y2="116" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round"/>
                            <line x1="25" y1="124" x2="48" y2="124" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round"/>
                            <line x1="175" y1="112" x2="152" y2="116" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round"/>
                            <line x1="175" y1="124" x2="152" y2="124" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div style="text-align:left;">
                        <span class="mascot-state-badge badge-<?= $mascotState ?>" id="mascotBadge">
                            <?php
                                $badgeIcon = $mascotState === 'safe' ? '✓' : ($mascotState === 'warning' ? '⚠' : '🚨');
                            ?>
                            <?= $badgeIcon ?> <?= $statusLabel ?>
                        </span>
                        <div class="mascot-quote-bubble" id="pisoQuote">"<?= htmlspecialchars($mascotQuote) ?>"</div>
                    </div>
                </div>

                <div class="divider"></div>

                <div class="balance-section">
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <div>
                            <h2>Safe to Spend Today (Day <?= $currentDay ?>)</h2>
                            <div class="balance-amount mono" style="color: <?= $safeToSpendToday < 0 ? 'var(--status-danger)' : 'var(--text-primary)' ?>;">
                                ₱<?= number_format(abs($safeToSpendToday), 2) ?>
                                <?php if ($safeToSpendToday < 0): ?>
                                    <span style="font-size:0.5em; vertical-align:middle; color:var(--status-danger);">OVER</span>
                                <?php endif; ?>
                            </div>
                            <div class="balance-sub">
                                Daily Limit: <strong>₱<?= number_format($recommendedDailyLimit, 2) ?>/day</strong> &middot;
                                Today's Spent: <strong>₱<?= number_format($todayUnreservedSpent, 2) ?></strong>
                            </div>
                        </div>
                        <button class="cta-arrow" onclick="document.getElementById('aiPromptInput').focus()" title="Ask Piso AI">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="7" y1="17" x2="17" y2="7"></line>
                                <polyline points="7 7 17 7 17 17"></polyline>
                            </svg>
                        </button>
                    </div>

                    <div class="kpi-grid">
                        <div class="kpi-item">
                            <div class="kpi-label">Total Cash Left</div>
                            <div class="kpi-value mono">₱<?= number_format($totalRemainingCash, 2) ?></div>
                        </div>
                        <div class="kpi-item">
                            <div class="kpi-label">Locked Reserves + Goal</div>
                            <div class="kpi-value mono indigo">₱<?= number_format($lockedPool, 2) ?></div>
                        </div>
                        <div class="kpi-item">
                            <div class="kpi-label">Free Spendable Pool</div>
                            <div class="kpi-value mono green">₱<?= number_format($freeSpendablePool, 2) ?></div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ╔══════════════════════════════════════════════════════╗
                 ║  SAVINGS GOAL ACCENT CARD                           ║
                 ╚══════════════════════════════════════════════════════╝ -->
            <section class="card col-4 accent-card section-panel" data-section="overview">
                <div class="card-header">
                    <span class="step-chip green">🎯 Savings</span>
                    <div class="card-header-right">
                        <button class="more-btn" style="background:rgba(255,255,255,0.3);">⋯</button>
                    </div>
                </div>
                <div style="position:relative; z-index:1;">
                    <div style="font-size:0.82rem; font-weight:500; color: rgba(0,0,0,0.5); margin-bottom:4px;">Your Savings Goal</div>
                    <div class="savings-amount mono">₱<?= number_format($savingsGoal, 2) ?></div>
                    <?php
                        $savingsPct = $totalRemainingCash > 0 && $savingsGoal > 0
                            ? min(100, round(($savingsGoal / $totalRemainingCash) * 100))
                            : 0;
                    ?>
                    <div class="savings-change"><?= $savingsPct ?>% of remaining cash protected</div>

                    <div class="accent-sub-cards">
                        <div class="accent-sub-item">
                            <div class="accent-sub-label">Reserved Funds</div>
                            <div class="accent-sub-value mono">₱<?= number_format($unspentReservedLock, 2) ?></div>
                        </div>
                        <div class="accent-sub-item">
                            <div class="accent-sub-label">Avg Daily Burn</div>
                            <div class="accent-sub-value mono">₱<?= number_format($avgDailyBurn, 2) ?></div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ╔══════════════════════════════════════════════════════╗
                 ║  AI COMMAND CENTER                                   ║
                 ╚══════════════════════════════════════════════════════╝ -->
            <section class="card col-12 ai-card section-panel" data-section="overview">
                <div class="card-header">
                    <div class="card-header-icon indigo">🤖</div>
                    <div>
                        <div class="card-header-title">Piso Agentic AI</div>
                        <div class="card-header-sub">Taglish Expense Logger & "Kaya Ba?" Impulse Simulator • Works Offline & Online</div>
                    </div>
                    <div class="card-header-right">
                        <span class="step-chip indigo">AI</span>
                    </div>
                </div>
                <div class="ai-input-row">
                    <input type="text" id="aiPromptInput"
                           placeholder="Try: 'Nag-tricycle ako 25 tapos bumili ng siomai rice 45' OR 'Kaya ba bumili ng 130 iced coffee?'">
                    <div class="ai-btn-group">
                        <button type="button" class="btn btn-ai" onclick="sendToPisoAI('log')">📝 Auto-Log</button>
                        <button type="button" class="btn btn-outline" onclick="sendToPisoAI('simulate')">🔮 Kaya Ba?</button>
                    </div>
                </div>
                <div class="ai-response" id="aiResponseBox"></div>
            </section>

            <!-- ╔══════════════════════════════════════════════════════╗
                 ║  ALLOWANCE SETUP (Step 1)                           ║
                 ╚══════════════════════════════════════════════════════╝ -->
            <section class="card col-4 section-panel" data-section="overview" id="sectionSetup">
                <div class="card-header">
                    <div class="card-header-icon gold">⚙️</div>
                    <div>
                        <div class="card-header-title">Allowance Setup</div>
                        <div class="card-header-sub">Plan your budget cycle</div>
                    </div>
                    <div class="card-header-right">
                        <span class="step-chip">Step 1</span>
                    </div>
                </div>
                <form id="cycleForm">
                    <input type="hidden" name="action" value="update_cycle">
                    <div class="input-group">
                        <label class="input-label">Total Allowance (₱)</label>
                        <input type="number" step="0.01" name="total_allowance" value="<?= $totalAllowance ?>" required>
                    </div>
                    <div class="form-row form-2col" style="margin-bottom: 14px;">
                        <div class="input-group" style="margin-bottom:0;">
                            <label class="input-label">Total Days</label>
                            <input type="number" name="total_days" value="<?= $totalDays ?>" required>
                        </div>
                        <div class="input-group" style="margin-bottom:0;">
                            <label class="input-label">Current Day</label>
                            <input type="number" name="current_day" value="<?= $currentDay ?>" required>
                        </div>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Savings Goal (₱)</label>
                        <input type="number" step="0.01" name="savings_goal" value="<?= $savingsGoal ?>" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Update Budget Plan</button>
                </form>
            </section>

            <!-- ╔══════════════════════════════════════════════════════╗
                 ║  SPENDING BREAKDOWN (Step 5) — Donut Chart           ║
                 ╚══════════════════════════════════════════════════════╝ -->
            <section class="card col-4 section-panel" data-section="analytics" id="sectionAnalytics">
                <div class="card-header">
                    <div class="card-header-icon green">📊</div>
                    <div>
                        <div class="card-header-title">Spending</div>
                        <div class="card-header-sub">Category Breakdown</div>
                    </div>
                    <div class="card-header-right">
                        <span class="step-chip">Step 5</span>
                    </div>
                </div>

                <!-- Donut Chart via SVG -->
                <div class="donut-container">
                    <?php
                        $donutRadius = 60;
                        $donutCircum = 2 * M_PI * $donutRadius;
                        $donutOffset = 0;
                    ?>
                    <svg viewBox="0 0 160 160" width="160" height="160">
                        <?php if ($totalSpentAll > 0): ?>
                            <?php foreach ($catTotals as $catName => $catSum):
                                $catPct = $catSum / $totalSpentAll;
                                $dashLen = $catPct * $donutCircum;
                                $dashGap = $donutCircum - $dashLen;
                                $color = $catColors[$catName] ?? '#D1D5DB';
                            ?>
                                <circle cx="80" cy="80" r="<?= $donutRadius ?>" fill="none"
                                        stroke="<?= $color ?>" stroke-width="20"
                                        stroke-dasharray="<?= $dashLen ?> <?= $dashGap ?>"
                                        stroke-dashoffset="<?= -$donutOffset ?>"
                                        stroke-linecap="butt"
                                        transform="rotate(-90, 80, 80)"/>
                            <?php
                                $donutOffset += $dashLen;
                            endforeach; ?>
                        <?php else: ?>
                            <circle cx="80" cy="80" r="<?= $donutRadius ?>" fill="none" stroke="#F3F4F6" stroke-width="20"/>
                        <?php endif; ?>
                    </svg>
                    <div class="donut-center">
                        <div class="donut-center-amount mono">₱<?= number_format($totalSpentAll, 2) ?></div>
                        <div class="donut-center-label">Total Spent</div>
                    </div>
                </div>

                <div class="cat-legend">
                    <?php foreach ($catTotals as $catName => $catSum):
                        $color = $catColors[$catName] ?? '#D1D5DB';
                    ?>
                        <div class="cat-legend-item">
                            <span class="cat-dot" style="background:<?= $color ?>;"></span>
                            <div class="cat-legend-text">
                                <div class="cat-legend-name"><?= $catName ?></div>
                                <div class="cat-legend-value mono">₱<?= number_format($catSum, 2) ?></div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>

            <!-- ╔══════════════════════════════════════════════════════╗
                 ║  EARNING / ALLOWANCE OVERVIEW                        ║
                 ╚══════════════════════════════════════════════════════╝ -->
            <section class="card col-4 section-panel" data-section="overview">
                <div class="card-header">
                    <div class="card-header-icon warm">💰</div>
                    <div>
                        <div class="card-header-title">Allowance</div>
                        <div class="card-header-sub">Your budget overview</div>
                    </div>
                </div>
                <div style="font-size:2.2rem; font-weight:900; letter-spacing:-1.5px; margin-bottom:6px;" class="mono">
                    ₱<?= number_format($totalAllowance, 2) ?>
                </div>
                <?php
                    $spentPct = $totalAllowance > 0 ? round(($totalSpentAll / $totalAllowance) * 100) : 0;
                ?>
                <div style="font-size:0.82rem; color:var(--accent-green); font-weight:700; margin-bottom:14px;">
                    <?= (100 - $spentPct) ?>% remaining
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:0.82rem; color:var(--text-secondary); font-weight:500;">Total Spent</span>
                    <span class="mono" style="font-size:0.88rem;">₱<?= number_format($totalSpentAll, 2) ?></span>
                </div>
                <div class="progress-track" style="margin-bottom:14px;">
                    <div class="progress-fill" style="width:<?= $spentPct ?>%; background: <?= $spentPct > 80 ? 'var(--status-danger)' : ($spentPct > 60 ? 'var(--status-warn)' : 'var(--accent-green)') ?>;"></div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:0.82rem; color:var(--text-secondary); font-weight:500;">Reserved</span>
                    <span class="mono" style="font-size:0.88rem;">₱<?= number_format($totalReservedAllocated, 2) ?></span>
                </div>
                <div class="progress-track" style="margin-bottom:14px;">
                    <?php $reservePct = $totalAllowance > 0 ? round(($totalReservedAllocated / $totalAllowance) * 100) : 0; ?>
                    <div class="progress-fill" style="width:<?= $reservePct ?>%; background: var(--ai-indigo);"></div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.82rem; color:var(--text-secondary); font-weight:500;">Savings Goal</span>
                    <span class="mono" style="font-size:0.88rem;">₱<?= number_format($savingsGoal, 2) ?></span>
                </div>
            </section>

            <!-- ╔══════════════════════════════════════════════════════╗
                 ║  RESERVED VAULTS (Step 2)                            ║
                 ╚══════════════════════════════════════════════════════╝ -->
            <section class="card col-6 section-panel" data-section="reserves" id="sectionReserves">
                <div class="card-header">
                    <div class="card-header-icon indigo">🔒</div>
                    <div>
                        <div class="card-header-title">Locked Essential Vaults</div>
                        <div class="card-header-sub">Protected funds for fare, school & food</div>
                    </div>
                    <div class="card-header-right">
                        <span class="step-chip">Step 2</span>
                    </div>
                </div>

                <div class="scroll-area" style="max-height:260px; margin-bottom:14px;">
                    <?php if (empty($reserves)): ?>
                        <div class="empty-state">
                            <div class="empty-state-icon">🔐</div>
                            <div class="empty-state-text">No locked vaults yet. Add your first essential expense below.</div>
                        </div>
                    <?php else: ?>
                        <?php foreach ($reserves as $res):
                            $alloc = floatval($res['allocated_amount']);
                            $spent = floatval($res['spent_amount']);
                            $pct = $alloc > 0 ? min(100, round(($spent / $alloc) * 100)) : 0;
                            $vaultCatClass = strtolower(str_replace(' ', '', $res['category']));
                            $vaultIconMap = [
                                'Food' => '🍱',
                                'Transportation' => '🚌',
                                'School Expenses' => '📚'
                            ];
                            $vaultIcon = $vaultIconMap[$res['category']] ?? '📦';
                            $vaultColorClass = match(true) {
                                str_contains($res['category'], 'Food') => 'food',
                                str_contains($res['category'], 'Transport') => 'transport',
                                str_contains($res['category'], 'School') => 'school',
                                default => 'personal'
                            };
                        ?>
                            <div class="vault-item">
                                <div class="vault-icon <?= $vaultColorClass ?>"><?= $vaultIcon ?></div>
                                <div class="vault-info">
                                    <div class="vault-title"><?= htmlspecialchars($res['title']) ?></div>
                                    <div class="vault-cat"><?= $res['category'] ?></div>
                                    <div class="progress-track" style="margin-top:4px;">
                                        <div class="progress-fill" style="width:<?= $pct ?>%; background: <?= $pct > 90 ? 'var(--status-danger)' : ($pct > 70 ? 'var(--status-warn)' : 'var(--ai-indigo)') ?>;"></div>
                                    </div>
                                </div>
                                <div class="vault-amounts">
                                    <div class="vault-spent mono">₱<?= number_format($spent, 2) ?></div>
                                    <div class="vault-alloc">of ₱<?= number_format($alloc, 2) ?></div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <div class="divider"></div>
                <form id="reserveForm">
                    <input type="hidden" name="action" value="add_reserve">
                    <div class="form-row form-reserve" style="margin-bottom:10px;">
                        <input type="text" name="title" placeholder="e.g., Lab Manual / Fare" required>
                        <select name="category">
                            <option value="School Expenses">📚 School</option>
                            <option value="Transportation">🚌 Transport</option>
                            <option value="Food">🍱 Food</option>
                        </select>
                        <input type="number" step="0.01" name="allocated_amount" placeholder="₱ Amount" required>
                        <button type="submit" class="btn btn-primary">+ Lock</button>
                    </div>
                </form>
            </section>

            <!-- ╔══════════════════════════════════════════════════════╗
                 ║  TRANSACTIONS (Step 4)                               ║
                 ╚══════════════════════════════════════════════════════╝ -->
            <section class="card col-6 section-panel" data-section="expenses" id="sectionExpenses">
                <div class="card-header">
                    <div class="card-header-icon green">📝</div>
                    <div>
                        <div class="card-header-title">Transactions</div>
                        <div class="card-header-sub">Record & track purchases</div>
                    </div>
                    <div class="card-header-right">
                        <span class="step-chip">Step 4</span>
                        <button class="more-btn">⋯</button>
                    </div>
                </div>

                <form id="expenseForm" style="margin-bottom:16px;">
                    <input type="hidden" name="action" value="add_expense">
                    <div class="form-row form-expense" style="margin-bottom: 10px;">
                        <input type="text" name="title" placeholder="Item (e.g., Karinderya Lunch)" required>
                        <select name="category">
                            <option value="Food">🍱 Food</option>
                            <option value="Transportation">🚌 Transportation</option>
                            <option value="School Expenses">📚 School Expenses</option>
                            <option value="Personal Needs">🧴 Personal Needs</option>
                        </select>
                        <input type="number" step="0.01" name="amount" placeholder="₱ Cost" required>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                        <label class="checkbox-label">
                            <input type="checkbox" name="is_from_reserved" value="1">
                            Deduct from Reserved Vault
                        </label>
                        <button type="submit" class="btn btn-primary">+ Record</button>
                    </div>
                </form>

                <div class="divider"></div>

                <div class="scroll-area">
                    <ul class="tx-list">
                        <?php if (empty($expenses)): ?>
                            <div class="empty-state">
                                <div class="empty-state-icon">📋</div>
                                <div class="empty-state-text">No transactions yet. Log your first expense above or use the AI.</div>
                            </div>
                        <?php else: ?>
                            <?php foreach ($expenses as $exp):
                                $expCatIcon = $catIcons[$exp['category']] ?? '📦';
                                $expCatColorClass = match(true) {
                                    str_contains($exp['category'], 'Food') => 'food',
                                    str_contains($exp['category'], 'Transport') => 'transport',
                                    str_contains($exp['category'], 'School') => 'school',
                                    default => 'personal'
                                };
                            ?>
                                <li class="tx-item">
                                    <div class="tx-icon vault-icon <?= $expCatColorClass ?>"><?= $expCatIcon ?></div>
                                    <div class="tx-info">
                                        <div class="tx-title"><?= htmlspecialchars($exp['title']) ?></div>
                                        <div class="tx-meta">
                                            Day <?= $exp['day_logged'] ?> &middot; <?= $exp['logged_via'] ?>
                                            <?php if ($exp['is_from_reserved']): ?>
                                                <span class="tx-vault-badge">🔒 Vault</span>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                    <div class="tx-amount">-₱<?= number_format($exp['amount'], 2) ?></div>
                                </li>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </ul>
                </div>
            </section>

        </div>
    </div>

    <!-- =============== MOBILE BOTTOM NAVIGATION =============== -->
    <nav class="bottom-nav" id="bottomNav">
        <div class="bottom-nav-inner">
            <button class="bnav-item active" data-section="overview" onclick="switchSection('overview', this)">
                <span class="bnav-icon">🏠</span>
                <span class="bnav-label">Home</span>
            </button>
            <button class="bnav-item" data-section="reserves" onclick="switchSection('reserves', this)">
                <span class="bnav-icon">🔒</span>
                <span class="bnav-label">Reserves</span>
            </button>
            <button class="bnav-item" data-section="expenses" onclick="switchSection('expenses', this)">
                <span class="bnav-icon">📝</span>
                <span class="bnav-label">Expenses</span>
            </button>
            <button class="bnav-item" data-section="analytics" onclick="switchSection('analytics', this)">
                <span class="bnav-icon">📊</span>
                <span class="bnav-label">Analytics</span>
            </button>
        </div>
    </nav>

    <script>
        /* ============================================================
           FORM HANDLING
           ============================================================ */
        function postForm(formId) {
            const form = document.getElementById(formId);
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                const origText = btn.innerHTML;
                btn.innerHTML = '⏳';
                btn.disabled = true;

                const formData = new FormData(form);
                await fetch('api/budget_action.php', { method: 'POST', body: formData });

                btn.innerHTML = '✓';
                setTimeout(() => window.location.reload(), 400);
            });
        }
        postForm('cycleForm');
        postForm('reserveForm');
        postForm('expenseForm');

        /* ============================================================
           AI AGENT
           ============================================================ */
        async function sendToPisoAI(mode) {
            const input = document.getElementById('aiPromptInput');
            const box = document.getElementById('aiResponseBox');
            const text = input.value.trim();
            if (!text) {
                input.focus();
                input.style.borderColor = 'var(--status-warn)';
                setTimeout(() => { input.style.borderColor = ''; }, 1200);
                return;
            }

            box.style.display = 'block';
            box.innerHTML = '🐾 <em>Nag-kokompyut si Piso...</em>';

            try {
                const res = await fetch('api/ai_agent.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: mode, prompt: text })
                });
                const data = await res.json();
                box.innerHTML = (data.reply || data.error || 'No response').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                if (data.refresh) {
                    setTimeout(() => window.location.reload(), 1600);
                }
            } catch (err) {
                box.innerHTML = '⚠️ Network error. Try again.';
            }
        }

        // Enter key support for AI input
        document.getElementById('aiPromptInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendToPisoAI('log');
            }
        });

        /* ============================================================
           SECTION NAVIGATION (Mobile & Desktop Tabs)
           ============================================================ */
        function switchSection(sectionName, clickedEl) {
            const isMobile = window.innerWidth <= 768;

            // Update tab/nav active states
            const navItems = isMobile
                ? document.querySelectorAll('.bnav-item')
                : document.querySelectorAll('.nav-tab');
            navItems.forEach(item => item.classList.remove('active'));
            clickedEl.classList.add('active');

            // Sync the other nav
            if (isMobile) {
                document.querySelectorAll('.nav-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.section === sectionName);
                });
            } else {
                document.querySelectorAll('.bnav-item').forEach(t => {
                    t.classList.toggle('active', t.dataset.section === sectionName);
                });
            }

            // On mobile, show/hide section panels
            if (isMobile) {
                document.querySelectorAll('.section-panel').forEach(panel => {
                    const panelSection = panel.dataset.section;
                    if (sectionName === 'overview') {
                        // Show everything on overview
                        panel.style.display = '';
                    } else {
                        panel.style.display = (panelSection === sectionName || panelSection === 'overview') ? '' : 'none';
                    }
                });
            } else {
                // Desktop: show all
                document.querySelectorAll('.section-panel').forEach(panel => {
                    panel.style.display = '';
                });
            }
        }

        // Handle resize: show all panels when going desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                document.querySelectorAll('.section-panel').forEach(panel => {
                    panel.style.display = '';
                });
            }
        });
    </script>
</body>
</html>