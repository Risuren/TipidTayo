import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import Sidebar from '../components/navigation/Sidebar';
import RightPanel from '../components/navigation/RightPanel';
import BottomTabBar from '../components/navigation/BottomTabBar';
import AppTourModal from '../components/common/AppTourModal';
import { useAuth } from '../contexts/AuthContext';

export const AppLayout = () => {
  const location = useLocation();
  const { user, dashboardData, showLogoutConfirm, cancelLogout, confirmLogout } = useAuth();

  const showTour = Boolean(user?.onboarding_completed && !user?.has_seen_tutorial);
  const dailyGuide = dashboardData?.financials?.daily_guide || 0;

  return (
    <div className="app-container">
      {/* 1. Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content Area Column (Full width on Mobile & Tablet) */}
      <div className="app-content-wrapper">
        {/* Mobile Top Brand Header */}
        <header className="mobile-top-bar">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-tipig-advisor'))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Chat with TiPig AI Advisor"
          >
            <img src="/mascot/tipig-safe.svg" alt="TiPig" style={{ width: '28px', height: '28px' }} />
            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#FFFFFF' }}>
              Tipid<span style={{ color: 'var(--gold-400)' }}>Tayo</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-budget-glance'))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              padding: '4px 10px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            title="View Budget at a Glance"
          >
            <span style={{ fontSize: '0.72rem', color: '#C8E6C9', fontWeight: 600 }}>Daily:</span>
            <span style={{ fontWeight: 800, color: 'var(--gold-400)', fontSize: '0.88rem' }}>
              ₱{Number(dailyGuide).toFixed(0)}
            </span>
          </button>
        </header>

        {/* 2. Center Content Stage */}
        <main className="main-stage">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 3. Desktop Right Panel */}
      <RightPanel />

      {/* 4. Mobile Bottom Navigation */}
      <BottomTabBar />

      {/* 5. Global Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '16px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '420px',
                padding: '24px',
                boxShadow: '0 24px 50px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FECACA',
                    color: 'var(--status-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LogOut size={26} />
                </div>
                <span
                  className="badge-pill"
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                  }}
                >
                  Account Exit
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#991B1B', margin: 0, lineHeight: 1.3 }}>
                  Sign Out of TipidTayo?
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.45 }}>
                  Your budget calculations, logged expenses, and active cycle progress are safely stored. You will need to enter your password to sign in again.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={cancelLogout}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px', fontWeight: 700 }}
                >
                  Stay Signed In
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="btn-danger"
                  style={{
                    flex: 1.2,
                    padding: '12px',
                    fontWeight: 800,
                  }}
                >
                  Yes, Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Step-by-Step App Tour (Explaining all tabs & 5-step process) */}
      <AppTourModal isOpen={showTour} />
    </div>
  );
};

export default AppLayout;
