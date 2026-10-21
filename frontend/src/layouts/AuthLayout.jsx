import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export const AuthLayout = () => {
  const { user, loading } = useAuth();

  // If already authenticated, automatically redirect based on onboarding progress
  if (!loading && user) {
    if (!user.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/daily-limit" replace />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-page)',
        padding: '24px 16px',
      }}
    >
      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            backgroundColor: 'var(--green-900)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(27, 67, 50, 0.2)',
            marginBottom: '12px',
          }}
        >
          <img src="/mascot/tipig-safe.svg" alt="TiPig" style={{ width: '52px', height: '52px' }} />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--green-900)', letterSpacing: '-0.5px' }}>
          Tipid<span style={{ color: 'var(--gold-500)' }}>Tayo</span>
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Smart Student Budget & AI Companion
        </p>
      </motion.div>

      {/* Main Form Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          padding: '32px 28px',
        }}
      >
        <Outlet />
      </motion.div>

      {/* Student tagline at bottom of auth screen */}
      <div style={{ marginTop: '24px', textAlign: 'center', maxWidth: '380px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Empowering Filipino students towards stress-free financial discipline.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
