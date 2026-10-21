<?php
require_once 'db.php';
header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'update_cycle') {
    $allowance = floatval($_POST['total_allowance']);
    $days = max(1, intval($_POST['total_days']));
    $current_day = max(1, min($days, intval($_POST['current_day'])));
    $savings = max(0, floatval($_POST['savings_goal']));
    $provider = $_POST['ai_provider'] ?? 'offline_smart';
    $api_key = trim($_POST['api_key'] ?? '');

    $stmt = $conn->prepare("UPDATE budget_cycles SET total_allowance=?, total_days=?, current_day=?, savings_goal=?, ai_provider=?, api_key=? WHERE id=1");
    $stmt->bind_param("diidss", $allowance, $days, $current_day, $savings, $provider, $api_key);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'add_reserve') {
    $title = htmlspecialchars(trim($_POST['title']));
    $category = $_POST['category'];
    $amount = max(1, floatval($_POST['allocated_amount']));

    $stmt = $conn->prepare("INSERT INTO reserved_expenses (cycle_id, title, category, allocated_amount) VALUES (1, ?, ?, ?)");
    $stmt->bind_param("ssd", $title, $category, $amount);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete_reserve') {
    $id = intval($_POST['id']);
    $stmt = $conn->prepare("DELETE FROM reserved_expenses WHERE id=? AND cycle_id=1");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'add_expense') {
    $title = htmlspecialchars(trim($_POST['title']));
    $category = $_POST['category'];
    $amount = max(1, floatval($_POST['amount']));
    $is_reserved = isset($_POST['is_from_reserved']) && $_POST['is_from_reserved'] == '1' ? 1 : 0;

    $cycle = $conn->query("SELECT current_day FROM budget_cycles WHERE id=1")->fetch_assoc();
    $day_logged = intval($cycle['current_day']);

    $stmt = $conn->prepare("INSERT INTO expenses (cycle_id, title, category, amount, is_from_reserved, logged_via, day_logged) VALUES (1, ?, ?, ?, ?, 'Manual', ?)");
    $stmt->bind_param("ssdii", $title, $category, $amount, $is_reserved, $day_logged);
    $stmt->execute();

    if ($is_reserved) {
        $upd = $conn->prepare("UPDATE reserved_expenses SET spent_amount = spent_amount + ? WHERE cycle_id=1 AND category=? ORDER BY (allocated_amount - spent_amount) DESC LIMIT 1");
        $upd->bind_param("ds", $amount, $category);
        $upd->execute();
    }
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete_expense') {
    $id = intval($_POST['id']);
    $stmt = $conn->prepare("DELETE FROM expenses WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['error' => 'Invalid action']);
?>