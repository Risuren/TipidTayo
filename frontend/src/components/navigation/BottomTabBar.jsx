import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Wallet,
  ShieldCheck,
  CalendarDays,
  Receipt,
  PieChart,
  Settings,
  Lightbulb,
} from 'lucide-react';

export const BottomTabBar = () => {
  const tabs = [
    { to: '/daily-limit', icon: CalendarDays, label: 'Daily' },
    { to: '/allowance', icon: Wallet, label: 'Allowance' },
    { to: '/reserves', icon: ShieldCheck, label: 'Reserves' },
    { to: '/review', icon: PieChart, label: 'Review' },
    { to: '/diskarte', icon: Lightbulb, label: 'Diskarte' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              flex: '1 1 0',
              minWidth: 0,
              minHeight: '48px',
              color: isActive ? 'var(--gold-400)' : '#A5D6A7',
              fontSize: '0.67rem',
              fontWeight: isActive ? 800 : 500,
              padding: '4px 2px',
              borderRadius: '10px',
              backgroundColor: isActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
              transition: 'all 0.15s ease',
              touchAction: 'manipulation',
            })}
          >
            <Icon size={19} strokeWidth={2.2} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
