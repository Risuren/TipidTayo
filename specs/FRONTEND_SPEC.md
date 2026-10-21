# TipidTayo Frontend & Mascot Specification (Editable)

> **Instructions for Team**: Edit any colors, mascot states, or layout blocks below, save this file, and tell the Antigravity agent: `@specs/FRONTEND_SPEC.md Apply the updated frontend spec.`

## 1. Mascot Profile: "Piso" (The Campus Puspin & Alkansya Companion)
- **Visual Style**: Cute Filipino street cat (*Puspin*) wearing round glasses and a terracotta coin-bank (*alkansya*) backpack, rendered via crisp Inline SVG.
- **4 Reactive States (Triggered automatically by budget math)**:
  1. `STATE_SAFE` (**Busog Mode** — Daily spend is within safe limit):
     - Expression: Happy grin, ears perked, floating gold coin animation.
     - Default Quote: *"Ayos! Pasok na pasok sa budget. May pang-ipon pa tayo!"*
  2. `STATE_WARNING` (**Alanganin Mode** — 75% to 99% of daily limit spent):
     - Expression: Squinting through glasses, sweat drop, holding a receipt.
     - Default Quote: *"Hinay-hinay muna sa iced coffee, malayo pa ang susunod na baon!"*
  3. `STATE_PELIGRO` (**Petsa de Peligro Mode** — Overspent daily limit or projected to run out early):
     - Expression: Dramatic anime tears, empty coin slot, holding cup noodles.
     - Default Quote: *"Warning: Petsa de Peligro alert! Protect your reserved pamasahe!"*
  4. `STATE_THINKING` (**Bantay-Baon AI Mode** — Processing chat/simulation):
     - Expression: Glowing indigo glasses with pulsing animation.

## 2. Design System — Modern Premium Fintech

### Typography
- **Primary Font**: `Inter` (loaded from Google Fonts) — clean, geometric, excellent tabular numerals.
- **Mono/Numeric Values**: `Inter` with `font-variant-numeric: tabular-nums; font-weight: 800;` (`.mono` class).
- **Body**: 400/500 weight, `line-height: 1.55`, antialiased.

### Color Palette & CSS Custom Properties (inline `<style>` in `index.php`)
- **Surfaces**:
  - `--bg-shell`: `#F3F4F0` (Warm grey app background)
  - `--bg-card`: `#FFFFFF` (Card surfaces)
  - `--bg-card-alt`: `#F7FAF5` (Subtle green-tinted card alt)
  - `--bg-accent-gradient`: `linear-gradient(135deg, #C8F7C5 0%, #81E47E 50%, #4CAF50 100%)` (Accent card gradient)
  - `--bg-vault`: `#EEF2FF` (AI/vault card tint)
- **Text**:
  - `--text-primary`: `#1A1D1F`
  - `--text-secondary`: `#6F767E`
  - `--text-tertiary`: `#9A9FA5`
- **Accent Colors**:
  - `--accent-green`: `#4CAF50` (Primary accent — buttons, highlights)
  - `--accent-green-light`: `#81E47E`
  - `--accent-green-pale`: `#E8F5E9` (Hover/background tints)
  - `--accent-gold`: `#F59E0B` (Piso Coin Gold)
- **Status Colors**:
  - `--status-safe`: `#4CAF50`
  - `--status-warn`: `#FF9800`
  - `--status-danger`: `#F44336`
  - `--ai-indigo`: `#6366F1`
- **Category Colors** (Donut chart segments):
  - Food: `#4ade80`
  - Transportation: `#60a5fa`
  - School Expenses: `#a78bfa`
  - Personal Needs: `#fb923c`

### Card Styling
- **Border Radius**: `--radius-lg: 24px` (cards), `--radius-md: 18px`, `--radius-sm: 12px`, `--radius-full: 999px` (pills/badges)
- **Shadows**: Soft multi-layer (`0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)`)
- **No hard borders** — replaced neo-brutalist `2px solid + offset shadow` with modern soft shadow approach.
- **Hover**: Cards lift slightly via `box-shadow` escalation on `:hover`.

### Buttons
- **Shape**: `border-radius: 999px` (pill-shaped)
- **Variants**: `.btn-primary` (green), `.btn-ai` (indigo), `.btn-outline` (bordered), `.btn-gold` (gold)
- **Micro-animations**: `translateY(-1px)` on hover, `translateY(0)` on active, button text swaps to ⏳ then ✓ on submit.

### Progress Bars
- **Track**: 8px height, `#F3F4F6` background, fully rounded.
- **Fill**: Color-coded by context (green/indigo/danger).

## 3. Bento Grid Dashboard Layout (`index.php`)

### Desktop Layout (≥1024px)
Uses a 12-column CSS Grid with `gap: 16px`, `max-width: 1320px`.

### Navigation
- **Desktop**: Sticky top navbar with frosted-glass `backdrop-filter: blur(20px)`, brand icon + name, pill-shaped tab switcher (`Overview | Reserves | Expenses | Analytics`), and day-counter badge.
- **Mobile (≤768px)**: Top nav hidden → replaced by compact mobile brand header + **fixed bottom navigation bar** with 4 icon tabs (Home, Reserves, Expenses, Analytics). Uses frosted-glass background.

### Card Inventory
- **Hero Balance Card** (`col-8`, always visible):
  - Left: Piso SVG mascot in a circular ring with gradient border + state badge + quote bubble.
  - Right: Large balance readout (₱XX.XX), recommended daily limit, today's spent.
  - Bottom: 3-column KPI grid (Total Cash Left, Locked Reserves + Goal, Free Spendable Pool).
- **Savings Goal Accent Card** (`col-4`, green gradient):
  - Savings goal amount, percentage of remaining cash protected, sub-cards for Reserved Funds and Avg Daily Burn.
  - Decorative circle overlay for depth.
- **AI Command Center** (`col-12`, indigo tint):
  - Text input with pill buttons (Auto-Log & Kaya Ba?), response box with left border accent.
- **Allowance Setup** (`col-4`, Step 1):
  - Form with labeled inputs, pill-shaped submit button.
- **Spending Donut Chart** (`col-4`, Step 5):
  - SVG donut chart with center amount overlay, 4-item category legend grid.
- **Allowance Overview** (`col-4`):
  - Total allowance amount, progress bars for spent/reserved/savings.
- **Locked Essential Vaults** (`col-6`, Step 2):
  - Scrollable vault item list with category icons, progress bars, amounts. Inline add-reserve form.
- **Transactions** (`col-6`, Step 4):
  - Expense form + scrollable transaction list with category icons, day/via metadata, vault badges, amounts.

### Responsive Behavior
| Breakpoint | Behavior |
|---|---|
| ≥1024px | Full 12-col grid, sticky top nav, all sections visible |
| 768–1024px | Cards span full width, hero collapses to horizontal layout |
| ≤768px | Single column, top nav → bottom nav, section toggling via tabs, compact mascot layout |
| ≤480px | Tighter padding/gaps, smaller font sizes |

## 4. Section Navigation (Mobile Tabs)
- On mobile, tapping a bottom nav tab filters visible `section-panel` cards by `data-section` attribute.
- "Overview" tab shows everything. Other tabs show their section + overview cards.
- Desktop tabs are decorative (all sections always visible on desktop).
- Resize handler ensures all panels re-appear when switching back to desktop width.