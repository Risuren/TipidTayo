-- TipidTayo v2 Database Schema (Redesign)
-- Clean slate: No seed data, strictly structured for authentication, onboarding, and multi-user support

CREATE DATABASE IF NOT EXISTS tipidtayo_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tipidtayo_v2;

-- Users table with auth, OAuth, onboarding and tutorial flags
CREATE TABLE IF NOT EXISTS users (
    id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                  VARCHAR(100) NOT NULL,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at     TIMESTAMP NULL,
    password              VARCHAR(255) NULL,         -- NULL for Google-only accounts
    google_id             VARCHAR(255) NULL UNIQUE,
    avatar_url            VARCHAR(500) NULL,
    remember_token        VARCHAR(100) NULL,
    onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
    has_seen_tutorial     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table for Sanctum cookie auth
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload LONGTEXT NOT NULL,
    last_activity INT NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Personal Access Tokens for Sanctum (token-based fallback / mobile API)
CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT NULL,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_tokenable (tokenable_type, tokenable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Budget Cycles (One active per user)
CREATE TABLE IF NOT EXISTS budget_cycles (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    label           VARCHAR(100) DEFAULT 'My Budget Cycle',
    total_allowance DECIMAL(12,2) NOT NULL,
    total_days      INT UNSIGNED NOT NULL,
    start_date      DATE NOT NULL,          -- current_day = DATEDIFF(CURRENT_DATE, start_date) + 1
    savings_goal    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    ai_provider     VARCHAR(30) DEFAULT 'offline_smart',
    api_key         VARCHAR(255) DEFAULT '',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reserved Expenses
CREATE TABLE IF NOT EXISTS reserved_expenses (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT UNSIGNED NOT NULL,
    cycle_id         BIGINT UNSIGNED NOT NULL,
    title            VARCHAR(150) NOT NULL,
    category         ENUM('Food','Transportation','School Expenses','Personal Needs') NOT NULL,
    allocated_amount DECIMAL(12,2) NOT NULL,
    spent_amount     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_optional      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cycle_id) REFERENCES budget_cycles(id) ON DELETE CASCADE,
    INDEX idx_user_cycle (user_id, cycle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    cycle_id        BIGINT UNSIGNED NOT NULL,
    reserve_id      BIGINT UNSIGNED NULL,
    title           VARCHAR(200) NOT NULL,
    category        ENUM('Food','Transportation','School Expenses','Personal Needs') NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    is_from_reserved BOOLEAN NOT NULL DEFAULT FALSE,
    logged_via      ENUM('Manual','AI_Agent') NOT NULL DEFAULT 'Manual',
    logged_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cycle_id) REFERENCES budget_cycles(id) ON DELETE CASCADE,
    FOREIGN KEY (reserve_id) REFERENCES reserved_expenses(id) ON DELETE SET NULL,
    INDEX idx_user_cycle (user_id, cycle_id),
    INDEX idx_logged_at (logged_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
