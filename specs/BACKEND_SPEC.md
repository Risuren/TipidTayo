# TipidTayo Backend, Math & AI Specification (Editable)

> **Instructions for Team**: Edit the formulas, categories, or AI rules below, save, and tell the Antigravity agent: `@specs/BACKEND_SPEC.md Update the backend files to match this spec.`

## 1. Zero-Config Database Auto-Setup (`api/db.php`)
- Connect to `localhost` (`root`, empty password `""`) via `PDO` or `mysqli`.
- Automatically run `CREATE DATABASE IF NOT EXISTS tipidtayo_db` and create the 3 tables (`budget_cycles`, `reserved_expenses`, `expenses`) + seed realistic Filipino college student data if the tables are empty.

## 2. The 5-Step Mathematical Formulas (`api/budget_action.php`)
Given an active cycle in `budget_cycles`:
1. `Remaining Days` = `MAX(1, total_days - current_day + 1)`
2. `Unspent Reserved Funds` = Sum of `MAX(0, allocated_amount - spent_amount)` across all rows in `reserved_expenses`.
3. `Total Spent (All)` = Sum of all `amount` in `expenses`.
4. `Total Remaining Cash` = `total_allowance - Total Spent (All)`.
5. `Free Spendable Pool` = `Total Remaining Cash - Unspent Reserved Funds - savings_goal`.
6. `Recommended Daily Limit` = `MAX(0, Free Spendable Pool / Remaining Days)`.
7. `Today's Unreserved Spent` = Sum of today's expenses where `is_from_reserved = 0`.
8. `Safe to Spend Today` = `Recommended Daily Limit - Today's Unreserved Spent`.
9. **Sustainability Pace Check**:
   - `Average Daily Burn` = `Unreserved Spent So Far / MAX(1, current_day)`.
   - `Projected Days Remaining` = `Free Spendable Pool / MAX(1, Average Daily Burn)`.
   - If `Safe to Spend Today < 0` or `Free Spendable Pool <= 0` -> State = `peligro`.
   - Else if `Safe to Spend Today < (Recommended Daily Limit * 0.25)` -> State = `warning`.
   - Else -> State = `safe`.

## 3. Dual-Mode AI Agent (`api/ai_agent.php`)
Accepts JSON POST `{ "mode": "log" | "simulate", "prompt": "...", "ai_provider": "gemini" | "groq" | "ollama" | "offline_smart", "api_key": "..." }`.
- **Action 1 (`mode = "log"`)**: Extracts one or multiple expenses from natural Taglish text into an array of items: `[{ "title": "Jeepney Fare", "category": "Transportation", "amount": 15, "is_from_reserved": 1 }]`, inserts them into MySQL, updates any matching `reserved_expenses.spent_amount`, and returns Piso's witty Taglish reply.
- **Action 2 (`mode = "simulate"`)**: Extracts the proposed impulse purchase price from the user's question (e.g., `₱130`), computes the **New Daily Limit** if bought (`(Free Spendable Pool - 130) / Remaining Days`), and returns a clear comparison + Piso's recommendation without deducting the money yet.