import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Wallet,
  ShieldCheck,
  CalendarDays,
  Receipt,
  PieChart,
  Settings,
  LogOut,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = () => {
  const { user, requestLogout } = useAuth();

  const navItems = [
    {
      to: '/daily-limit',
      label: 'Daily Budget',
      icon: CalendarDays,
      desc: 'Guide & tracker',
    },
    {
      to: '/allowance',
      label: 'Enter Allowance',
      icon: Wallet,
      desc: 'Set cycle funds',
    },
    {
      to: '/reserves',
      label: 'Reserve Essentials',
      icon: ShieldCheck,
      desc: 'Protect fixed costs',
    },
    {
      to: '/review',
      label: 'Weekly Review',
      icon: PieChart,
      desc: 'Pacing & trends',
    },
    {
      to: '/diskarte',
      label: 'Diskarte Hub',
      icon: Lightbulb,
      desc: 'Tips & cash growth',
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      desc: 'Account & Tour',
    },
  ];

  return (
    <aside className="sidebar-desktop">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', padding: '0 8px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#2E7D32',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          }}
        >
          <img
            src="/mascot/tipig-safe.svg"
            alt="TiPig"
            style={{ width: '30px', height: '30px' }}
          />
        </div>
        <div className="brand-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
              Tipid<span style={{ color: 'var(--gold-400)' }}>Tayo</span>
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#A5D6A7', fontWeight: 600 }}>
            Student Budget Companion
          </p>
        </div>
      </div>

      {/* Freely Navigable Sections (Duolingo Pattern) */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '14px',
                color: isActive ? '#FFFFFF' : '#C8E6C9',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '4px solid var(--gold-400)' : '4px solid transparent',
              })}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  flexShrink: 0,
                }}
              >
                <Icon size={17} />
              </div>
              <div className="nav-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '0.92rem' }}>{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info Section */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--gold-500)',
                  color: '#78350F',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="nav-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </p>
                <p style={{ fontSize: '0.68rem', color: '#A5D6A7' }}>
                  Active Student
                </p>
              </div>
            </div>
            <button
              onClick={requestLogout}
              title="Logout"
              style={{
                color: '#C8E6C9',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
