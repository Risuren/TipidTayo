import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  LogOut,
  BookOpen,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import api from '../../api/axios';
import TiPig from '../../components/mascot/TiPig';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, requestLogout, updateUserState } = useAuth();
  const { confirmAffirmative } = useModal();

  const handleReplayTutorial = async () => {
    const confirmed = await confirmAffirmative({
      title: 'Replay App Walkthrough Tour?',
      message: 'Would you like to revisit the interactive step-by-step tour? TiPig will walk you through each tab and explain the 5-step allowance budgeting system.',
      confirmText: 'Yes, Start Tour',
      cancelText: 'Not Now',
      badge: 'Interactive Tour',
    });
    if (!confirmed) return;

    try {
      await api.post('/onboarding/tutorial/replay');
      if (updateUserState) updateUserState({ has_seen_tutorial: false });
      navigate('/daily-limit');
    } catch (err) {
      if (updateUserState) updateUserState({ has_seen_tutorial: false });
      navigate('/daily-limit');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.65rem)', fontWeight: 900, color: 'var(--green-900)' }}>
          Settings & Preferences
        </h2>
        <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Manage your account profile, TiPig AI companion preferences, and interactive walkthrough tour.
        </p>
      </div>

      {/* 1. Walkthrough Tutorial Card */}
      <div
        className="card settings-tour-card"
        style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
          border: '2px solid var(--gold-400)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <TiPig state="safe" size={72} interactive={false} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                • Walkthrough Tour
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#78350F', marginTop: '4px' }}>
              Want to revisit the Step-by-Step App Tour?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#92400E', maxWidth: '440px', marginTop: '2px' }}>
              Replay the interactive guided tour anytime to review the 5-step allowance budgeting system and reserve vaults.
            </p>
          </div>
        </div>

        <button
          onClick={handleReplayTutorial}
          className="btn-gold"
          style={{ padding: '12px 22px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
        >
          <BookOpen size={18} /> Replay Tutorial
        </button>
      </div>

      {/* 2. User Profile & Account Info */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-900)', marginBottom: '14px' }}>
          Account Information
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--green-900)',
              color: 'var(--gold-400)',
              fontWeight: 900,
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              {user?.name || 'Student User'}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              {user?.email || 'student@tipidtayo.ph'}
            </p>
            <span className="badge-pill badge-green" style={{ marginTop: '4px', fontSize: '0.7rem' }}>
              Active Student Account
            </span>
          </div>
        </div>

        <button onClick={requestLogout} className="btn-secondary" style={{ color: 'var(--status-danger)' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* 3. TiPig AI Intelligence Showcase */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="var(--green-700)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--green-900)' }}>
              TiPig AI Financial Companion
            </h3>
          </div>
          <span className="badge-pill badge-green" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
            Active & Guarding Your Budget
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
          TiPig AI is TipidTayo's proprietary student financial companion. It runs continuously to protect your daily baon, calculate live rollovers, simulate what-if purchases, and provide instant guidance tailored to Filipino student life—all built-in with zero setup or configuration required.
        </p>

        {/* 3 Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '18px' }}>
          {/* Card 1: Kaya Ba Verdicts */}
          <div
            style={{
              border: '1.5px solid var(--green-600)',
              backgroundColor: 'var(--green-50)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={18} color="var(--green-700)" />
                <strong style={{ fontSize: '0.95rem', color: 'var(--green-900)' }}>Instant "Kaya Ba?" Verdicts</strong>
              </div>
              <span className="badge-pill badge-green" style={{ fontSize: '0.65rem' }}>
                Real-Time
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Instantly checks whether campus meals, transit fares, or milk tea treats fit within your quota without risking petsa de peligro.
            </p>
          </div>

          {/* Card 2: Rollover Simulation */}
          <div
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={18} color="var(--gold-600)" />
                <strong style={{ fontSize: '0.95rem', color: 'var(--green-900)' }}>What-If Scenario Simulator</strong>
              </div>
              <span className="badge-pill badge-gold" style={{ fontSize: '0.65rem' }}>
                Forecasting
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Simulates future quotas and balances when you plan ahead (e.g., spending less tomorrow to afford samgyup on Day 3).
            </p>
          </div>

          {/* Card 3: Student Privacy */}
          <div
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={18} color="var(--green-800)" />
                <strong style={{ fontSize: '0.95rem', color: 'var(--green-900)' }}>Bank-Grade Privacy</strong>
              </div>
              <span className="badge-pill badge-default" style={{ fontSize: '0.65rem' }}>
                Encrypted
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Your allowance numbers, reserve vaults, and questions are confidential and processed securely for your session only.
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div
          style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={15} color="var(--green-600)" />
            <span>TiPig AI Financial Intelligence Engine • Operational</span>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--green-800)' }}>
            Zero Configuration Required
          </span>
        </div>
      </div>

      {/* 4. Subtle SDG Contribution Info */}
      <div className="card" style={{ backgroundColor: 'var(--bg-card-alt)' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
          About Sustainable Development Goals (SDG) in TipidTayo
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div>
            <strong style={{ color: 'var(--green-900)' }}>SDG 1: No Poverty</strong>
            <p>Empowers students to avoid financial distress through proactive allowance budgeting.</p>
          </div>
          <div>
            <strong style={{ color: 'var(--green-900)' }}>SDG 4: Quality Education</strong>
            <p>Fosters lifelong personal financial literacy and responsible money habits.</p>
          </div>
          <div>
            <strong style={{ color: 'var(--green-900)' }}>SDG 12: Responsible Consumption</strong>
            <p>Prevents impulsive consumer debt by providing real-time purchasing guidance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
