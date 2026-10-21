<?php
/**
 * TipidTayo Full-Stack Gateway
 * Automatically redirects Apache localhost/TipidTayo visitors to the modern React App (port 5173).
 */

// Check if Vite frontend is online (check 127.0.0.1 and localhost)
$viteOnline = false;
$viteSocket = @fsockopen('127.0.0.1', 5173, $errno, $errstr, 0.5) ?: @fsockopen('localhost', 5173, $errno, $errstr, 0.5);
if ($viteSocket) {
    fclose($viteSocket);
    $viteOnline = true;
    header('Location: http://localhost:5173/');
    exit;
}

// Check backend status
$backendOnline = false;
$backendSocket = @fsockopen('127.0.0.1', 8000, $errno, $errstr, 0.5) ?: @fsockopen('localhost', 8000, $errno, $errstr, 0.5);
if ($backendSocket) {
    fclose($backendSocket);
    $backendOnline = true;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TipidTayo — Server Launcher Hub</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --green-900: #1B4332;
            --green-800: #2D6A4F;
            --green-600: #388E3C;
            --gold-500: #F59E0B;
            --gold-600: #D97706;
            --bg-page: #F4F6F0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background-color: var(--bg-page);
            color: #1A1D1F;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
        }
        .hub-card {
            background: #FFFFFF;
            width: 100%;
            maxWidth: 540px;
            border-radius: 28px;
            border: 1px solid #E2E8DF;
            box-shadow: 0 16px 40px -10px rgba(27, 67, 50, 0.15);
            padding: 36px 32px;
            text-align: center;
        }
        .mascot-badge {
            width: 72px;
            height: 72px;
            border-radius: 22px;
            background: var(--green-900);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px rgba(27, 67, 50, 0.2);
            margin-bottom: 16px;
        }
        .btn-open {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            background-color: var(--green-600);
            color: #FFFFFF;
            font-weight: 800;
            font-size: 1rem;
            padding: 16px 24px;
            border-radius: 16px;
            text-decoration: none;
            box-shadow: 0 4px 0 #1E5C26;
            transition: all 0.15s ease;
            margin: 20px 0 12px;
        }
        .btn-open:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 0 #1E5C26;
        }
        .btn-open:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0 #1E5C26;
        }
        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.8rem;
            font-weight: 700;
            padding: 5px 12px;
            border-radius: 9999px;
        }
        .status-online {
            background: #DCFCE7;
            color: #166534;
        }
        .status-offline {
            background: #FEE2E2;
            color: #991B1B;
        }
    </style>
</head>
<body>
    <div class="hub-card">
        <div class="mascot-badge">
            <img src="frontend/public/mascot/tipig-safe.svg" alt="TiPig" style="width: 52px; height: 52px;">
        </div>

        <h1 style="font-size: 1.8rem; font-weight: 900; color: var(--green-900); letter-spacing: -0.5px;">
            Tipid<span style="color: var(--gold-500);">Tayo</span> Full-Stack
        </h1>
        <p style="font-size: 0.9rem; color: #5F6E65; margin-top: 6px; line-height: 1.4;">
            TipidTayo has been upgraded to a modern <strong>React + Laravel 11</strong> application.
        </p>

        <!-- Status Checks -->
        <div style="display: flex; justify-content: center; gap: 10px; margin: 20px 0;">
            <div class="status-pill <?php echo $viteOnline ? 'status-online' : 'status-offline'; ?>">
                ● React Frontend (:5173): <?php echo $viteOnline ? 'Online' : 'Starting...'; ?>
            </div>
            <div class="status-pill <?php echo $backendOnline ? 'status-online' : 'status-offline'; ?>">
                ● Laravel API (:8000): <?php echo $backendOnline ? 'Online' : 'Offline'; ?>
            </div>
        </div>

        <a href="http://localhost:5173/" class="btn-open">
            Open TipidTayo Web App →
        </a>

        <div style="background-color: #F8FAF6; border: 1.5px dashed #C8D5C4; border-radius: 16px; padding: 16px; margin-top: 16px; text-align: left; font-size: 0.82rem; color: #4B5563;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; color: var(--green-900); font-weight: 800;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>How to Launch:</span>
            </div>
            <p>1. Double-click <strong>start_tipidtayo.bat</strong> in your <code>TipidTayo</code> folder.</p>
            <p style="margin-top: 4px;">2. The web application will automatically open at <strong>http://localhost:5173/</strong>.</p>
        </div>

        <div style="margin-top: 20px; font-size: 0.8rem; color: #9CA3AF;">
            Looking for the original single-file version?<br>
            <a href="_legacy/index.php" style="color: #2D6A4F; font-weight: 700; text-decoration: underline;">
                View Legacy Prototype (_legacy/index.php)
            </a>
        </div>
    </div>

    <script>
        // Check every 2.5 seconds if the app comes online, then automatically redirect
        setTimeout(function() {
            fetch('http://localhost:5173/', { mode: 'no-cors' })
                .then(function() {
                    window.location.href = 'http://localhost:5173/';
                })
                .catch(function() {
                    // Try refreshing the gateway check
                    window.location.reload();
                });
        }, 3000);
    </script>
</body>
</html>