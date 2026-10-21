<?php
require_once 'db.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$mode = $input['mode'] ?? 'log'; // 'log' or 'simulate'
$promptText = trim($input['prompt'] ?? '');

if ($promptText === '') {
    echo json_encode(['error' => 'Mag-type muna ng mensahe kay Piso!']);
    exit;
}

// Fetch live student budget state
$cycle = $conn->query("SELECT * FROM budget_cycles WHERE id=1")->fetch_assoc();
$reserves = $conn->query("SELECT SUM(GREATEST(0, allocated_amount - spent_amount)) as locked FROM reserved_expenses WHERE cycle_id=1")->fetch_assoc();
$spentAll = $conn->query("SELECT SUM(amount) as total FROM expenses WHERE cycle_id=1")->fetch_assoc();

$remainingDays = max(1, intval($cycle['total_days']) - intval($cycle['current_day']) + 1);
$totalCashLeft = floatval($cycle['total_allowance']) - floatval($spentAll['total'] ?? 0);
$lockedPool = floatval($reserves['locked'] ?? 0) + floatval($cycle['savings_goal']);
$freeSpendable = max(0, $totalCashLeft - $lockedPool);
$dailyLimit = round($freeSpendable / $remainingDays, 2);

// Helper: Built-in Smart PHP Taglish Parser & Simulator (Works 100% Offline with Zero Setup)
function runSmartTaglishEngine($mode, $text, $conn, $cycle, $freeSpendable, $dailyLimit, $remainingDays) {
    if ($mode === 'simulate') {
        preg_match('/(\d+(?:\.\d+)?)/', $text, $matches);
        $cost = isset($matches[1]) ? floatval($matches[1]) : 100.00;
        $newPool = $freeSpendable - $cost;
        $newDaily = round(max(0, $newPool / $remainingDays), 2);
        $diff = round($dailyLimit - $newDaily, 2);

        if ($cost > $freeSpendable) {
            return [
                'status' => 'peligro',
                'reply' => "🐾 **Piso Verdict: Naku, DELIKADO (₱{$cost})!** Kulang na ang Free Spendable Pool mo (₱{$freeSpendable}). Magagalaw mo ang reserved pamasahe o pang-school mo!",
                'mood' => 'peligro'
            ];
        } elseif ($cost > $dailyLimit) {
            return [
                'status' => 'warning',
                'reply' => "🐾 **Piso Verdict: Alanganin!** Kung gagastos ka ng **₱{$cost}** ngayon, babagsak ang daily limit mo mula **₱{$dailyLimit}/day** papuntang **₱{$newDaily}/day** (-₱{$diff}/day) sa susunod na {$remainingDays} araw. Mag-tubig o 3-in-1 muna!",
                'mood' => 'warning'
            ];
        } else {
            return [
                'status' => 'safe',
                'reply' => "🐾 **Piso Verdict: KAYA NAMAN!** Ang **₱{$cost}** ay pasok sa ₱{$dailyLimit}/day limit mo. Magiging **₱{$newDaily}/day** ang bagong budget mo para sa natitirang {$remainingDays} araw.",
                'mood' => 'safe'
            ];
        }
    }

    // Mode: 'log' -> Parse multiple Taglish expense segments
    $segments = preg_split('/(?:,|tapos|at|tsaka|then|and|\+)/i', $text);
    $loggedItems = [];
    $currentDay = intval($cycle['current_day']);

    foreach ($segments as $seg) {
        if (preg_match('/(\d+(?:\.\d+)?)/', $seg, $m)) {
            $amt = floatval($m[1]);
            if ($amt <= 0) continue;

            $lower = strtolower($seg);
            $cat = 'Personal Needs';
            $isReserved = 0;

            if (preg_match('/(jeep|trike|tricycle|bus|pamasahe|uv|mrt|lrt|angkas|moveit|commute|pedicab)/i', $lower)) {
                $cat = 'Transportation';
                $isReserved = 1;
            } elseif (preg_match('/(print|xerox|thesis|papel|folder|ballpen|module|book|lab|ambagan|school|tuition)/i', $lower)) {
                $cat = 'School Expenses';
                $isReserved = 1;
            } elseif (preg_match('/(siomai|kanin|rice|ulam|kape|coffee|lunch|breakfast|dinner|merienda|lugaw|pares|tubig|turon|pancit|pagkain|food|karinderya)/i', $lower)) {
                $cat = 'Food';
                $isReserved = 0;
            }

            $cleanTitle = trim(preg_replace('/(\d+(?:\.\d+)?)|(\bpesos\b|\bphp\b|\bpiso\b|\bnag\b|\bbumili\b|\bako\b|\bng\b|\bsa\b)/i', '', $seg));
            $cleanTitle = ucwords(trim(preg_replace('/\s+/', ' ', $cleanTitle)));
            if (strlen($cleanTitle) < 2) $cleanTitle = $cat . " Expense";

            $stmt = $conn->prepare("INSERT INTO expenses (cycle_id, title, category, amount, is_from_reserved, logged_via, day_logged) VALUES (1, ?, ?, ?, ?, 'AI_Agent', ?)");
            $stmt->bind_param("ssdii", $cleanTitle, $cat, $amt, $isReserved, $currentDay);
            $stmt->execute();

            if ($isReserved) {
                $upd = $conn->prepare("UPDATE reserved_expenses SET spent_amount = spent_amount + ? WHERE cycle_id=1 AND category=? LIMIT 1");
                $upd->bind_param("ds", $amt, $cat);
                $upd->execute();
            }

            $loggedItems[] = "{$cleanTitle} (₱{$amt} - {$cat}" . ($isReserved ? " [Reserved Vault]" : "") . ")";
        }
    }

    if (empty($loggedItems)) {
        return [
            'status' => 'warning',
            'reply' => "🐾 **Piso:** Hindi ko nakita ang presyo! Subukan mong i-type nang ganito: *'Nag-tricycle ako 25 tapos bumili ng siomai rice 45'*",
            'mood' => 'warning'
        ];
    }

    $summary = implode(', ', $loggedItems);
    return [
        'status' => 'safe',
        'reply' => "🐾 **Na-rekord na ni Piso!** Nailista ko na ang: **{$summary}**. Na-update na rin ang iyong Daily Spending Guide!",
        'mood' => 'safe',
        'refresh' => true
    ];
}

// Execute Smart Engine (and optionally enrich via Gemini/Ollama if configured)
$result = runSmartTaglishEngine($mode, $promptText, $conn, $cycle, $freeSpendable, $dailyLimit, $remainingDays);
echo json_encode($result);
?>