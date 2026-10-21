import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Send,
  Bot,
  PiggyBank,
  ShieldCheck,
  Wallet,
  Info,
  Receipt,
  Plus,
  Edit2,
  Trash2,
  HelpCircle,
  X,
  ChevronRight,
  Filter,
  Clock,
  Bell,
  CheckCircle,
} from 'lucide-react';
import {
  SolarCardSearch,
  SolarBagPlus,
  SolarChatRoundDots,
  SolarCalendarDate,
  SolarAddCircle,
  SolarMeal,
  SolarBus,
  SolarBookBookmark,
  SolarBagSmile,
  SolarAltArrowDown,
  SolarAltArrowUp,
  SolarAltArrowLeft,
  SolarAltArrowRight,
} from '../../components/common/SolarIcons';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import TiPig from '../../components/mascot/TiPig';
import SegmentedCycleBar from '../../components/common/SegmentedCycleBar';
import FormattedMarkdownText from '../../components/common/FormattedMarkdownText';
import { AnimatedCounter } from '../../components/common/AnimatedCounter';
import api from '../../api/axios';

export const DailyBudgetPage = () => {
  const { dashboardData, refreshDashboard } = useAuth();
  const { showConfirm, showAlert, confirmDelete } = useModal();

  // TiPig Companion Pop-up / Drawer State
  const [isTiPigModalOpen, setIsTiPigModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('kayaba'); // 'kayaba' | 'log' | 'chat'

  // "Kaya ba?" Affordability Predictor State
  const [kayaBaPrompt, setKayaBaPrompt] = useState('');
  const [kayaBaLoading, setKayaBaLoading] = useState(false);
  const [kayaBaResult, setKayaBaResult] = useState(null);

  // Expense Logger State (Inside TiPig Pop-up)
  const [loggerType, setLoggerType] = useState('smart'); // 'smart' | 'manual'
  const [smartText, setSmartText] = useState('');
  const [smartVaultId, setSmartVaultId] = useState('');
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartFeedback, setSmartFeedback] = useState(null);

  // Manual Logger Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState('Food');
  const [manualAmount, setManualAmount] = useState('');
  const [manualVaultId, setManualVaultId] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // AI Chat State (Inside TiPig Pop-up)
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'tipig',
      text: 'Hello! I am TiPig, your AI Companion. Test any purchase with "Kaya ba?", log your expenses, or ask me for financial guidance anytime!',
      mood: 'safe',
    },
  ]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Edit Expense Modal State
  const [editingExpense, setEditingExpense] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Food');
  const [editAmount, setEditAmount] = useState('');
  const [editVaultId, setEditVaultId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Filter & Activity Feed State
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [selectedTargetDayNum, setSelectedTargetDayNum] = useState(null);
  const [selectedTargetDate, setSelectedTargetDate] = useState(null);
  const [purchaseFilter, setPurchaseFilter] = useState('all'); // 'all' | 'today' | 'past'
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Cycle Calendar Expandable (1x5 Minimized vs Nx5 Expanded) & Row Pagination State
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [calendarRowIndex, setCalendarRowIndex] = useState(null);
  const [isMobileView, setIsMobileView] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Schedule Payment Modal State (For Future Days)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDayNum, setScheduleDayNum] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleCategory, setScheduleCategory] = useState('School Expenses');
  const [scheduleAmount, setScheduleAmount] = useState('');
  const [scheduleVaultId, setScheduleVaultId] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [schedulePayingId, setSchedulePayingId] = useState(null);

  const financials = dashboardData?.financials || {
    total_allowance: 0,
    daily_guide: 0,
    today_spent: 0,
    today_remaining: 0,
    remaining_unreserved: 0,
    spending_pace_pct: 0,
    savings_goal: 0,
    savings_intact: 0,
    savings_used: 0,
    savings_status: 'intact',
    total_reserved: 0,
    unreserved_spent: 0,
  };

  const time = dashboardData?.time || {
    current_day: 1,
    total_days: 7,
    days_left: 6,
    remaining_days: 7,
    progress_pct: 14,
  };

  const mascot = dashboardData?.mascot || {
    state: 'safe',
    quote: 'You are on track today! Your spending is well within your daily budget.',
  };

  const reserves = dashboardData?.reserves || [];

  // Open modal with specific tab and optional targetDayNum
  const openTiPigModal = (tab = 'kayaba', initialPrompt = '', targetDayNum = null) => {
    setActiveModalTab(tab);
    if (tab === 'kayaba' && initialPrompt) {
      setKayaBaPrompt(initialPrompt);
    } else if (tab === 'log' && initialPrompt) {
      setSmartText(initialPrompt);
    }

    const dayNumToUse = targetDayNum !== null ? targetDayNum : selectedCalendarDay;
    if (dayNumToUse !== null) {
      const dayObj = (dashboardData?.calendar?.days || []).find((d) => d.day_number === dayNumToUse);
      if (dayObj) {
        setSelectedTargetDayNum(dayObj.day_number);
        setSelectedTargetDate(dayObj.date);
        setManualDate(`${dayObj.date}T12:00`);
      }
    } else {
      setSelectedTargetDayNum(null);
      setSelectedTargetDate(null);
      setManualDate('');
    }
    setIsTiPigModalOpen(true);
  };

  // Open Schedule Payment Modal for future day
  const openScheduleModal = (dayNum, dateStr) => {
    setScheduleDayNum(dayNum);
    setScheduleDate(dateStr || '');
    setScheduleTitle('');
    setScheduleCategory('School Expenses');
    setScheduleAmount('');
    setScheduleVaultId('');
    setScheduleNotes('');
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleTitle.trim() || !scheduleAmount || scheduleSubmitting) return;

    setScheduleSubmitting(true);
    try {
      await api.post('/scheduled-payments', {
        title: scheduleTitle.trim(),
        category: scheduleCategory,
        amount: parseFloat(scheduleAmount),
        target_day: scheduleDayNum,
        due_date: scheduleDate,
        reserve_id: scheduleVaultId && scheduleVaultId !== 'none' ? parseInt(scheduleVaultId, 10) : null,
        notes: scheduleNotes.trim() || null,
      });

      setIsScheduleModalOpen(false);
      await refreshDashboard();
      await showAlert({
        title: 'Payment Scheduled!',
        message: `Payment allocation for "${scheduleTitle}" on Day ${scheduleDayNum} has been saved. TiPig will remind you when it's due!`,
        type: 'safe',
      });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to schedule payment. Please check inputs.';
      await showAlert({
        title: 'Unable to Schedule Payment',
        message: errMsg,
        type: 'gold',
      });
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleExecuteScheduledPay = async (payment) => {
    setSchedulePayingId(payment.id);
    try {
      await api.post(`/scheduled-payments/${payment.id}/pay`);
      await refreshDashboard();
      await showAlert({
        title: 'Payment Recorded!',
        message: `Successfully paid ₱${Number(payment.amount).toFixed(2)} for "${payment.title}". It has been recorded as an expense today!`,
        type: 'safe',
      });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Unable to record payment.';
      await showAlert({
        title: 'Payment Failed',
        message: errMsg,
        type: 'gold',
      });
    } finally {
      setSchedulePayingId(null);
    }
  };

  const handleCancelScheduled = async (id, title = 'this scheduled payment') => {
    const confirmed = await showConfirm({
      title: 'Cancel Scheduled Allocation?',
      message: `Are you sure you want to cancel the scheduled allocation for "${title}"?`,
      confirmText: 'Yes, Cancel Allocation',
      cancelText: 'Keep Scheduled',
      type: 'gold',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/scheduled-payments/${id}`);
      await refreshDashboard();
    } catch (err) {
      await showAlert({
        title: 'Error',
        message: 'Unable to cancel scheduled payment.',
        type: 'danger',
      });
    }
  };

  // Run "Kaya ba?" Affordability Predictor
  const handleCheckKayaBa = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    const promptToTest = customPrompt || kayaBaPrompt.trim();
    if (!promptToTest || kayaBaLoading) return;

    setKayaBaLoading(true);
    setKayaBaResult(null);

    try {
      const res = await api.post('/ai/interact', {
        prompt: promptToTest,
        mode: 'kayaba',
      });
      setKayaBaResult(res.data);
    } catch (err) {
      setKayaBaResult({
        status: 'warning',
        reply: '**TiPig:** I could not calculate this right now. Please verify your connection or try entering an amount like "Milktea 120".',
      });
    } finally {
      setKayaBaLoading(false);
    }
  };

  // Run Smart AI Natural Language Expense Logger
  const handleSmartLog = async (e) => {
    e.preventDefault();
    if (!smartText.trim() || smartLoading) return;

    setSmartLoading(true);
    setSmartFeedback(null);

    try {
      const payload = {
        prompt: smartText.trim(),
        mode: 'log',
      };
      if (smartVaultId) {
        payload.reserve_id = smartVaultId === 'none' ? 'none' : parseInt(smartVaultId, 10);
      }
      if (selectedTargetDate) {
        payload.target_date = selectedTargetDate;
      }

      const res = await api.post('/ai/interact', payload);
      setSmartFeedback(res.data);
      setSmartText('');
      await refreshDashboard();
    } catch (err) {
      const errMsg = err.response?.data?.reply || err.response?.data?.error || err.response?.data?.message || 'Please check your phrasing and amounts (e.g., "Jeep 15" or "Milktea 120").';
      await showAlert({
        title: 'Unable to Record Expense',
        message: errMsg,
        type: 'gold',
      });
    } finally {
      setSmartLoading(false);
    }
  };

  // Run Manual Expense Entry
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualAmount || manualSubmitting) return;

    setManualSubmitting(true);
    try {
      await api.post('/expenses', {
        title: manualTitle.trim(),
        category: manualCategory,
        amount: parseFloat(manualAmount),
        reserve_id: manualVaultId ? parseInt(manualVaultId, 10) : null,
        is_from_reserved: Boolean(manualVaultId),
        logged_at: manualDate || selectedTargetDate || undefined,
      });

      setManualTitle('');
      setManualAmount('');
      setManualVaultId('');
      setManualDate('');
      setSelectedTargetDayNum(null);
      setSelectedTargetDate(null);
      await refreshDashboard();
      setIsTiPigModalOpen(false);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Please check your inputs and try again.';
      await showAlert({
        title: 'Unable to Save Expense',
        message: errMsg,
        type: 'gold',
      });
    } finally {
      setManualSubmitting(false);
    }
  };

  // Run AI Chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatPrompt.trim() || loadingChat) return;

    const userText = chatPrompt.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatPrompt('');
    setLoadingChat(true);

    try {
      const historyPayload = chatMessages.slice(-10).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text || '',
      }));

      const res = await api.post('/ai/interact', {
        prompt: userText,
        mode: 'chat',
        history: historyPayload,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'tipig',
          text: res.data.reply,
          mood: res.data.mood || 'safe',
          provider: res.data.provider,
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
          text: 'Connection hiccup. Tip: Keep meals balanced and log purchases promptly!',
          mood: 'warning',
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  // Delete Expense with Custom Confirmation Modal
  const handleDeleteExpense = async (id, expTitle = 'this expense', expAmount = null) => {
    const details = expAmount
      ? {
          item: expTitle,
          refund_amount: `₱${Number(expAmount).toFixed(2)}`,
          impact: 'Restores to daily baon quota immediately',
        }
      : null;

    const confirmed = await confirmDelete({
      title: 'Remove Expense?',
      message: `Are you sure you want to remove "${expTitle}"? Funds will be restored immediately to your daily quota.`,
      details,
      confirmText: 'Yes, Remove Expense',
      cancelText: 'Keep Expense',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/expenses/${id}`);
      await refreshDashboard();
    } catch (err) {
      await showAlert({
        title: 'Unable to Remove Expense',
        message: 'A network error occurred while deleting the expense. Please try again.',
        type: 'danger',
      });
    }
  };

  // Open Edit Expense Modal
  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setEditTitle(exp.title || '');
    setEditCategory(exp.category || 'Food');
    setEditAmount(exp.amount ? exp.amount.toString() : '');
    setEditVaultId(exp.reserve_id ? exp.reserve_id.toString() : '');

    // Format logged_at to YYYY-MM-DDTHH:mm for datetime-local input
    if (exp.logged_at) {
      try {
        const d = new Date(exp.logged_at);
        const pad = (n) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setEditDate(formatted);
      } catch (e) {
        setEditDate('');
      }
    } else {
      setEditDate('');
    }
  };

  // Save Expense Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingExpense || !editTitle.trim() || !editAmount || editSaving) return;

    setEditSaving(true);
    try {
      await api.put(`/expenses/${editingExpense.id}`, {
        title: editTitle.trim(),
        category: editCategory,
        amount: parseFloat(editAmount),
        reserve_id: editVaultId ? parseInt(editVaultId, 10) : null,
        is_from_reserved: Boolean(editVaultId),
        logged_at: editDate || undefined,
      });

      setEditingExpense(null);
      await refreshDashboard();
    } catch (err) {
      await showAlert({
        title: 'Unable to Update Expense',
        message: 'Please verify the details and amounts, then try again.',
        type: 'gold',
      });
    } finally {
      setEditSaving(false);
    }
  };

  // Determine Dial Color & Status Aura
  const isOverspentToday = financials.today_spent > financials.daily_guide && financials.daily_guide > 0;
  const isNearLimitToday = financials.today_remaining < 35 && financials.today_remaining > 0;
  const dialAuraColor = isOverspentToday
    ? 'var(--status-danger)'
    : isNearLimitToday
    ? 'var(--gold-500)'
    : 'var(--green-600)';

  const dialBgColor = isOverspentToday
    ? 'rgba(239, 68, 68, 0.04)'
    : isNearLimitToday
    ? 'rgba(245, 158, 11, 0.04)'
    : 'rgba(46, 125, 50, 0.04)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Clean Header (No confusing step labels) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.65rem)', fontWeight: 900, color: 'var(--green-900)' }}>
            Daily Spending Budget & Hub
          </h2>
          <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Live day-by-day allowance guide, instant affordability checks, and smart purchase tracking.
          </p>
        </div>

        {dashboardData?.analytics?.tipid_streak_days > 0 && (
          <Link
            to="/review"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              backgroundColor: '#FEF3C7',
              borderRadius: '9999px',
              border: '1px solid #FDE68A',
              color: '#92400E',
              fontWeight: 800,
              fontSize: '0.84rem',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(217, 119, 6, 0.12)',
              transition: 'transform 0.2s',
            }}
            title="View your Tipid Streak in Weekly Review"
          >
            <Flame size={17} color="#D97706" />
            <span>{dashboardData.analytics.tipid_streak_days}-Day Tipid Streak</span>
          </Link>
        )}
      </div>

      {/* Due Today Scheduled Payments Alert Banner */}
      {dashboardData?.due_scheduled_today && dashboardData.due_scheduled_today.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dashboardData.due_scheduled_today.map((sp) => (
            <div
              key={sp.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                backgroundColor: '#FFFBEB',
                border: '1.5px solid #F59E0B',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.12)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B45309',
                    flexShrink: 0,
                  }}
                >
                  <Bell size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#92400E', letterSpacing: '0.5px' }}>
                      Scheduled Payment Due Today (Day {time.current_day})
                    </span>
                    <span className="badge-pill" style={{ backgroundColor: '#FDE68A', color: '#78350F', fontSize: '0.68rem', padding: '2px 8px', fontWeight: 700 }}>
                      {sp.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#78350F', marginTop: '2px' }}>
                    {sp.title} — ₱{Number(sp.amount).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#92400E', marginTop: '2px' }}>
                    Earmarked source: <strong>{sp.reserve_title ? `${sp.reserve_title} Vault` : 'Daily Baon'}</strong>
                    {sp.notes ? ` • Note: "${sp.notes}"` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  disabled={schedulePayingId === sp.id}
                  onClick={() => handleExecuteScheduledPay(sp)}
                  className="btn-primary"
                  style={{
                    backgroundColor: '#D97706',
                    borderColor: '#B45309',
                    padding: '8px 16px',
                    fontSize: '0.84rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(217, 119, 6, 0.25)',
                  }}
                >
                  {schedulePayingId === sp.id ? (
                    'Recording...'
                  ) : (
                    <>
                      <CheckCircle size={15} /> Pay & Record Expense Now
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelScheduled(sp.id, sp.title)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D97706',
                    color: '#92400E',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FLO APP STYLE CENTRAL MODULE */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCF9 100%)',
          border: `2px solid ${dialAuraColor}33`,
          borderRadius: '24px',
          padding: '36px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(27, 67, 50, 0.06)',
        }}
      >
        {/* Subtle Background Glow Ring */}
        <div
          style={{
            position: 'absolute',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: dialBgColor,
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />

        {/* Central Flo-Style Hero Dial */}
        <div
          style={{
            width: 'clamp(210px, 68vw, 270px)',
            height: 'clamp(210px, 68vw, 270px)',
            borderRadius: '50%',
            border: `7px solid ${dialAuraColor}`,
            boxShadow: `0 0 25px ${dialAuraColor}26`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            padding: '16px',
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.3s ease',
          }}
        >
          {/* Day of Cycle Capsule */}
          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: 'var(--green-950)',
              backgroundColor: 'var(--green-50)',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid var(--green-200)',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <CalendarDays size={13} color="var(--green-700)" />
            Day {time.current_day} of {time.total_days}
          </div>

          {/* Today Date */}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {dashboardData?.calendar?.today ? new Date(dashboardData.calendar.today).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today'}
          </span>

          {/* Big Hero Left Today */}
          <div
            style={{
              fontSize: 'clamp(1.75rem, 6.5vw, 2.5rem)',
              fontWeight: 900,
              color: isOverspentToday ? 'var(--status-danger)' : 'var(--green-900)',
              margin: '4px 0 2px 0',
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
            }}
          >
            <AnimatedCounter value={financials.today_remaining} prefix="₱" decimals={2} />
          </div>

          {/* Subtext */}
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isOverspentToday ? 'var(--status-danger)' : 'var(--text-secondary)' }}>
            {isOverspentToday ? 'Quota Exceeded Today' : 'Left to spend today'}
          </span>

          {/* Status Badge */}
          <div style={{ marginTop: '10px' }}>
            <span
              className={`badge-pill ${
                mascot.state === 'safe' ? 'badge-green' : mascot.state === 'warning' ? 'badge-gold' : 'badge-red'
              }`}
              style={{ fontSize: '0.72rem', padding: '3px 10px' }}
            >
              {mascot.state === 'safe' && 'Within Budget'}
              {mascot.state === 'warning' && 'Approaching Limit'}
              {mascot.state === 'peligro' && 'Over Daily Limit'}
            </span>
          </div>
        </div>

        {/* Prominent Flo-Style Action Buttons (Single Unified Pair) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '24px',
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: '520px',
            zIndex: 1,
          }}
        >
          {/* Kaya ba? Check Button */}
          <button
            onClick={() => openTiPigModal('kayaba')}
            className="btn-gold"
            style={{
              flex: '1 1 180px',
              padding: '13px 22px',
              fontSize: '0.96rem',
              fontWeight: 800,
              borderRadius: '16px',
              boxShadow: '0 4px 0 #B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <SolarCardSearch size={20} />
            Kaya ba? Check
          </button>

          {/* Log Expense Button */}
          <button
            onClick={() => openTiPigModal('log')}
            className="btn-primary"
            style={{
              flex: '1 1 180px',
              padding: '13px 22px',
              fontSize: '0.96rem',
              fontWeight: 800,
              borderRadius: '16px',
              boxShadow: '0 4px 0 #1B4D20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <SolarAddCircle size={20} />
            Log Expense
          </button>
        </div>

        {/* Mini 3-Part Metric Summary Bar */}
        {/* Mini 3-Part Metric Summary Bar (Responsive 3-Column Fit) */}
        <div
          className="hero-summary-kpis"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: isMobileView ? '6px' : '10px',
            width: '100%',
            maxWidth: '680px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: 'center', padding: isMobileView ? '8px 4px' : '10px 8px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-light)', minWidth: 0, overflow: 'hidden' }}>
            <span style={{ fontSize: isMobileView ? '0.62rem' : '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.3px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Daily Quota
            </span>
            <div style={{ fontSize: isMobileView ? 'clamp(0.78rem, 2.9vw, 1.1rem)' : 'clamp(0.95rem, 3.4vw, 1.25rem)', fontWeight: 900, color: 'var(--green-900)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <AnimatedCounter value={financials.daily_guide} prefix="₱" decimals={2} suffix={isMobileView ? '' : '/day'} />
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: isMobileView ? '8px 4px' : '10px 8px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-light)', minWidth: 0, overflow: 'hidden' }}>
            <span style={{ fontSize: isMobileView ? '0.62rem' : '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.3px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Spent Today
            </span>
            <div style={{ fontSize: isMobileView ? 'clamp(0.78rem, 2.9vw, 1.1rem)' : 'clamp(0.95rem, 3.4vw, 1.25rem)', fontWeight: 900, color: isOverspentToday ? 'var(--status-danger)' : 'var(--green-900)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <AnimatedCounter value={financials.today_spent} prefix="₱" decimals={2} />
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: isMobileView ? '8px 4px' : '10px 8px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-light)', minWidth: 0, overflow: 'hidden' }}>
            <span style={{ fontSize: isMobileView ? '0.62rem' : '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.3px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isMobileView ? 'Remaining' : 'Remaining Pool'}
            </span>
            <div style={{ fontSize: isMobileView ? 'clamp(0.78rem, 2.9vw, 1.1rem)' : 'clamp(0.95rem, 3.4vw, 1.25rem)', fontWeight: 900, color: 'var(--gold-600)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <AnimatedCounter value={financials.remaining_unreserved} prefix="₱" decimals={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Target Savings Reminder Banner */}
      <div
        className="card"
        style={{
          background:
            financials.savings_status === 'partially_used' || financials.savings_status === 'exhausted'
              ? 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)'
              : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          border: `1.5px solid ${
            financials.savings_status === 'partially_used' || financials.savings_status === 'exhausted'
              ? 'var(--status-danger)'
              : 'var(--green-500)'
          }`,
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Top Row: Icon + Title & Status on Left, Amount on Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor:
                  financials.savings_status === 'partially_used' || financials.savings_status === 'exhausted'
                    ? '#FEE2E2'
                    : '#BBF7D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color:
                  financials.savings_status === 'partially_used' || financials.savings_status === 'exhausted'
                    ? 'var(--status-danger)'
                    : 'var(--green-800)',
                flexShrink: 0,
              }}
            >
              <PiggyBank size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.02rem', fontWeight: 900, color: 'var(--green-950)', margin: 0 }}>
                Target Savings Goal
              </h4>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color:
                    financials.savings_status === 'partially_used' || financials.savings_status === 'exhausted'
                      ? 'var(--status-danger)'
                      : 'var(--green-700)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginTop: '2px',
                }}
              >
                • {financials.savings_status === 'partially_used'
                  ? `Partially Used (₱${Number(financials.savings_used).toFixed(2)} used)`
                  : financials.savings_status === 'exhausted'
                  ? 'Depleted due to overspending'
                  : '100% Intact & Protected'}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', display: 'block' }}>
              Protected Savings
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--green-800)', marginTop: '1px' }}>
              ₱{Number(financials.savings_intact !== undefined ? financials.savings_intact : financials.savings_goal).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Explanatory Reminder Paragraph spanning full width */}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45, borderTop: '1px solid rgba(16, 185, 129, 0.15)', paddingTop: '8px' }}>
          {financials.savings_status === 'partially_used' || financials.savings_status === 'exhausted'
            ? 'Notice: Overspending has begun consuming funds from your Target Savings. Slow down on non-essentials to preserve what remains.'
            : 'Reminder: This target savings is kept separate from your daily spendable allowance. It remains fully intact and protected.'}
        </p>
      </div>

      {/* Yesterday's Quota Performance & Carryover Banner */}
      {dashboardData?.yesterday_summary && (
        <div
          className="card"
          style={{
            backgroundColor: dashboardData.yesterday_summary.is_saved ? '#F0FDF4' : '#FFFBEB',
            border: `1.5px solid ${dashboardData.yesterday_summary.is_saved ? 'var(--green-500)' : 'var(--gold-500)'}`,
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: dashboardData.yesterday_summary.is_saved ? '#DCFCE7' : '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: dashboardData.yesterday_summary.is_saved ? 'var(--green-800)' : 'var(--gold-600)',
                flexShrink: 0,
              }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--green-900)' }}>
                Yesterday's Quota Performance (Day {dashboardData.yesterday_summary.day_number} • {dashboardData.yesterday_summary.date})
              </h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                {dashboardData.yesterday_summary.is_saved ? (
                  <>
                    You spent <strong>₱{Number(dashboardData.yesterday_summary.spent).toFixed(2)}</strong> out of your <strong>₱{Number(dashboardData.yesterday_summary.quota).toFixed(2)}</strong> daily quota. Your unspent <strong>₱{Number(dashboardData.yesterday_summary.saved).toFixed(2)}</strong> was rolled into the remaining {time.remaining_days} days, adjusting today's daily limit to <strong>₱{Number(financials.daily_guide).toFixed(2)}/day</strong>!
                  </>
                ) : (
                  <>
                    You exceeded yesterday's quota by <strong>₱{Number(Math.abs(dashboardData.yesterday_summary.saved)).toFixed(2)}</strong>. Today's daily limit automatically adjusted to <strong>₱{Number(financials.daily_guide).toFixed(2)}/day</strong> to keep your overall allowance on track.
                  </>
                )}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              {dashboardData.yesterday_summary.is_saved ? 'Rolled Over to Pool' : 'Overspent Delta'}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: dashboardData.yesterday_summary.is_saved ? 'var(--green-700)' : 'var(--status-danger)' }}>
              {dashboardData.yesterday_summary.is_saved ? '+' : '-'}₱{Number(Math.abs(dashboardData.yesterday_summary.saved)).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Cycle Calendar Widget (Responsive: 1x5 Desktop vs 2x2 Mobile) */}
      {(() => {
        const allCalendarDays = dashboardData?.calendar?.days || [];
        // On mobile portrait, show 4 days (2x2 grid) per page. On desktop, show 5 days (1x5).
        const pageSize = isMobileView ? 4 : 5;
        const totalCalendarRows = Math.max(1, Math.ceil(allCalendarDays.length / pageSize));
        const currentDayNumber = time?.current_day || 1;
        const defaultCalendarRow = Math.min(
          totalCalendarRows - 1,
          Math.max(0, Math.floor((currentDayNumber - 1) / pageSize))
        );
        const activeCalendarRow = calendarRowIndex !== null
          ? Math.min(totalCalendarRows - 1, Math.max(0, calendarRowIndex))
          : defaultCalendarRow;

        const visibleCalendarDays = isCalendarExpanded
          ? allCalendarDays
          : allCalendarDays.slice(activeCalendarRow * pageSize, (activeCalendarRow + 1) * pageSize);

        const startDayNum = activeCalendarRow * pageSize + 1;
        const endDayNum = Math.min(allCalendarDays.length, (activeCalendarRow + 1) * pageSize);

        return (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CalendarDays size={22} color="var(--green-800)" />
                <h3 style={{ fontSize: isMobileView ? '1.05rem' : '1.15rem', fontWeight: 800, color: 'var(--green-900)' }}>
                  Cycle Calendar & Daily Quotas
                </h3>
                <span
                  title="Click on any day in your cycle to inspect its quota, amount spent, and individual logged purchases."
                  style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}
                >
                  <Info size={15} />
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {dashboardData?.calendar?.cycle_start} to {dashboardData?.calendar?.cycle_end} ({time.total_days} Days)
                </span>

                <button
                  type="button"
                  onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border-light)',
                    backgroundColor: isCalendarExpanded ? 'var(--green-50)' : '#FFFFFF',
                    color: 'var(--green-900)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                  title={isCalendarExpanded ? 'Collapse calendar to active view' : 'Show all cycle days'}
                >
                  {isCalendarExpanded ? (
                    <>
                      <SolarAltArrowUp size={15} color="var(--green-800)" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <SolarAltArrowDown size={15} color="var(--green-800)" />
                      Expand Calendar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Minimized Row Navigation Bar */}
            {!isCalendarExpanded && totalCalendarRows > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-card-alt)',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--green-950)' }}>
                    Days {startDayNum}–{endDayNum} of {allCalendarDays.length}
                  </span>
                  {activeCalendarRow === defaultCalendarRow ? (
                    <span className="badge-pill badge-gold" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      Today • Day {currentDayNumber}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCalendarRowIndex(defaultCalendarRow)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: 'var(--green-700)',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Jump to Today (Day {currentDayNumber})
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCalendarRowIndex(Math.max(0, activeCalendarRow - 1))}
                    disabled={activeCalendarRow === 0}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: activeCalendarRow === 0 ? '#F3F4F6' : '#FFFFFF',
                      color: activeCalendarRow === 0 ? '#9CA3AF' : 'var(--green-900)',
                      cursor: activeCalendarRow === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                    title="View previous days"
                  >
                    <SolarAltArrowLeft size={14} /> Prev
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalendarRowIndex(Math.min(totalCalendarRows - 1, activeCalendarRow + 1))}
                    disabled={activeCalendarRow >= totalCalendarRows - 1}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: activeCalendarRow >= totalCalendarRows - 1 ? '#F3F4F6' : '#FFFFFF',
                      color: activeCalendarRow >= totalCalendarRows - 1 ? '#9CA3AF' : 'var(--green-900)',
                      cursor: activeCalendarRow >= totalCalendarRows - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                    title="View next days"
                  >
                    Next <SolarAltArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Days Grid: 1x5 on desktop, 2-column mobile grid on small screens */}
            <div style={{ overflowX: isMobileView ? 'visible' : 'auto', paddingBottom: '4px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobileView ? 'repeat(2, 1fr)' : 'repeat(5, minmax(130px, 1fr))',
                  gap: isMobileView ? '8px' : '10px',
                  marginTop: '4px',
                  minWidth: isMobileView ? '0' : '690px',
                }}
              >
                {visibleCalendarDays.map((day) => {
                  const isSelected = selectedCalendarDay === day.day_number;
                  let borderColor = 'var(--border-light)';
                  let bgColor = '#FFFFFF';
                  let statusBadgeClass = 'badge-green';
                  let statusText = 'Upcoming';

                  if (day.is_current) {
                    borderColor = 'var(--gold-500)';
                    bgColor = '#FFFBEB';
                    statusBadgeClass = 'badge-gold';
                    statusText = 'Today • Active';
                  } else if (day.is_past) {
                    if (day.status === 'saved') {
                      borderColor = 'var(--green-400)';
                      bgColor = '#F0FDF4';
                      statusBadgeClass = 'badge-green';
                      statusText = `Saved ₱${(day.quota - day.spent).toFixed(0)}`;
                    } else if (day.status === 'overspent') {
                      borderColor = '#FCA5A5';
                      bgColor = '#FEF2F2';
                      statusBadgeClass = 'badge-red';
                      statusText = `Over ₱${(day.spent - day.quota).toFixed(0)}`;
                    } else {
                      statusText = 'Met Quota';
                    }
                  }

                  return (
                    <div
                      key={day.day_number}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCalendarDay(null);
                          setSelectedTargetDayNum(null);
                          setSelectedTargetDate(null);
                        } else {
                          setSelectedCalendarDay(day.day_number);
                          setSelectedTargetDayNum(day.day_number);
                          setSelectedTargetDate(day.date);
                        }
                      }}
                      style={{
                        border: isSelected ? '2px solid var(--green-800)' : `1.5px solid ${borderColor}`,
                        borderRadius: '16px',
                        backgroundColor: bgColor,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(27, 67, 50, 0.15)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--green-950)' }}>
                          Day {day.day_number}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {day.formatted_date.split(' ')[0]} {day.formatted_date.split(' ')[1]}
                        </span>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Daily Quota</div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--green-900)' }}>
                          ₱{Number(day.quota).toFixed(2)}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          Spent: <strong style={{ color: day.spent > day.quota ? 'var(--status-danger)' : 'var(--text-primary)' }}>₱{Number(day.spent).toFixed(2)}</strong>
                        </span>
                      </div>

                      <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span className={`badge-pill ${statusBadgeClass}`} style={{ fontSize: '0.66rem', padding: '2px 6px', display: 'inline-block' }}>
                          {statusText}
                        </span>

                        {day.has_scheduled && (
                          <span
                            className="badge-pill"
                            style={{
                              fontSize: '0.64rem',
                              padding: '2px 6px',
                              backgroundColor: '#EEF2FF',
                              color: '#3730A3',
                              border: '1px solid #C7D2FE',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontWeight: 700,
                            }}
                          >
                            <Clock size={11} /> ₱{Number(day.scheduled_total).toFixed(0)} Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedCalendarDay && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.82rem', color: 'var(--green-900)', fontWeight: 700 }}>
                <span>Filtered to Day {selectedCalendarDay} purchases below</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCalendarDay(null);
                    setSelectedTargetDayNum(null);
                    setSelectedTargetDate(null);
                  }}
                  style={{ color: 'var(--green-700)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  Reset Filter (Show All Purchases)
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* MERGED: Itemized Purchases & Daily Activity (Editable & Filterable) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={22} color="var(--green-800)" />
              <h3 style={{ fontSize: isMobileView ? '1.05rem' : '1.15rem', fontWeight: 800, color: 'var(--green-900)' }}>
                Logged Purchases & Daily Activity
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              View and edit your expenses. Reassign categories or reserved vaults anytime to fix mistakes.
            </p>
          </div>

          {/* Primary Action Button (Docked cleanly in header) */}
          {(() => {
            const selectedDayObj = selectedCalendarDay !== null
              ? (dashboardData?.calendar?.days || []).find((d) => d.day_number === selectedCalendarDay)
              : null;

            if (selectedDayObj?.is_future) {
              return (
                <button
                  onClick={() => openScheduleModal(selectedDayObj.day_number, selectedDayObj.date)}
                  className="btn-primary"
                  style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Plus size={14} /> Schedule Payment (Day {selectedDayObj.day_number})
                </button>
              );
            }

            if (selectedDayObj?.is_past) {
              return (
                <button
                  onClick={() => openTiPigModal('log', '', selectedDayObj.day_number)}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Plus size={14} /> Add Day {selectedDayObj.day_number} Purchase
                </button>
              );
            }

            return (
              <button
                onClick={() => openTiPigModal('log')}
                className="btn-secondary"
                style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Plus size={14} /> Add Purchase
              </button>
            );
          })()}
        </div>

        {/* Filter Row 1: Time Scope (All / Today / Previous) */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            paddingBottom: '2px',
          }}
        >
          <button
            onClick={() => { setSelectedCalendarDay(null); setSelectedTargetDayNum(null); setSelectedTargetDate(null); setPurchaseFilter('all'); }}
            className={`badge-pill ${purchaseFilter === 'all' && !selectedCalendarDay ? 'badge-gold' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid var(--border-light)',
              flexShrink: 0,
              backgroundColor: purchaseFilter === 'all' && !selectedCalendarDay ? 'var(--gold-100)' : '#FFFFFF',
              color: purchaseFilter === 'all' && !selectedCalendarDay ? '#92400E' : 'var(--text-secondary)',
            }}
          >
            All ({(dashboardData?.all_expenses || dashboardData?.recent_expenses || []).length})
          </button>
          <button
            onClick={() => {
              setSelectedCalendarDay(time.current_day);
              setSelectedTargetDayNum(time.current_day);
              setSelectedTargetDate(dashboardData?.calendar?.today);
              setPurchaseFilter('today');
            }}
            className={`badge-pill ${purchaseFilter === 'today' || selectedCalendarDay === time.current_day ? 'badge-gold' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid var(--border-light)',
              flexShrink: 0,
              backgroundColor: purchaseFilter === 'today' || selectedCalendarDay === time.current_day ? 'var(--gold-100)' : '#FFFFFF',
              color: purchaseFilter === 'today' || selectedCalendarDay === time.current_day ? '#92400E' : 'var(--text-secondary)',
            }}
          >
            Today ({dashboardData?.today_expenses?.length || 0})
          </button>
          <button
            onClick={() => { setSelectedCalendarDay(null); setSelectedTargetDayNum(null); setSelectedTargetDate(null); setPurchaseFilter('past'); }}
            className={`badge-pill ${purchaseFilter === 'past' ? 'badge-gold' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid var(--border-light)',
              flexShrink: 0,
              backgroundColor: purchaseFilter === 'past' ? 'var(--gold-100)' : '#FFFFFF',
              color: purchaseFilter === 'past' ? '#92400E' : 'var(--text-secondary)',
            }}
          >
            Previous Days
          </button>
        </div>

        {/* Filter Row 2: Category Chips (Single Horizontal Swipeable Strip) */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            flexWrap: 'nowrap',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            paddingBottom: '2px',
          }}
        >
          {['All', 'Food', 'Transportation', 'School Expenses', 'Personal Needs'].map((cat) => {
            const isCatActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`badge-pill ${isCatActive ? 'badge-green' : ''}`}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: isCatActive ? 800 : 600,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  border: isCatActive ? '1px solid var(--green-700)' : '1px solid var(--border-light)',
                  backgroundColor: isCatActive ? 'var(--green-700)' : '#FFFFFF',
                  color: isCatActive ? '#FFFFFF' : 'var(--text-secondary)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Display Expenses List */}
        {(() => {
          const selectedDayObj = selectedCalendarDay !== null
            ? (dashboardData?.calendar?.days || []).find((d) => d.day_number === selectedCalendarDay)
            : null;

          if (selectedDayObj?.is_future) {
            return (
              <div
                style={{
                  padding: '28px 20px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-card-alt)',
                  border: '1.5px dashed var(--border-medium)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    backgroundColor: '#EEF2FF',
                    color: '#3730A3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Clock size={24} />
                </div>

                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--green-950)' }}>
                    Upcoming Day {selectedDayObj.day_number} ({selectedDayObj.formatted_date})
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '4px auto 0', lineHeight: 1.5 }}>
                    Purchases cannot be logged for future days because they have not happened yet.
                    If you have an upcoming project fee, ambagan, or scheduled bill, allocate money from your vaults ahead of time so it is reserved!
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => openScheduleModal(selectedDayObj.day_number, selectedDayObj.date)}
                    className="btn-primary"
                    style={{ padding: '9px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={15} /> Schedule Vault Payment for Day {selectedDayObj.day_number}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCalendarDay(null);
                      setSelectedTargetDayNum(null);
                      setSelectedTargetDate(null);
                    }}
                    className="btn-secondary"
                    style={{ padding: '9px 16px', fontSize: '0.85rem' }}
                  >
                    View All Logged Purchases
                  </button>
                </div>

                {/* Scheduled Allocations List for this day */}
                {selectedDayObj.scheduled_payments && selectedDayObj.scheduled_payments.length > 0 && (
                  <div style={{ width: '100%', maxWidth: '620px', marginTop: '16px', textAlign: 'left' }}>
                    <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--green-900)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} /> Scheduled Allocations for Day {selectedDayObj.day_number} ({selectedDayObj.scheduled_payments.length})
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedDayObj.scheduled_payments.map((sp) => (
                        <div
                          key={sp.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            backgroundColor: '#FFFFFF',
                            border: '1.5px solid #C7D2FE',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: 'var(--green-950)', fontSize: '0.92rem' }}>
                                {sp.title}
                              </span>
                              <span className="badge-pill" style={{ backgroundColor: '#EEF2FF', color: '#3730A3', fontSize: '0.68rem', padding: '2px 8px' }}>
                                {sp.category}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              Source: <strong>{sp.reserve_title ? `${sp.reserve_title} Vault` : 'Daily Baon Quota'}</strong>
                              {sp.notes ? ` • Note: "${sp.notes}"` : ''}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ fontSize: '1rem', color: '#3730A3' }}>
                              ₱{Number(sp.amount).toFixed(2)}
                            </strong>
                            <button
                              type="button"
                              onClick={() => handleCancelScheduled(sp.id, sp.title)}
                              style={{
                                border: 'none',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="Cancel scheduled payment"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          let baseList = [];
          if (selectedCalendarDay !== null) {
            baseList = selectedDayObj?.expenses || [];
          } else if (purchaseFilter === 'today') {
            baseList = dashboardData?.today_expenses || [];
          } else if (purchaseFilter === 'past') {
            const pastDays = (dashboardData?.calendar?.days || []).filter((d) => d.is_past);
            baseList = pastDays.flatMap((d) => d.expenses || []);
          } else {
            baseList = dashboardData?.all_expenses || dashboardData?.recent_expenses || [];
          }

          const displayedExpenses = categoryFilter === 'All'
            ? baseList
            : baseList.filter((e) => e.category === categoryFilter);

          if (displayedExpenses.length === 0) {
            const isPastDaySelected = selectedDayObj?.is_past;
            return (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 16px',
                  backgroundColor: 'var(--bg-card-alt)',
                  borderRadius: '16px',
                  border: '1px dashed var(--border-medium)',
                }}
              >
                <div style={{ color: 'var(--green-700)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                  <ShieldCheck size={32} />
                </div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--green-950)' }}>
                  {isPastDaySelected
                    ? `No purchases recorded on Day ${selectedDayObj.day_number} (${selectedDayObj.formatted_date})`
                    : purchaseFilter === 'today' || selectedCalendarDay === time.current_day
                    ? 'No purchases logged for today yet!'
                    : 'No purchases found for this filter.'}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {isPastDaySelected
                    ? 'Need to log an expense you forgot from this day? Click below to record it.'
                    : purchaseFilter === 'today' || selectedCalendarDay === time.current_day
                    ? `Your full ₱${Number(financials.daily_guide).toFixed(2)} daily spending limit is intact and available.`
                    : 'Click "Add Purchase" or use TiPig to record your daily spending.'}
                </p>
                <div style={{ marginTop: '14px' }}>
                  <button
                    onClick={() => openTiPigModal('log', '', isPastDaySelected ? selectedDayObj.day_number : null)}
                    className="btn-primary"
                    style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                  >
                    <Plus size={15} /> {isPastDaySelected ? `Add Day ${selectedDayObj.day_number} Purchase` : 'Record First Expense'}
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {displayedExpenses.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid var(--border-light)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '11px',
                        backgroundColor:
                          exp.category === 'Food'
                            ? '#FEF3C7'
                            : exp.category === 'Transportation'
                            ? '#DCFCE7'
                            : exp.category === 'School Expenses'
                            ? '#E0E7FF'
                            : '#F3E8FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color:
                          exp.category === 'Food'
                            ? '#92400E'
                            : exp.category === 'Transportation'
                            ? '#166534'
                            : exp.category === 'School Expenses'
                            ? '#3730A3'
                            : '#7C3AED',
                        flexShrink: 0,
                      }}
                      title={exp.category}
                    >
                      {exp.category === 'Food' ? (
                        <SolarMeal size={20} color="#92400E" />
                      ) : exp.category === 'Transportation' ? (
                        <SolarBus size={20} color="#166534" />
                      ) : exp.category === 'School Expenses' ? (
                        <SolarBookBookmark size={20} color="#3730A3" />
                      ) : (
                        <SolarBagSmile size={20} color="#7C3AED" />
                      )}
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--green-950)' }}>
                        {exp.title}
                      </strong>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px', flexWrap: 'wrap' }}>
                        <span className="badge-pill badge-green" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                          {exp.category}
                        </span>

                        {exp.is_from_reserved ? (
                          <span
                            className="badge-pill badge-gold"
                            style={{ fontSize: '0.68rem', padding: '2px 7px', display: 'flex', alignItems: 'center', gap: '3px' }}
                            title="This expense was deducted from your Reserved Vault, protecting your daily baon."
                          >
                            <ShieldCheck size={11} />
                            {exp.reserved_expense?.title ? `Vault: ${exp.reserved_expense.title}` : 'Reserved Vault'}
                          </span>
                        ) : (
                          <span
                            style={{ fontSize: '0.68rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card-alt)', padding: '2px 7px', borderRadius: '4px' }}
                          >
                            Daily Spendable
                          </span>
                        )}

                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {exp.time_formatted || new Date(exp.logged_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--green-900)' }}>
                        ₱{Number(exp.amount).toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: exp.is_from_reserved ? 'var(--green-700)' : 'var(--text-secondary)' }}>
                        {exp.is_from_reserved ? 'Vault Protected' : 'From Baon'}
                      </span>
                    </div>

                    {/* Action Buttons: Edit & Delete */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => openEditModal(exp)}
                        title="Edit Expense"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '8px',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.15s ease',
                        }}
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.title, exp.amount)}
                        title="Delete Expense"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '8px',
                          color: 'var(--status-danger)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.15s ease',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Complete 4-Part Funds Breakdown Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-900)' }}>
            Funds Reconciliation & Pacing Formula
          </h3>
          <span className="badge-pill badge-green" style={{ fontSize: '0.74rem' }}>
            {time.days_left !== undefined ? `${time.days_left} ${time.days_left === 1 ? 'day' : 'days'} left` : `${Math.max(0, time.total_days - time.current_day)} days left`}
          </span>
        </div>

        {/* Countable Cycle Timeline Bar */}
        <SegmentedCycleBar
          totalDays={time.total_days}
          currentDay={time.current_day}
          daysLeft={time.days_left !== undefined ? time.days_left : Math.max(0, time.total_days - time.current_day)}
          height={11}
          showSubtext
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wallet size={15} color="var(--green-700)" />
              <strong>Total Allowance:</strong>
            </span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--green-900)' }}>
              ₱{Number(financials.total_allowance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PiggyBank size={15} color="var(--gold-600)" />
              <span>Target Savings (Protected):</span>
            </span>
            <strong style={{ color: 'var(--gold-700)' }}>
              ₱{Number(financials.savings_goal).toFixed(2)}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="var(--green-600)" />
              <span>Reserves Vault (Transit & School):</span>
            </span>
            <strong style={{ color: 'var(--green-800)' }}>
              ₱{Number(financials.total_reserved).toFixed(2)}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} color="var(--gold-600)" />
              <span>Spendable Pool (Remaining):</span>
            </span>
            <strong style={{ color: 'var(--gold-600)' }}>
              ₱{Number(financials.remaining_unreserved).toFixed(2)}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Spent from Spendable Pool:</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              ₱{Number(financials.unreserved_spent || 0).toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Math Reconciliation Check */}
        <div
          style={{
            backgroundColor: 'var(--bg-card-alt)',
            padding: '11px 14px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <Info size={16} color="var(--green-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--green-900)' }}>Funds Balance Check:</strong><br />
            ₱{Number(financials.total_allowance).toFixed(2)} (Allowance) = ₱{Number(financials.savings_goal).toFixed(2)} (Savings) + ₱{Number(financials.total_reserved).toFixed(2)} (Reserves) + ₱{Number(financials.remaining_unreserved).toFixed(2)} (Remaining) + ₱{Number(financials.unreserved_spent || 0).toFixed(2)} (Spent)
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TIPIG COMPANION POP-UP MODAL (Kaya ba? + Logger + Chat) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isTiPigModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  backgroundColor: 'var(--green-900)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src="/mascot/tipig-safe.svg"
                      alt="TiPig"
                      style={{ width: '28px', height: '28px' }}
                    />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                      TiPig AI Companion
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: '#A5D6A7', margin: 0 }}>
                      Daily Baon Guide • Affordability Predictor
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsTiPigModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Navigation Tabs */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border-light)',
                  backgroundColor: '#F9FCF9',
                  padding: '0 16px',
                }}
              >
                <button
                  onClick={() => setActiveModalTab('kayaba')}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    border: 'none',
                    background: 'none',
                    fontWeight: activeModalTab === 'kayaba' ? 800 : 600,
                    fontSize: '0.86rem',
                    color: activeModalTab === 'kayaba' ? 'var(--gold-600)' : 'var(--text-secondary)',
                    borderBottom: activeModalTab === 'kayaba' ? '3px solid var(--gold-500)' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <SolarCardSearch size={16} /> Kaya ba?
                </button>

                <button
                  onClick={() => setActiveModalTab('log')}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    border: 'none',
                    background: 'none',
                    fontWeight: activeModalTab === 'log' ? 800 : 600,
                    fontSize: '0.86rem',
                    color: activeModalTab === 'log' ? 'var(--green-800)' : 'var(--text-secondary)',
                    borderBottom: activeModalTab === 'log' ? '3px solid var(--green-700)' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <SolarAddCircle size={16} /> Log Expense
                </button>

                <button
                  onClick={() => setActiveModalTab('chat')}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    border: 'none',
                    background: 'none',
                    fontWeight: activeModalTab === 'chat' ? 800 : 600,
                    fontSize: '0.86rem',
                    color: activeModalTab === 'chat' ? 'var(--green-800)' : 'var(--text-secondary)',
                    borderBottom: activeModalTab === 'chat' ? '3px solid var(--green-700)' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <SolarChatRoundDots size={16} /> Chat & Advice
                </button>
              </div>

              {/* Modal Body / Tab Content */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                {/* TAB 1: KAYA BA? AFFORDABILITY PREDICTOR */}
                {activeModalTab === 'kayaba' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ backgroundColor: '#FFFBEB', padding: '12px 16px', borderRadius: '14px', border: '1px solid var(--gold-400)' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SolarCardSearch size={16} /> "Kaya ba?" Student Budget Simulator
                      </strong>
                      <p style={{ fontSize: '0.78rem', color: '#78350F', marginTop: '2px' }}>
                        Simulate whether a purchase fits today's baon, check its effect on tomorrow's daily limit, and see if past savings give you room to treat yourself!
                      </p>
                    </div>

                    {/* Quick Student Suggestions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Quick Student Tests:
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { label: '₱35 Snack', prompt: 'Snack 35' },
                          { label: '₱60 Canteen Lunch', prompt: 'Canteen lunch 60' },
                          { label: '₱120 Milktea', prompt: 'Milktea 120' },
                          { label: '₱250 Project Printing', prompt: 'Thesis printing 250' },
                          { label: '₱450 Treat', prompt: 'Buffet treat 450' },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={(e) => {
                              setKayaBaPrompt(chip.prompt);
                              handleCheckKayaBa(e, chip.prompt);
                            }}
                            className="badge-pill"
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid var(--border-medium)',
                              color: 'var(--green-900)',
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              cursor: 'pointer',
                            }}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleCheckKayaBa} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Milktea 120 or Fastfood burger 185..."
                        value={kayaBaPrompt}
                        onChange={(e) => setKayaBaPrompt(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.9rem' }}
                      />
                      <button
                        type="submit"
                        disabled={kayaBaLoading}
                        className="btn-gold"
                        style={{ padding: '0 20px', whiteSpace: 'nowrap', fontWeight: 800 }}
                      >
                        {kayaBaLoading ? 'Checking...' : 'Check!'}
                      </button>
                    </form>

                    {/* Result Output */}
                    {kayaBaResult && (
                      <div
                        style={{
                          borderRadius: '16px',
                          padding: '16px 18px',
                          backgroundColor:
                            kayaBaResult.status === 'safe'
                              ? '#F0FDF4'
                              : kayaBaResult.status === 'warning'
                              ? '#FFFBEB'
                              : '#FEF2F2',
                          border: `1.5px solid ${
                            kayaBaResult.status === 'safe'
                              ? 'var(--green-400)'
                              : kayaBaResult.status === 'warning'
                              ? 'var(--gold-400)'
                              : '#FCA5A5'
                          }`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        <FormattedMarkdownText content={kayaBaResult.reply} style={{ color: 'var(--text-primary)' }} />

                        {/* Visual Breakdown Cards */}
                        {kayaBaResult.details && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '8px',
                              backgroundColor: '#FFFFFF',
                              padding: '12px',
                              borderRadius: '12px',
                              border: '1px solid rgba(0,0,0,0.06)',
                              fontSize: '0.78rem',
                            }}
                          >
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Today Left After:</span>
                              <div style={{ fontWeight: 800, color: 'var(--green-900)', fontSize: '0.95rem' }}>
                                ₱{Number(kayaBaResult.details.today_remaining_after || 0).toFixed(2)}
                              </div>
                            </div>

                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Future Daily Limit:</span>
                              <div style={{ fontWeight: 800, color: kayaBaResult.details.drop_per_day > 0 ? 'var(--status-danger)' : 'var(--green-900)', fontSize: '0.95rem' }}>
                                ₱{Number(kayaBaResult.details.projected_future_daily || 0).toFixed(2)}/day
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quick Action: Log This Purchase */}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSmartText(kayaBaPrompt);
                              setActiveModalTab('log');
                            }}
                            className="btn-primary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            <Plus size={14} /> Log This Expense Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: LOG EXPENSE (Smart AI + Manual Entry with Vault Selection) */}
                {activeModalTab === 'log' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Target Date Context Banner */}
                    {selectedTargetDate && selectedTargetDayNum && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: '#FEF3C7',
                          border: '1.5px solid #F59E0B',
                          borderRadius: '12px',
                          fontSize: '0.82rem',
                          color: '#92400E',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <SolarCalendarDate size={18} color="#B45309" />
                          <span>
                            Recording for <strong>Day {selectedTargetDayNum} ({selectedTargetDate})</strong>
                            {selectedTargetDayNum < time.current_day ? ' (Past Date Record)' : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTargetDayNum(null);
                            setSelectedTargetDate(null);
                            setManualDate('');
                          }}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #D97706',
                            color: '#92400E',
                            borderRadius: '8px',
                            padding: '3px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Switch to Today (Day {time.current_day})
                        </button>
                      </div>
                    )}

                    {/* Switcher: Smart vs Manual */}
                    <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-card-alt)', padding: '4px', borderRadius: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setLoggerType('smart')}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '0.82rem',
                          fontWeight: loggerType === 'smart' ? 800 : 600,
                          backgroundColor: loggerType === 'smart' ? '#FFFFFF' : 'transparent',
                          color: loggerType === 'smart' ? 'var(--green-900)' : 'var(--text-secondary)',
                          boxShadow: loggerType === 'smart' ? 'var(--shadow-sm)' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Smart Natural Language
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoggerType('manual')}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '0.82rem',
                          fontWeight: loggerType === 'manual' ? 800 : 600,
                          backgroundColor: loggerType === 'manual' ? '#FFFFFF' : 'transparent',
                          color: loggerType === 'manual' ? 'var(--green-900)' : 'var(--text-secondary)',
                          boxShadow: loggerType === 'manual' ? 'var(--shadow-sm)' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Manual Detailed Form
                      </button>
                    </div>

                    {/* Option A: Smart Natural Language */}
                    {loggerType === 'smart' && (
                      <form onSubmit={handleSmartLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Describe Purchases</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Multi-item supported</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder='e.g. "Siomai rice 45, then iced tea 25 and jeep 15"'
                            value={smartText}
                            onChange={(e) => setSmartText(e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.9rem' }}
                          />
                        </div>

                        {/* Deduct from Vault Selector */}
                        <div>
                          <label className="form-label">
                            Deduct From Vault (Optional)
                          </label>
                          <select
                            value={smartVaultId}
                            onChange={(e) => setSmartVaultId(e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.85rem' }}
                          >
                            <option value="">Auto-Detect Vault (Food, Transit, or Baon)</option>
                            <option value="none">Daily Spendable Pool (General Baon)</option>
                            {reserves.map((r) => (
                              <option key={r.id} value={r.id}>
                                Vault: {r.title} (₱{Number(r.allocated_amount - r.spent_amount).toFixed(2)} left)
                              </option>
                            ))}
                          </select>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Auto-detect automatically matches your Food, Transit, and School vaults.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={smartLoading}
                          className="btn-primary"
                          style={{ padding: '12px', fontWeight: 800 }}
                        >
                          {smartLoading ? 'Recording Expenses...' : 'Record Purchases'}
                        </button>

                        {smartFeedback && (
                          <div
                            style={{
                              padding: '14px 16px',
                              backgroundColor:
                                smartFeedback.status === 'peligro'
                                  ? '#FEF2F2'
                                  : smartFeedback.status === 'warning'
                                  ? '#FFFBEB'
                                  : 'var(--green-50)',
                              borderRadius: '12px',
                              border: `1.5px solid ${
                                smartFeedback.status === 'peligro'
                                  ? '#FCA5A5'
                                  : smartFeedback.status === 'warning'
                                  ? 'var(--gold-400)'
                                  : 'var(--green-300)'
                              }`,
                              fontSize: '0.84rem',
                              lineHeight: 1.45,
                              boxShadow: 'var(--shadow-sm)',
                            }}
                          >
                            <FormattedMarkdownText content={smartFeedback.reply} />
                          </div>
                        )}
                      </form>
                    )}

                    {/* Option B: Manual Detailed Form */}
                    {loggerType === 'manual' && (
                      <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="form-label">Item / Description</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Canteen lunch, coffee, or printing"
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                            className="form-input"
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label className="form-label">Category</label>
                            <select
                              value={manualCategory}
                              onChange={(e) => setManualCategory(e.target.value)}
                              className="form-input"
                            >
                              <option value="Food">Food & Drinks</option>
                              <option value="Transportation">Transportation</option>
                              <option value="School Expenses">School Expenses</option>
                              <option value="Personal Needs">Personal Needs</option>
                            </select>
                          </div>

                          <div>
                            <label className="form-label">Amount (₱)</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              placeholder="50.00"
                              value={manualAmount}
                              onChange={(e) => setManualAmount(e.target.value)}
                              className="form-input"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label">Deduct from Reserved Vault?</label>
                          <select
                            value={manualVaultId}
                            onChange={(e) => setManualVaultId(e.target.value)}
                            className="form-input"
                          >
                            <option value="">No (Deduct from Daily Spendable)</option>
                            {reserves.map((r) => (
                              <option key={r.id} value={r.id}>
                                Vault: {r.title} (₱{Number(r.allocated_amount - r.spent_amount).toFixed(2)} left)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label">Date & Time (Optional)</label>
                          <input
                            type="datetime-local"
                            value={manualDate}
                            max={new Date().toISOString().slice(0, 16)}
                            onChange={(e) => setManualDate(e.target.value)}
                            className="form-input"
                          />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {selectedTargetDate ? `Set for Day ${selectedTargetDayNum} (${selectedTargetDate}). Future dates are disabled.` : 'Leave blank for current local time. Future dates are disabled.'}
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={manualSubmitting}
                          className="btn-primary"
                          style={{ padding: '12px', fontWeight: 800, marginTop: '6px' }}
                        >
                          {manualSubmitting ? 'Saving...' : 'Save Purchase'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* TAB 3: AI COMPANION CHAT */}
                {activeModalTab === 'chat' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            padding: '10px 14px',
                            borderRadius: '16px',
                            backgroundColor: msg.sender === 'user' ? 'var(--green-700)' : 'var(--bg-card-alt)',
                            color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                            fontSize: '0.85rem',
                            lineHeight: '1.4',
                            border: msg.sender === 'user' ? 'none' : '1px solid var(--border-light)',
                          }}
                        >
                          {msg.sender === 'user' ? (
                            msg.text
                          ) : (
                            <FormattedMarkdownText content={msg.text} />
                          )}
                        </div>
                      ))}
                      {loadingChat && (
                        <div style={{ alignSelf: 'flex-start', padding: '8px 12px', backgroundColor: 'var(--bg-card-alt)', borderRadius: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          TiPig is thinking...
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', marginTop: '8px' }}>
                      <input
                        type="text"
                        placeholder="Ask TiPig about student budgeting..."
                        value={chatPrompt}
                        onChange={(e) => setChatPrompt(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.85rem', padding: '10px 14px' }}
                      />
                      <button type="submit" disabled={loadingChat} className="btn-primary" style={{ padding: '0 16px' }}>
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* EDIT EXPENSE MODAL (Reassign category, vault, or amount)  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {editingExpense && (
          <div
            className="mobile-fullscreen-modal-backdrop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card mobile-fullscreen-modal-card"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit2 size={18} color="var(--green-800)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--green-900)', margin: 0 }}>
                    Edit Logged Expense
                  </h3>
                </div>
                <button
                  onClick={() => setEditingExpense(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">Item / Description</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="form-input"
                    >
                      <option value="Food">Food & Drinks</option>
                      <option value="Transportation">Transportation</option>
                      <option value="School Expenses">School Expenses</option>
                      <option value="Personal Needs">Personal Needs</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Amount (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Deduct From Reserved Vault?</label>
                  <select
                    value={editVaultId}
                    onChange={(e) => setEditVaultId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Daily Spendable Pool (General Baon)</option>
                    {reserves.map((r) => (
                      <option key={r.id} value={r.id}>
                        Vault: {r.title} (₱{Number(r.allocated_amount - r.spent_amount).toFixed(2)} left)
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Reassigning to a vault ensures your daily spendable pool is not accidentally overbudgeted.
                  </p>
                </div>

                <div>
                  <label className="form-label">Logged Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editDate}
                    max={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="form-input"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Expenses cannot be assigned to future dates.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" disabled={editSaving} className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                    {editSaving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="btn-secondary"
                    style={{ padding: '10px 18px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* SCHEDULE VAULT PAYMENT MODAL (For Future Days)             */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div
            className="mobile-fullscreen-modal-backdrop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card mobile-fullscreen-modal-card"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} color="var(--green-800)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--green-900)', margin: 0 }}>
                    Schedule Future Payment
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ backgroundColor: '#EEF2FF', padding: '10px 14px', borderRadius: '12px', fontSize: '0.8rem', color: '#3730A3' }}>
                Allocate funds ahead of time for an upcoming project, ambagan, or fee on <strong>Day {scheduleDayNum} ({scheduleDate})</strong>. You will receive an alert on that day with 1-click payment!
              </div>

              <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">Payment Title / Purpose</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Final Thesis Xerox & Ring Binding"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">Category</label>
                    <select
                      value={scheduleCategory}
                      onChange={(e) => setScheduleCategory(e.target.value)}
                      className="form-input"
                    >
                      <option value="School Expenses">School Expenses</option>
                      <option value="Food">Food & Drinks</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Personal Needs">Personal Needs</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Amount (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="150.00"
                      value={scheduleAmount}
                      onChange={(e) => setScheduleAmount(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">Target Day in Cycle</label>
                    <select
                      value={scheduleDayNum || ''}
                      onChange={(e) => {
                        const dayVal = parseInt(e.target.value, 10);
                        setScheduleDayNum(dayVal);
                        const matchDay = (dashboardData?.calendar?.days || []).find((d) => d.day_number === dayVal);
                        if (matchDay) setScheduleDate(matchDay.date);
                      }}
                      className="form-input"
                    >
                      {(dashboardData?.calendar?.days || [])
                        .filter((d) => d.day_number >= time.current_day)
                        .map((d) => (
                          <option key={d.day_number} value={d.day_number}>
                            Day {d.day_number} ({d.formatted_date}) {d.is_current ? '• Today' : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      required
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Allocate From Vault (Optional)</label>
                  <select
                    value={scheduleVaultId}
                    onChange={(e) => setScheduleVaultId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Daily Baon Quota on that day</option>
                    {reserves.map((r) => (
                      <option key={r.id} value={r.id}>
                        Vault: {r.title} (₱{Number(r.allocated_amount - r.spent_amount).toFixed(2)} available)
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Earmarking to a vault protects your daily food allowance from being depleted when payment day arrives.
                  </p>
                </div>

                <div>
                  <label className="form-label">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Leader said deadline is 3 PM"
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" disabled={scheduleSubmitting} className="btn-primary" style={{ flex: 1, padding: '11px', fontWeight: 800 }}>
                    {scheduleSubmitting ? 'Scheduling...' : 'Save Scheduled Allocation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="btn-secondary"
                    style={{ padding: '11px 18px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyBudgetPage;
