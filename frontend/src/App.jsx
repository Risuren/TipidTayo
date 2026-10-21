import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';

// Onboarding Page
import OnboardingPage from './pages/onboarding/OnboardingPage';

// Dashboard Step Pages
import EnterAllowancePage from './pages/dashboard/EnterAllowancePage';
import ReserveEssentialsPage from './pages/dashboard/ReserveEssentialsPage';
import DailyBudgetPage from './pages/dashboard/DailyBudgetPage';
import RecordPurchasesPage from './pages/dashboard/RecordPurchasesPage';
import WeeklyReviewPage from './pages/dashboard/WeeklyReviewPage';
import DiskarteHubPage from './pages/dashboard/DiskarteHubPage';
import SettingsPage from './pages/dashboard/SettingsPage';

// Mascot Spinner
import TiPig from './components/mascot/TiPig';

const LoadingScreen = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-page)',
      gap: '16px',
    }}
  >
    <TiPig state="thinking" size={120} />
    <p style={{ fontWeight: 700, color: 'var(--green-900)', fontSize: '1rem' }}>
      Inihahanda ang TipidTayo...
    </p>
  </div>
);

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// Onboarding Guard (Redirects to main app if already onboarded)
const OnboardingRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.onboarding_completed) {
    return <Navigate to="/daily-limit" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <ModalProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/callback" element={<GoogleCallbackPage />} />
            </Route>

            {/* Interactive Onboarding Wizard */}
            <Route
              path="/onboarding"
              element={
                <OnboardingRoute>
                  <OnboardingPage />
                </OnboardingRoute>
              }
            />

            {/* Protected Application Layout (Duolingo 3-Column Shell) */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/daily-limit" replace />} />
              <Route path="/allowance" element={<EnterAllowancePage />} />
              <Route path="/reserves" element={<ReserveEssentialsPage />} />
              <Route path="/daily-limit" element={<DailyBudgetPage />} />
              <Route path="/purchases" element={<Navigate to="/daily-limit" replace />} />
              <Route path="/review" element={<WeeklyReviewPage />} />
              <Route path="/diskarte" element={<DiskarteHubPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/daily-limit" replace />} />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  );
};

export default App;
