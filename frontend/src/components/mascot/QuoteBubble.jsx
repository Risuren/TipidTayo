import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';
import { SolarChatRoundDots } from '../common/SolarIcons';

export const QuoteBubble = ({ text, mood = 'safe', className = '' }) => {
  const moodStyles = {
    safe: {
      bg: '#FFFFFF',
      border: 'var(--green-500)',
      color: 'var(--text-primary)',
      badge: 'Safe & On Track',
      icon: ShieldCheck,
      badgeBg: 'var(--green-100)',
      badgeColor: 'var(--green-800)',
    },
    warning: {
      bg: '#FFFBEB',
      border: 'var(--gold-500)',
      color: '#78350F',
      badge: 'Caution Advised',
      icon: AlertTriangle,
      badgeBg: 'var(--gold-100)',
      badgeColor: 'var(--gold-700)',
    },
    peligro: {
      bg: '#FEF2F2',
      border: 'var(--status-danger)',
      color: '#991B1B',
      badge: 'Critical Limit',
      icon: AlertCircle,
      badgeBg: '#FEE2E2',
      badgeColor: '#B91C1C',
    },
    thinking: {
      bg: '#EEF2FF',
      border: 'var(--ai-indigo)',
      color: '#3730A3',
      badge: 'Analyzing Budget',
      icon: SolarChatRoundDots,
      badgeBg: '#E0E7FF',
      badgeColor: '#4338CA',
    },
  };

  const current = moodStyles[mood] || moodStyles.safe;
  const BadgeIcon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`quote-bubble ${className}`}
      style={{
        position: 'relative',
        backgroundColor: current.bg,
        border: `2px solid ${current.border}`,
        borderRadius: '18px',
        padding: '16px 20px',
        boxShadow: '0 8px 24px rgba(27, 67, 50, 0.08)',
        maxWidth: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            padding: '3px 9px',
            borderRadius: '9999px',
            backgroundColor: current.badgeBg,
            color: current.badgeColor,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {BadgeIcon && <BadgeIcon size={12} />}
          {current.badge}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green-700)' }}>
          TiPig Advisor
        </span>
      </div>

      <p
        style={{
          fontSize: '0.92rem',
          lineHeight: '1.5',
          color: current.color,
          fontWeight: 600,
          whiteSpace: 'pre-line',
        }}
      >
        {text}
      </p>

      {/* Bubble Triangle Pointer */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10px',
          left: '32px',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: `10px solid ${current.border}`,
        }}
      />
    </motion.div>
  );
};

export default QuoteBubble;
