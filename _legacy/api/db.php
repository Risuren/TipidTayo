<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '';$dbname = 'tipidtayo_db';

$conn = new mysqli($host, $user,$pass);
if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}

$conn->query("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$conn->select_db($dbname);

// 1. Budget Cycles Table
$conn->query("CREATE TABLE IF NOT EXISTS budget_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) DEFAULT 'Iskolar',
    total_allowance DECIMAL(10,2) NOT NULL DEFAULT 1500.00,
    total_days INT NOT NULL DEFAULT 14,
    current_day INT NOT NULL DEFAULT 4,
    savings_goal DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    ai_provider VARCHAR(30) DEFAULT 'offline_smart',
    api_key VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// 2. Reserved Essential Expenses Table (Step 2)
$conn->query("CREATE TABLE IF NOT EXISTS reserved_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cycle_id INT NOT NULL DEFAULT 1,
    title VARCHAR(100) NOT NULL,
    category ENUM('Transportation', 'School Expenses', 'Food', 'Personal Needs') NOT NULL,
    allocated_amount DECIMAL(10,2) NOT NULL,
    spent_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00
)");

// 3. Daily Logged Expenses Table (Step 4)
$conn->query("CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cycle_id INT NOT NULL DEFAULT 1,
    title VARCHAR(150) NOT NULL,
    category ENUM('Food', 'Transportation', 'School Expenses', 'Personal Needs') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_from_reserved TINYINT(1) NOT NULL DEFAULT 0,
    logged_via VARCHAR(30) DEFAULT 'Manual',
    day_logged INT NOT NULL DEFAULT 4,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Auto-seed starter data if empty so the app works immediately on first load
$check =$conn->query("SELECT COUNT(*) as cnt FROM budget_cycles")->fetch_assoc();
if ($check['cnt'] == 0) {$conn->query("INSERT INTO budget_cycles (student_name, total_allowance, total_days, current_day, savings_goal, ai_provider) 
                  VALUES ('Iskolar Ren', 1500.00, 14, 4, 100.00, 'offline_smart')");

    $conn->query("INSERT INTO reserved_expenses (cycle_id, title, category, allocated_amount, spent_amount) VALUES
        (1, 'Thesis Printing & Handouts', 'School Expenses', 200.00, 60.00),
        (1, 'Fixed Jeep/Tricycle Commute Reserve', 'Transportation', 250.00, 70.00)");

    $conn->query("INSERT INTO expenses (cycle_id, title, category, amount, is_from_reserved, logged_via, day_logged) VALUES
        (1, 'Morning Tricycle & Jeep', 'Transportation', 35.00, 1, 'Manual', 1),
        (1, 'Carinderia Student Meal', 'Food', 65.00, 0, 'Manual', 1),
        (1, 'Roundtrip Campus Commute', 'Transportation', 35.00, 1, 'Manual', 2),
        (1, 'Siomai Rice + Gulaman', 'Food', 55.00, 0, 'AI_Agent', 2),
        (1, 'Lab Manual Xerox & Folder', 'School Expenses', 60.00, 1, 'AI_Agent', 3),
        (1, 'Lugaw with Egg & Tokwa', 'Food', 45.00, 0, 'Manual', 4)");
}
?>