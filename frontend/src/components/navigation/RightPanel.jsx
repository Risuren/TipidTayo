import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Minus,
  X,
  Send,
  PieChart,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TiPig from '../mascot/TiPig';
import QuoteBubble from '../mascot/QuoteBubble';
import SegmentedCycleBar from '../common/SegmentedCycleBar';
import {
  SolarChatRoundDots,
  SolarShieldCheck,
  SolarSend,
} from '../common/SolarIcons';
import FormattedMarkdownText from '../common/FormattedMarkdownText';
import api from '../../api/axios';

export const RightPanel = () => {
  const { dashboardData, refreshDashboard } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [popupTab, setPopupTab] = useState('advisor'); // 'advisor' | 'glance'
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'tipig',
      text: "Hello! I am TiPig, your student budget advisor. Ask me anything: test purchases with 'Kaya ba?', plan today's quota based on yesterday, or check what you can buy tomorrow!",
      mood: 'safe',
    },
  ]);

  const chatInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Listen to global open requests from mobile top bar or other triggers
  useEffect(() => {
    const handleOpenAdvisor = () => {
      setPopupTab('advisor');
      setIsChatOpen(true);
    };
    const handleOpenGlance = () => {
      setPopupTab('glance');
      setIsChatOpen(true);
    };

    window.addEventListener('open-tipig-advisor', handleOpenAdvisor);
    window.addEventListener('open-budget-glance', handleOpenGlance);

    return () => {
      window.removeEventListener('open-tipig-advisor', handleOpenAdvisor);
      window.removeEventListener('open-budget-glance', handleOpenGlance);
    };
  }, []);

  // Mobile FAB: Contracted into a circle most of the time, elongates periodically into pill
  const [isFabElongated, setIsFabElongated] = useState(true);
  useEffect(() => {
    // Contract after 3.8s on initial load
    const initialContractTimer = setTimeout(() => {
      setIsFabElongated(false);
    }, 3800);

    // Periodically pulse-elongate for 3.5s every 25s
    const pulseInterval = setInterval(() => {
      setIsFabElongated(true);
      setTimeout(() => {
        setIsFabElongated(false);
      }, 3500);
    }, 25000);

    return () => {
      clearTimeout(initialContractTimer);
      clearInterval(pulseInterval);
    };
  }, []);

  const mascot = dashboardData?.mascot || {
    name: 'TiPig',
    state: 'safe',
    quote: 'Kumusta! Ako si TiPig. Nandito ako para gabayan ka sa allowance mo!',
  };

  const financials = dashboardData?.financials || {
    total_allowance: 0,
    daily_guide: 0,
    today_spent: 0,
    today_remaining: 0,
    remaining_unreserved: 0,
    total_reserved: 0,
    spending_pace_pct: 0,
    savings_goal: 0,
    savings_status: 'intact',
  };

  const time = dashboardData?.time || {
    current_day: 1,
    total_days: 7,
    remaining_days: 7,
    progress_pct: 14,
  };

  // Scroll chat to bottom on new message or when opened
  useEffect(() => {
    if (isChatOpen) {
      if (chatInputRef.current) {
        setTimeout(() => chatInputRef.current?.focus(), 150);
      }
      if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [isChatOpen, chatMessages, chatLoading]);

  // Send message or quick prompt
  const handleSendMessage = async (e, quickText = null) => {
    if (e) e.preventDefault();
    const textToSend = quickText || chatInput.trim();
    if (!textToSend || chatLoading) return;

    // Add user message
    setChatMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    if (!quickText) setChatInput('');
    setChatLoading(true);

    try {
      const historyPayload = chatMessages.slice(-10).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text || '',
      }));

      const res = await api.post('/ai/interact', {
        prompt: textToSend,
        mode: 'chat',
        history: historyPayload,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'tipig',
          text: res.data.reply,
          mood: res.data.mood || res.data.status || 'safe',
          details: res.data.details || null,
        },
      ]);

      if (res.data.refresh) {
        await refreshDashboard();
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'tipig',
          text: "I couldn't reach the advisor server right now. Try testing a purchase like 'Kaya ba Milktea 120?' or check your connection.",
          mood: 'warning',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      {/* 
        RIGHT PANEL CONTAINER (Desktop)
        Fits directly inside the viewport with ZERO scrolling.
      */}
      <aside className="right-panel-desktop">
        {/* 1. Interactive TiPig Mascot & Quote Bubble */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsChatOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
          title="Click TiPig to open AI chat!"
        >
          <div style={{ position: 'relative' }}>
            <TiPig state={mascot.state} size={115} />
            <span
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '4px',
                backgroundColor: isChatOpen ? 'var(--gold-500)' : 'var(--green-800)',
                color: isChatOpen ? '#78350F' : '#FFFFFF',
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: '9999px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isChatOpen ? '#B45309' : '#4ADE80',
                  display: 'inline-block',
                }}
              />
              {isChatOpen ? 'Chat Active' : 'Click to Chat'}
            </span>
          </div>
          <QuoteBubble text={mascot.quote} mood={mascot.state} />
        </motion.div>

        {/* 2. Budget at a Glance Card */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--green-900)', margin: 0 }}>
              Budget at a Glance
            </h3>
            <span className="badge-pill badge-green" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
              Day {time.current_day} of {time.total_days}
            </span>
          </div>

          {/* Daily Spending Limit (Highlighted in Gold) */}
          <div
            style={{
              backgroundColor: 'var(--gold-50)',
              border: '1.5px solid var(--gold-400)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Recommended Daily Limit
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--gold-600)', marginTop: '2px' }}>
              ₱{Number(financials.daily_guide).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p style={{ fontSize: '0.72rem', color: '#B45309', margin: '2px 0 0 0' }}>
              {financials.today_remaining > 0 ? (
                <>₱{Number(financials.today_remaining).toFixed(2)} remaining today</>
              ) : (
                <span style={{ color: 'var(--status-danger)', fontWeight: 700 }}>Over budget today!</span>
              )}
            </p>
          </div>

          {/* Mini Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
            {/* Segmented Countable Cycle Timeline Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                <span>Cycle Timeline</span>
                <span style={{ color: 'var(--green-900)' }}>
                  {time.days_left !== undefined ? `${time.days_left} ${time.days_left === 1 ? 'day' : 'days'} left` : `${Math.max(0, time.total_days - time.current_day)} days left`}
                </span>
              </div>
              <SegmentedCycleBar
                totalDays={time.total_days}
                currentDay={time.current_day}
                daysLeft={time.days_left !== undefined ? time.days_left : Math.max(0, time.total_days - time.current_day)}
                height={8}
                compact
                showSubtext={false}
              />
            </div>

            {/* Today's Spending Pace */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 600, fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Today's Spending Pace</span>
                <span style={{ color: financials.spending_pace_pct > 100 ? 'var(--status-danger)' : 'var(--text-primary)', fontWeight: 700 }}>
                  {financials.spending_pace_pct}%
                </span>
              </div>
              <div style={{ height: '7px', backgroundColor: '#E2E8DF', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, financials.spending_pace_pct)}%`,
                    backgroundColor: financials.spending_pace_pct > 100 ? 'var(--status-danger)' : 'var(--green-500)',
                    borderRadius: '9999px',
                  }}
                />
              </div>
            </div>

            {/* Reserves Vault Mini Row */}
            <div
              style={{
                paddingTop: '8px',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SolarShieldCheck size={15} color="var(--green-600)" />
                <span style={{ color: 'var(--text-secondary)' }}>Reserves Vault</span>
              </div>
              <strong style={{ color: 'var(--green-800)' }}>
                ₱{Number(financials.total_reserved).toFixed(2)}
              </strong>
            </div>

            {/* Target Savings Reminder Mini Row */}
            <div
              style={{
                paddingTop: '8px',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SolarShieldCheck size={15} color="var(--gold-600)" />
                <span style={{ color: 'var(--text-secondary)' }}>Target Savings</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ color: 'var(--gold-700)' }}>
                  ₱{Number(financials.savings_goal || 0).toFixed(2)}
                </strong>
                <span
                  style={{
                    fontSize: '0.64rem',
                    display: 'block',
                    fontWeight: 700,
                    color:
                      financials.savings_status === 'partially_used' || financials.savings_status === 'exhausted'
                        ? 'var(--status-danger)'
                        : 'var(--green-700)',
                  }}
                >
                  {financials.savings_status === 'partially_used'
                    ? 'Partially Used'
                    : financials.savings_status === 'exhausted'
                    ? 'Depleted'
                    : '100% Intact'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile & Tablet Floating TiPig Chat Launcher FAB (Contracts to circle, elongates to capsule) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsChatOpen(true)}
        onMouseEnter={() => setIsFabElongated(true)}
        onMouseLeave={() => setIsFabElongated(false)}
        className={`mobile-chat-fab ${isFabElongated ? 'elongated' : ''}`}
        title="Chat with TiPig AI Advisor"
      >
        <div className="mobile-chat-fab-avatar">
          <img
            src={`/mascot/tipig-${mascot.state || 'safe'}.svg`}
            alt="TiPig"
            style={{ width: '24px', height: '24px' }}
            onError={(e) => {
              e.target.src = '/mascot/tipig-safe.svg';
            }}
          />
        </div>
        <span
          className="fab-text"
          style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.3px', flexShrink: 0 }}
        >
          Ask TiPig
        </span>
        {/* Social Media-Style Online Presence Badge (Anchored outside on perimeter with white border) */}
        <span className="mobile-chat-fab-status" aria-label="Online" />
      </motion.button>

      {/* 
        3. FACEBOOK MESSENGER-STYLE FLOATING POPUP CHAT BOX
        Pops up cleanly when clicking the TiPig Mascot, and can be minimized back.
      */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="tipig-chat-popup"
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '380px',
              maxWidth: 'calc(100vw - 32px)',
              height: '520px',
              maxHeight: 'calc(100vh - 48px)',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22), 0 0 0 1.5px var(--green-300)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 10500,
            }}
          >
            {/* Header: Facebook Messenger Style */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--green-900)',
                color: '#FFFFFF',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#1E5C26',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--gold-400)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={`/mascot/tipig-${mascot.state || 'safe'}.svg`}
                    alt="TiPig"
                    style={{ width: '26px', height: '26px' }}
                    onError={(e) => {
                      e.target.src = '/mascot/tipig-safe.svg';
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    TiPig AI Advisor
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#4ADE80',
                        display: 'inline-block',
                      }}
                      title="Online & Ready"
                    />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#A7F3D0', fontWeight: 600 }}>
                    Student Budget Companion
                  </div>
                </div>
              </div>

              {/* Window Controls: Minimize & Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D1FAE5',
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease',
                  }}
                  title="Minimize chat to mascot"
                >
                  <Minus size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D1FAE5',
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease',
                  }}
                  title="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Dual Mode Switcher: TiPig Advisor vs Budget at a Glance */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--green-900)',
                padding: '0 14px 10px 14px',
                gap: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <button
                type="button"
                onClick={() => setPopupTab('advisor')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: popupTab === 'advisor' ? 'var(--green-600)' : 'rgba(255, 255, 255, 0.08)',
                  color: popupTab === 'advisor' ? '#FFFFFF' : '#A7F3D0',
                  border: popupTab === 'advisor' ? '1px solid rgba(255, 255, 255, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <SolarChatRoundDots size={16} />
                TiPig Advisor
              </button>

              <button
                type="button"
                onClick={() => setPopupTab('glance')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: popupTab === 'glance' ? 'var(--gold-500)' : 'rgba(255, 255, 255, 0.08)',
                  color: popupTab === 'glance' ? '#78350F' : '#A7F3D0',
                  border: popupTab === 'glance' ? '1px solid #F59E0B' : 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <PieChart size={15} />
                Budget at a Glance
              </button>
            </div>

            {/* TAB 1: TiPig AI Advisor */}
            {popupTab === 'advisor' && (
              <>
                {/* Clean 2x2 Quick Suggestion Prompts Grid (Fixed Cluttered Wrap) */}
                <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: '#F8FAF8',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              {[
                {
                  icon: '🥤',
                  label: 'Kaya ba Milktea ₱120?',
                  text: 'Kaya ba Milktea 120?',
                  sub: 'Test purchase impact',
                },
                {
                  icon: '📊',
                  label: "Today's Quota Advice",
                  text: 'How should I budget todays quota based on previous purchases?',
                  sub: 'Pacing & rollover tip',
                },
                {
                  icon: '🔮',
                  label: 'Can I buy tomorrow?',
                  text: 'What is my projected budget tomorrow if I save today?',
                  sub: 'Next-day forecast',
                },
                {
                  icon: '🛡️',
                  label: 'Financial Status',
                  text: 'What is my overall financial status right now?',
                  sub: 'Cycle health check',
                },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={chatLoading}
                  onClick={(e) => handleSendMessage(e, chip.text)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--green-200)',
                    color: 'var(--green-950)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E8F5E9';
                    e.currentTarget.style.borderColor = 'var(--green-400)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--green-200)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%' }}>
                    <span style={{ fontSize: '0.85rem' }}>{chip.icon}</span>
                    <span style={{ fontSize: '0.73rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {chip.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chip.sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Scrollable Chat Feed */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundColor: '#FFFFFF',
              }}
            >
              {chatMessages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={index}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      padding: '9px 13px',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      backgroundColor: isUser
                        ? 'var(--green-800)'
                        : msg.mood === 'peligro'
                        ? '#FEF2F2'
                        : msg.mood === 'warning'
                        ? '#FFFBEB'
                        : '#F0FDF4',
                      color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                      fontSize: '0.82rem',
                      lineHeight: '1.45',
                      border: isUser
                        ? 'none'
                        : `1px solid ${
                            msg.mood === 'peligro'
                              ? '#FCA5A5'
                              : msg.mood === 'warning'
                              ? 'var(--gold-400)'
                              : 'var(--green-300)'
                          }`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    {!isUser && (
                      <div
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color:
                            msg.mood === 'peligro'
                              ? 'var(--status-danger)'
                              : msg.mood === 'warning'
                              ? '#92400E'
                              : 'var(--green-800)',
                          marginBottom: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        TiPig AI
                      </div>
                    )}
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                    ) : (
                      <FormattedMarkdownText content={msg.text} />
                    )}
                  </div>
                );
              })}

              {chatLoading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 12px',
                    backgroundColor: '#F1F5F9',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span className="dot-pulse" /> TiPig is analyzing your budget...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Bottom Input Form */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '10px 14px',
                backgroundColor: '#FAFDF9',
                borderTop: '1px solid var(--border-light)',
              }}
            >
              <div style={{ position: 'relative' }}>
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Ask TiPig or test: Milktea 120..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="form-input"
                  style={{
                    paddingRight: '42px',
                    fontSize: '0.84rem',
                    paddingLeft: '14px',
                    borderRadius: '9999px',
                    border: '1.5px solid var(--green-300)',
                  }}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  title="Send to TiPig"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: chatInput.trim() ? '#FFFFFF' : 'var(--text-muted)',
                    backgroundColor: chatInput.trim() ? 'var(--green-700)' : 'transparent',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    cursor: chatInput.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          </>
        )}

        {/* TAB 2: Budget at a Glance View */}
        {popupTab === 'glance' && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PieChart size={18} color="var(--green-700)" />
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--green-950)' }}>
                  Active Cycle Snapshot
                </span>
              </div>
              <span className="badge-pill badge-green" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                Day {time.current_day} of {time.total_days}
              </span>
            </div>

            {/* Recommended Daily Limit Highlight Card */}
            <div
              style={{
                backgroundColor: 'var(--gold-50)',
                border: '1.5px solid var(--gold-400)',
                borderRadius: '14px',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Recommended Daily Limit
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gold-600)', marginTop: '2px' }}>
                ₱{Number(financials.daily_guide).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#B45309', margin: '4px 0 0 0', fontWeight: 600 }}>
                {financials.today_remaining > 0 ? (
                  <>₱{Number(financials.today_remaining).toFixed(2)} remaining to spend today</>
                ) : (
                  <span style={{ color: 'var(--status-danger)', fontWeight: 800 }}>Over daily budget!</span>
                )}
              </p>
            </div>

            {/* Segmented Timeline */}
            <div style={{ backgroundColor: 'var(--bg-card-alt)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                <span>Cycle Progress</span>
                <span style={{ color: 'var(--green-900)' }}>
                  {time.days_left !== undefined ? `${time.days_left} ${time.days_left === 1 ? 'day' : 'days'} left` : `${Math.max(0, time.total_days - time.current_day)} days left`}
                </span>
              </div>
              <SegmentedCycleBar
                totalDays={time.total_days}
                currentDay={time.current_day}
                daysLeft={time.days_left !== undefined ? time.days_left : Math.max(0, time.total_days - time.current_day)}
                height={8}
                compact
                showSubtext={false}
              />
            </div>

            {/* Spending Pace Progress */}
            <div style={{ backgroundColor: 'var(--bg-card-alt)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 600, fontSize: '0.76rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Today's Spending Pace</span>
                <span style={{ color: financials.spending_pace_pct > 100 ? 'var(--status-danger)' : 'var(--text-primary)', fontWeight: 800 }}>
                  {financials.spending_pace_pct}%
                </span>
              </div>
              <div style={{ height: '7px', backgroundColor: '#E2E8DF', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, financials.spending_pace_pct)}%`,
                    backgroundColor: financials.spending_pace_pct > 100 ? 'var(--status-danger)' : 'var(--green-500)',
                    borderRadius: '9999px',
                  }}
                />
              </div>
            </div>

            {/* Reserves Vault Mini Row */}
            <div
              style={{
                backgroundColor: 'var(--bg-card-alt)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SolarShieldCheck size={16} color="var(--green-600)" />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Protected Reserves</span>
              </div>
              <strong style={{ color: 'var(--green-900)', fontSize: '0.9rem' }}>
                ₱{Number(financials.total_reserved).toFixed(2)}
              </strong>
            </div>

            {/* Target Savings Row */}
            <div
              style={{
                backgroundColor: 'var(--bg-card-alt)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SolarShieldCheck size={16} color="var(--gold-600)" />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Target Savings Goal</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ color: 'var(--gold-700)', fontSize: '0.9rem' }}>
                  ₱{Number(financials.savings_goal || 0).toFixed(2)}
                </strong>
                <span
                  style={{
                    fontSize: '0.66rem',
                    display: 'block',
                    fontWeight: 700,
                    color:
                      financials.savings_status === 'partially_used' || financials.savings_status === 'exhausted'
                        ? 'var(--status-danger)'
                        : 'var(--green-700)',
                  }}
                >
                  {financials.savings_status === 'partially_used'
                    ? 'Partially Used'
                    : financials.savings_status === 'exhausted'
                    ? 'Depleted'
                    : '100% Intact'}
                </span>
              </div>
            </div>

            {/* Quick Switch to Chat */}
            <button
              type="button"
              onClick={() => setPopupTab('advisor')}
              className="btn-primary"
              style={{
                marginTop: 'auto',
                padding: '11px',
                fontSize: '0.86rem',
                borderRadius: '12px',
                width: '100%',
                gap: '6px',
              }}
            >
              <SolarChatRoundDots size={16} />
              Ask TiPig for advice on this budget
            </button>
          </div>
        )}
      </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RightPanel;
