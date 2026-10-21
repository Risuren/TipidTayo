# TipidTayo 🐾
> **Smart, Mascot-Driven Student Allowance & Daily Spending Companion**

TipidTayo is an AI-powered student budgeting web application designed to help Filipino students manage their allowances, safeguard essential reserve funds (commute, tuition, projects), and avoid going broke before their next allowance cycle.

Featuring **TiPig** (the expressive financial mascot) and the **Diskarte Hub** (intelligent Taglish spending simulator and natural language expense logger).

---

## 🌟 Key Features

1. **5-Step Student Budget Formula**:
   - **Step 1: Enter Allowance & Cycle**: Set allowance amount, cycle duration (e.g., 14 days), and emergency savings goal.
   - **Step 2: Reserve Essentials Vault**: Lock away non-negotiables (jeep/tricycle commute, thesis printing, school dues) so they aren't accidentally spent.
   - **Step 3: Daily Spending Guide**: Computes a realistic, safe daily spending limit based strictly on free-spendable cash.
   - **Step 4: Smart Expense Logging**: Log purchases manually or via conversational Taglish natural language.
   - **Step 5: Weekly Review & Savings Trends**: Track multi-cycle savings progress, category breakdowns, and financial health badges.

2. **TiPig Interactive Mascot**:
   - Expresses dynamic emotional states (`safe`, `warning`, `peligro`, `thinking`, `celebrating`) based on live budget math.
   - Proactively gives practical "diskarte" tips when approaching daily limits.

3. **Diskarte Hub (AI Financial Co-Pilot)**:
   - Natural language Taglish expense logging (*"Nag-jeep ako 25 tapos bumili ng siomai rice 45"*).
   - Instant purchase simulation (*"Piso, safe ba bumili ng iced coffee 120?"*).
   - Resilient multi-tier architecture: Google Gemini API / Groq LLaMA 3 / Local Ollama / Offline Smart Regex Math fallback.

4. **Multi-User & Authentication**:
   - Secure email/password login and Google OAuth with Laravel Sanctum.
   - First-time user interactive tour and onboarding setup.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Custom CSS Design System, Responsive Bento Grid, Mobile-First UI
- **Backend**: Laravel 11 (PHP 8.2+), Laravel Sanctum, MySQL / MariaDB (XAMPP compatible)
- **AI Integration**: Google Gemini API, Groq Cloud API, Offline Regex Engine
- **Database**: MySQL (`schema_v2.sql`)

---

## 🚀 Quick Setup & Installation

### Prerequisites
- [PHP](https://www.php.net/) >= 8.2
- [Composer](https://getcomposer.org/)
- [Node.js](https://nodejs.org/) (v18+) & `npm`
- [XAMPP](https://www.apachefriends.org/) or MySQL Server

---

### Step 1: Database Setup
1. Start **Apache** and **MySQL** in your XAMPP Control Panel.
2. Open **phpMyAdmin** (`http://localhost/phpmyadmin`) or MySQL CLI.
3. Import the clean database schema located at:
   ```bash
   database/schema_v2.sql
   ```
   *(This creates the `tipidtayo_v2` database and all required tables).*

---

### Step 2: Backend Setup (Laravel)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install PHP dependencies:
   ```bash
   composer install
   ```
3. Create your environment file from the template:
   ```bash
   cp .env.example .env
   ```
4. Generate the application encryption key:
   ```bash
   php artisan key:generate
   ```
5. *(Optional)* Configure your AI keys in `backend/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```
   *(TipidTayo includes an offline math engine, so the app still functions even without API keys!)*
6. Start the Laravel development server:
   ```bash
   php artisan serve --port=8000
   ```
   *Backend will run at: `http://localhost:8000`*

---

### Step 3: Frontend Setup (React + Vite)
1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend will run at: `http://localhost:5173`*

---

### ⚡ One-Click Startup (Windows)
For convenience, you can also launch both frontend and backend concurrently using the root batch script:
```bash
./start_tipidtayo.bat
```

---

## 🛡️ Security & Privacy Note
This repository contains zero hardcoded API keys, secrets, or user passwords. All sensitive credentials are kept strictly in `.env` files that are ignored by Git.

---

## 👥 Authors & Credits
- **TipidTayo Team**
