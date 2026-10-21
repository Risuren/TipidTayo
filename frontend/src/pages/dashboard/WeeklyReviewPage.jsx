import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Award,
  PiggyBank,
  ShieldCheck,
  Wallet,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Flame,
  Lightbulb,
  ThumbsUp,
  Plus,
  X,
  Info,
  Calendar,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Clock,
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
} from 'lucide-react';
import {
  SolarBus,
  SolarBookBookmark,
  SolarMeal,
  SolarBagSmile,
  SolarShieldCheck,
  SolarCalculator,
  SolarChatRoundDots,
} from '../../components/common/SolarIcons';
import TiPig from '../../components/mascot/TiPig';
import { FormattedMarkdownText } from '../../components/common/FormattedMarkdownText';
import MultiCycleSavingsLineChart from '../../components/charts/MultiCycleSavingsLineChart';
import useDraggableScroll from '../../hooks/useDraggableScroll';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import api from '../../api/axios';

export const WeeklyReviewPage = () => {
  const { dashboardData, activeCycle, refreshDashboard } = useAuth();
  const { showAlert } = useModal();
  const navigate = useNavigate();

  // Selected Day in Day-by-Day Bar Chart
  const [selectedDay, setSelectedDay] = useState(null);
  const pacingScroll = useDraggableScroll();

  // Cycle Graduation & Story Card Modal
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  const [copiedStory, setCopiedStory] = useState(false);

  // Trigger Confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2E7D32', '#FFD700', '#3B82F6', '#10B981'],
    });
  };

  // Financial Metrics Extraction
  const financials = dashboardData?.financials || {};
  const time = dashboardData?.time || {};
  const analytics = dashboardData?.analytics || {};
  const calendarDays = dashboardData?.calendar?.days || [];
  const categories = dashboardData?.categories || {
    Food: 0,
    Transportation: 0,
    'School Expenses': 0,
    'Personal Needs': 0,
  };

  const totalAllowance = Number(financials.total_allowance || activeCycle?.total_allowance || 0);
  const totalSpentAll = Number(financials.total_spent_all || 0);
  const savingsGoal = Number(financials.savings_goal || activeCycle?.savings_goal || 0);
  const savingsStatus = financials.savings_status || 'intact';
  const totalDays = Number(time.total_days || 7);
  const currentDay = Number(time.current_day || 1);
  const dailyGuide = Number(financials.daily_guide || 0);

  const actualSavedTotal = Number(analytics.actual_saved_total ?? Math.max(0, totalAllowance - totalSpentAll));
  const surplusSavings = Number(analytics.surplus_savings ?? Math.max(0, actualSavedTotal - savingsGoal));
  const tipidStreak = Number(analytics.tipid_streak_days || 0);
  const disciplineRate = Number(analytics.discipline_rate_pct || 100);
  const pacingGrade = analytics.pacing_grade || 'A+';
  const pacingTitle = analytics.pacing_title || 'Diskarte Master';
  const peakSaver = analytics.peak_saver_day || null;
  const heaviestDay = analytics.heaviest_splurge_day || null;

  const savedPct = totalAllowance > 0 ? Math.min(100, Math.round((actualSavedTotal / totalAllowance) * 100)) : 0;
  const spentPct = totalAllowance > 0 ? Math.min(100, Math.round((totalSpentAll / totalAllowance) * 100)) : 0;

  // Category Color Map
  const catColors = {
    Food: '#10B981',
    Transportation: '#0284C7',
    'School Expenses': '#7C3AED',
    'Personal Needs': '#F59E0B',
  };

  // Top spending category leak
  const topCategory = useMemo(() => {
    let maxCat = 'Food';
    let maxVal = 0;
    if (categories && typeof categories === 'object') {
      Object.entries(categories).forEach(([cat, val]) => {
        const num = Number(val || 0);
        if (num > maxVal) {
          maxVal = num;
          maxCat = cat;
        }
      });
    }
    const pct = totalSpentAll > 0 ? Math.round((maxVal / totalSpentAll) * 100) : 0;
    return { name: maxCat, amount: maxVal, pct };
  }, [categories, totalSpentAll]);

  // Precise Cartesian Grid & Max Values
  const chartMetrics = useMemo(() => {
    let maxVal = 100;
    if (Array.isArray(calendarDays)) {
      calendarDays.forEach((d) => {
        const s = Number(d.spent || 0);
        const q = Number(d.quota || 0);
        if (s > maxVal) maxVal = s;
        if (q > maxVal) maxVal = q;
      });
    }

    // Round max to comfortable ceiling
    const ceiling = Math.max(100, Math.ceil(maxVal / 50) * 50 + 20);
    const gridLines = [
      ceiling,
      Math.round(ceiling * 0.75),
      Math.round(ceiling * 0.5),
      Math.round(ceiling * 0.25),
      0,
    ];

    return { ceiling, gridLines };
  }, [calendarDays]);

  // Gently auto-scroll pacing chart to current day on initial load so user sees today immediately
  useEffect(() => {
    if (!pacingScroll.ref.current || !calendarDays || calendarDays.length === 0) return;
    const currentDayIdx = calendarDays.findIndex((d) => d.is_current);
    if (currentDayIdx > 2) {
      const scrollPos = Math.max(0, currentDayIdx * 64 - 120);
      pacingScroll.ref.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [calendarDays]);

  // Copy shareable story text
  const handleCopyStory = () => {
    const text = `I survived my ${totalDays}-day student budget cycle with TipidTayo! \n🔥 ${tipidStreak}-Day Tipid Streak\n💰 ₱${actualSavedTotal.toFixed(2)} Actual Cash Saved (${savedPct}% of allowance)\n🏆 Pacing Grade: ${pacingGrade} (${pacingTitle})\n\nStudent Diskarte with TiPig AI!`;
    navigator.clipboard.writeText(text);
    setCopiedStory(true);
    setTimeout(() => setCopiedStory(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* 1. Header & Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="review-page-header"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.6rem)', fontWeight: 900, color: 'var(--green-900)', margin: 0 }}>
              Weekly Review & Diskarte Dashboard
            </h2>
          </div>
          <p style={{ fontSize: 'clamp(0.78rem, 2.2vw, 0.86rem)', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Visual pacing analytics, tipid streaks, physical cash growth, and peer community diskarte.
          </p>
        </div>

        <div className="review-top-actions">
          {/* Tipid Flame Streak Data Pill (Compact, proportionate, and clean) */}
          <div className="review-streak-pill">
            <Flame size={15} color="#D97706" />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400E' }}>
              {tipidStreak} {tipidStreak === 1 ? 'Day' : 'Days'} Safe
            </span>
          </div>

          {/* Celebrate & Conclude Cycle Button (Compact, mobile-ergonomic) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerConfetti();
              setShowGraduationModal(true);
            }}
            className="btn-primary review-conclude-btn"
          >
            <Award size={15} />
            <span>Conclude Cycle</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Dual-Mood Evaluation Hero Card (Centered on Mobile Portrait with Celebration Aesthetics) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card review-hero-card"
        style={{
          background:
            savingsStatus === 'exhausted' || savingsStatus === 'partially_used'
              ? 'linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%)'
              : 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)',
          color: '#FFFFFF',
          padding: '28px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="review-hero-mascot">
          <TiPig
            state={
              savingsStatus === 'exhausted'
                ? 'peligro'
                : savingsStatus === 'partially_used'
                ? 'warning'
                : actualSavedTotal > 0
                ? 'celebrating'
                : 'safe'
            }
            size={120}
          />
        </div>

        <div className="review-hero-content">
          <div className="review-hero-badges">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: 'var(--gold-300)',
                fontSize: '0.78rem',
                fontWeight: 800,
              }}
            >
              <Award size={14} color="var(--gold-400)" />
              <span>Pacing Status: Grade {pacingGrade} ({pacingTitle})</span>
            </div>
            <span style={{ fontSize: '0.76rem', color: '#A5D6A7', fontWeight: 600 }}>
              Day {currentDay} of {totalDays}
            </span>
          </div>

          <h3 className="review-hero-title">
            {savingsStatus === 'exhausted'
              ? 'Caution: Target Savings Were Consumed This Cycle'
              : savingsStatus === 'partially_used'
              ? 'Heads Up: Target Savings Was Partially Tapped'
              : actualSavedTotal >= savingsGoal
              ? 'Outstanding Diskarte! Target Savings 100% Preserved'
              : 'Cycle On Track: Keep Up The Pacing!'}
          </h3>

          <p className="review-hero-desc">
            {savingsStatus === 'exhausted'
              ? `Overspending on non-essentials depleted your ₱${savingsGoal.toFixed(2)} Target Savings. Every budget cycle is a learning step. Check your top spending pit below and leverage our Community Emergency Hacks to bounce back next cycle!`
              : savingsStatus === 'partially_used'
              ? `You used ₱${Number(financials.savings_used || 0).toFixed(2)} of your ₱${savingsGoal.toFixed(2)} savings goal. You still preserved ₱${actualSavedTotal.toFixed(2)} in cash. Separate this remaining cash into your physical alkansya right now!`
              : actualSavedTotal > 0
              ? `Brilliant discipline! You successfully ring-fenced your ₱${savingsGoal.toFixed(2)} Target Savings and generated ₱${surplusSavings.toFixed(2)} in surplus baon, saving a total of ₱${actualSavedTotal.toFixed(2)} (${savedPct}% of allowance). Ready to park this physical cash?`
              : 'Your allowance has been completely consumed. Review your category breakdown below to optimize your next cycle.'}
          </p>

          <div className="review-hero-cta">
            <Link
              to="/diskarte"
              className="btn-gold"
              style={{
                padding: '9px 18px',
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <Lightbulb size={16} /> Diskarte Hub & Cash Action →
            </Link>
            {actualSavedTotal > 0 && (
              <button
                onClick={triggerConfetti}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
              >
                🎉 Confetti Burst
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 3. Vital Stats Scorecard Bento (4 Clean High-Legibility Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '14px' }}>
        {/* Card 1: Tipid Streak & Pacing Rate */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="card review-stat-card"
          style={{ padding: '20px', borderLeft: '4px solid #D97706' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>
              Tipid Streak & Pacing
            </span>
            <Flame size={18} color="#D97706" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--green-950)', marginTop: '4px' }}>
            {tipidStreak} {tipidStreak === 1 ? 'Day Safe' : 'Days Safe'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            {disciplineRate.toFixed(1)}% of days under daily quota
          </span>
        </motion.div>

        {/* Card 2: Physical Cash Saved */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="card review-stat-card"
          style={{ padding: '20px', backgroundColor: '#F0FDF4', border: '1.5px solid var(--green-400)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--green-900)', textTransform: 'uppercase' }}>
              Actual Saved Balance
            </span>
            <PiggyBank size={18} color="var(--green-700)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--green-800)', marginTop: '4px' }}>
            ₱{actualSavedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--green-700)', fontWeight: 700, display: 'block', marginTop: '2px' }}>
            {savedPct}% of allowance preserved ({surplusSavings > 0 ? `+₱${surplusSavings.toFixed(2)} surplus` : 'Target met'})
          </span>
        </motion.div>

        {/* Card 3: Peak Saver vs Heaviest Day */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="card review-stat-card"
          style={{ padding: '20px' }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Best Saving Day
          </span>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--green-950)', marginTop: '4px' }}>
            {peakSaver ? `Day ${peakSaver.day_number} (+₱${Number(peakSaver.saved_amount || 0).toFixed(2)})` : 'None yet'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
            {heaviestDay ? `Heaviest Day: Day ${heaviestDay.day_number} (₱${Number(heaviestDay.spent_amount || 0).toFixed(2)})` : 'Even pacing'}
          </span>
        </motion.div>

        {/* Card 4: Total Spent vs Allowance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="card review-stat-card"
          style={{ padding: '20px' }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Expenses Logged
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: spentPct > 80 ? 'var(--status-danger)' : 'var(--green-950)', marginTop: '4px' }}>
            ₱{totalSpentAll.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
            {spentPct}% of ₱{totalAllowance.toFixed(2)} total allowance
          </span>
        </motion.div>
      </div>

      {/* 4. Professional Cartesian Day-by-Day Graph with Background Grid & Aligned Quota Line */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card"
        style={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--green-700)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--green-950)', margin: 0 }}>
                Day-by-Day Pacing Graph (Quota vs Actual Spend)
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Compare how your daily food & casual spending fared against your safe-to-spend limit. Click any bar to inspect daily expenses.
            </p>
          </div>

          {/* Clean Legend (No confusing clickable pill styles) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#10B981' }} />
              <span>Under Quota (Saved)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#EF4444' }} />
              <span>Overspent</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#F59E0B' }} />
              <span>Today</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '14px', height: '2px', backgroundColor: '#16A34A', borderTop: '2px dashed #16A34A' }} />
              <span>Daily Quota</span>
            </span>
          </div>
        </div>

        {/* Horizontal Drag-to-Scroll & Navigation Bar */}
        <div className="chart-controls-bar">
          <div className="chart-hint-pill">
            <MoveHorizontal size={14} color="var(--green-700)" />
            <span>Slide or drag horizontally to inspect all {calendarDays.length} days</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => pacingScroll.scrollByAmount(-180)}
              disabled={!pacingScroll.canScrollLeft}
              className="chart-nav-btn"
              title="Slide to earlier days"
              aria-label="Slide to earlier days"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => pacingScroll.scrollByAmount(180)}
              disabled={!pacingScroll.canScrollRight}
              className="chart-nav-btn"
              title="Slide to later days"
              aria-label="Slide to later days"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Complete Cartesian Chart Container with Drag-to-Scroll & Touch Navigation */}
        <div
          ref={pacingScroll.ref}
          {...pacingScroll.events}
          className="chart-scroll-container"
          style={{ width: '100%', paddingBottom: '12px' }}
        >
          <div style={{ minWidth: `${Math.max(calendarDays.length * 64, 540)}px`, position: 'relative', height: '260px', display: 'flex' }}>
            {/* Left Y-Axis Labels Column */}
            <div
              style={{
                width: '60px',
                height: '210px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingRight: '10px',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 700,
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              {chartMetrics.gridLines.map((gl, i) => (
                <span key={i}>₱{gl}</span>
              ))}
            </div>

            {/* Chart Body: Gridlines + Bars */}
            <div style={{ flex: 1, position: 'relative', height: '210px' }}>
              {/* Horizontal Background Grid Lines */}
              {chartMetrics.gridLines.map((gl, i) => {
                const yPct = ((chartMetrics.ceiling - gl) / chartMetrics.ceiling) * 100;
                return (
                  <div
                    key={`line-${i}`}
                    style={{
                      position: 'absolute',
                      top: `${yPct}%`,
                      left: 0,
                      right: 0,
                      height: '1px',
                      backgroundColor: gl === 0 ? 'var(--border-light)' : '#F1F5F9',
                      borderTop: gl === 0 ? '1.5px solid #CBD5E1' : '1px dashed #E2E8F0',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                );
              })}

              {/* Continuous Reference Quota Line */}
              {dailyGuide > 0 && dailyGuide <= chartMetrics.ceiling && (
                <div
                  style={{
                    position: 'absolute',
                    top: `${((chartMetrics.ceiling - dailyGuide) / chartMetrics.ceiling) * 100}%`,
                    left: 0,
                    right: 0,
                    height: '2px',
                    borderTop: '2px dashed #16A34A',
                    zIndex: 3,
                    pointerEvents: 'none',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '-18px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#15803D',
                      backgroundColor: '#DCFCE7',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    Daily Quota ₱{dailyGuide.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Day Bars Grid */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  zIndex: 2,
                }}
              >
                {calendarDays.map((d) => {
                  const spent = Number(d.spent || 0);
                  const quota = Number(d.quota || dailyGuide || 1);
                  const isOver = spent > quota;
                  const isToday = d.is_current;
                  const isFuture = d.is_future;
                  const isPast = d.is_past;

                  // Precise height calculation
                  const barHeightPct = Math.min(100, Math.max(spent > 0 ? 8 : 0, (spent / chartMetrics.ceiling) * 100));
                  const isSelected = selectedDay?.day_number === d.day_number;

                  return (
                    <div
                      key={d.day_number}
                      onClick={() => {
                        if (pacingScroll.hasMoved.current) return;
                        setSelectedDay(d);
                      }}
                      style={{
                        flex: 1,
                        maxWidth: '70px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '0 4px',
                        position: 'relative',
                      }}
                    >
                      {/* Amount Label Above Bar (ALWAYS VISIBLE for all past & active days!) */}
                      <div
                        style={{
                          marginBottom: '4px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: isToday
                            ? '#D97706'
                            : isFuture
                            ? 'var(--text-muted)'
                            : isOver
                            ? '#DC2626'
                            : 'var(--green-800)',
                        }}
                      >
                        {isFuture ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>--</span>
                        ) : (
                          `₱${Number(spent).toFixed(2)}`
                        )}
                      </div>

                      {/* Bar Pillar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: isFuture ? '6px' : `${barHeightPct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{
                          width: '100%',
                          minHeight: isFuture ? '6px' : spent > 0 ? '8px' : '4px',
                          borderRadius: '8px 8px 2px 2px',
                          backgroundColor: isToday
                            ? '#F59E0B'
                            : isFuture
                            ? '#E2E8DF'
                            : isOver
                            ? '#EF4444'
                            : '#10B981',
                          boxShadow: isSelected
                            ? '0 0 0 3px var(--green-700), 0 4px 12px rgba(0,0,0,0.15)'
                            : isToday
                            ? '0 2px 8px rgba(245, 158, 11, 0.3)'
                            : 'none',
                          transition: 'box-shadow 0.2s',
                        }}
                      />

                      {/* Day Label & Date Below Baseline */}
                      <div style={{ position: 'absolute', top: '216px', textAlign: 'center', width: '100%' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: isToday ? 900 : 700,
                            color: isToday ? '#B45309' : 'var(--green-950)',
                            display: 'block',
                          }}
                        >
                          D{d.day_number}
                        </span>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginTop: '-2px' }}>
                          {d.formatted_date ? d.formatted_date.split(' ')[0] : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Day Inspector Drawer */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginTop: '20px' }}
            >
              <div
                style={{
                  padding: '18px',
                  backgroundColor: '#F9FBF9',
                  borderRadius: '16px',
                  border: '1.5px solid var(--green-300)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="var(--green-800)" />
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green-950)', margin: 0 }}>
                      Day {selectedDay.day_number} Inspection ({selectedDay.formatted_date})
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Daily Quota Target</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--green-900)' }}>
                      ₱{Number(selectedDay.quota || dailyGuide).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Amount Spent</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: selectedDay.spent > selectedDay.quota ? 'var(--status-danger)' : 'var(--green-700)' }}>
                      ₱{Number(selectedDay.spent || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Daily Net Margin</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: Number(selectedDay.quota || 0) >= Number(selectedDay.spent || 0) ? 'var(--green-800)' : 'var(--status-danger)' }}>
                      {Number(selectedDay.quota || 0) >= Number(selectedDay.spent || 0)
                        ? `+₱${(Number(selectedDay.quota || 0) - Number(selectedDay.spent || 0)).toFixed(2)} saved`
                        : `-₱${(Number(selectedDay.spent || 0) - Number(selectedDay.quota || 0)).toFixed(2)} over`}
                    </div>
                  </div>
                </div>

                {/* Expenses Logged on this day */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Purchases Logged on Day {selectedDay.day_number}:
                  </span>
                  {selectedDay.expenses && selectedDay.expenses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedDay.expenses.map((exp) => (
                        <div
                          key={exp.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--green-950)' }}>{exp.title}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                              ({exp.category})
                            </span>
                          </div>
                          <span style={{ fontWeight: 800, color: 'var(--green-900)' }}>
                            ₱{Number(exp.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No expenses logged on this day. 100% of the daily quota was preserved and rolled over!
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 5. Category Donut Visualizer & Spending Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card"
        style={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--green-950)', margin: 0 }}>
              Where Did Your Baon Go? (Category Breakdown)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Identifies your largest spending bucket to optimize your allocation for the upcoming cycle.
            </p>
          </div>

          {topCategory.amount > 0 && (
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: '#FEF3C7',
                borderRadius: '10px',
                border: '1px solid #FDE68A',
                fontSize: '0.78rem',
                color: '#92400E',
                fontWeight: 700,
              }}
            >
              Top Money Pit: <strong>{topCategory.name}</strong> ({topCategory.pct}% of spending)
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'center' }}>
          {/* Proportional Segmented Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                height: '14px',
                backgroundColor: '#E2E8DF',
                borderRadius: '9999px',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              {(categories && typeof categories === 'object' ? Object.entries(categories) : []).map(([cat, amt]) => {
                const num = Number(amt || 0);
                const pct = totalSpentAll > 0 ? (num / totalSpentAll) * 100 : 0;
                return (
                  <motion.div
                    key={cat}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      backgroundColor: catColors[cat] || '#10B981',
                    }}
                    title={`${cat}: ₱${num.toFixed(2)} (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {(categories && typeof categories === 'object' ? Object.entries(categories) : []).map(([cat, amt]) => (
                <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: catColors[cat] }} />
                  {cat}: {totalSpentAll > 0 ? Math.round((Number(amt) / totalSpentAll) * 100) : 0}%
                </span>
              ))}
            </div>
          </div>

          {/* Category Progress Bars with Counting Numbers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(categories && typeof categories === 'object' ? Object.entries(categories) : []).map(([cat, amt]) => {
              const num = Number(amt || 0);
              const pct = totalSpentAll > 0 ? Math.round((num / totalSpentAll) * 100) : 0;
              const color = catColors[cat] || 'var(--green-600)';

              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--green-950)' }}>
                      {cat}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--green-900)', fontSize: '0.88rem' }}>
                        ₱{num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '35px', textAlign: 'right' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  <div style={{ height: '7px', backgroundColor: '#E2E8DF', borderRadius: '9999px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        backgroundColor: color,
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 6. Multi-Cycle Historical Trends & Savings Projections Line Graph */}
      <MultiCycleSavingsLineChart activeCycleId={activeCycle?.id} />

      {/* 7. Action Gateway Banner: Diskarte & Long-Term Growth Hub */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card review-gateway-card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          borderRadius: '20px',
          border: '1.5px solid #86EFAC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 16px rgba(22, 163, 74, 0.08)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#15803D',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              backgroundColor: '#FFFFFF',
              padding: '3px 8px',
              borderRadius: '9999px',
              border: '1px solid #BBF7D0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Lightbulb size={12} />
            Decision-Making & Peer Community Hub
          </span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--green-950)', margin: '8px 0 0 0' }}>
            Ready to Protect & Grow Your ₱{actualSavedTotal.toFixed(2)} Physical Savings?
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--green-900)', margin: '4px 0 0 0', maxWidth: '640px', lineHeight: 1.45 }}>
            Head over to the <strong>Diskarte Hub</strong> to consult the in-place <strong>TiPig Wealth Compass</strong>, perform the physical Alkansya drop ritual, explore student digital banks (4–10% p.a.), or read budget hacks from the Community Wall.
          </p>
        </div>

        <Link
          to="/diskarte"
          className="btn-primary"
          style={{
            padding: '12px 22px',
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <Lightbulb size={16} /> Open Diskarte Hub <ArrowRight size={16} />
        </Link>
      </motion.div>


      {/* 8. Modal: Cycle Graduation & Shareable Diskarte Card */}
      <AnimatePresence>
        {showGraduationModal && (
          <div
            className="mobile-fullscreen-modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card mobile-fullscreen-modal-card"
              style={{
                width: '100%',
                maxWidth: '460px',
                padding: '26px',
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowGraduationModal(false)}
                  style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Shareable Card Canvas Preview */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #093824 0%, #062618 100%)',
                  color: '#FFFFFF',
                  marginBottom: '18px',
                  boxShadow: '0 8px 24px rgba(6, 38, 24, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <TiPig state="celebrating" size={90} />
                </div>

                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--gold-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  TipidTayo Cycle Graduate
                </span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: '4px 0' }}>
                  {activeCycle?.label || 'Budget Cycle'}
                </h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold-400)', margin: '8px 0' }}>
                  ₱{actualSavedTotal.toFixed(2)} Saved
                </div>
                <span style={{ fontSize: '0.78rem', color: '#A5D6A7' }}>
                  {savedPct}% of allowance preserved across {totalDays} days
                </span>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#E8F5E9' }}>
                    🔥 {tipidStreak}-Day Streak
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gold-400)', fontWeight: 800 }}>
                    Grade {pacingGrade}
                  </span>
                </div>
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-950)', margin: '0 0 6px 0' }}>
                Cycle Completed Successfully!
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 16px 0' }}>
                Your physical cash is in your hands. Segregate it now, then set up your upcoming allowance with your new rollover seed!
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleCopyStory}
                  className="btn-secondary"
                  style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <Share2 size={16} /> {copiedStory ? 'Story Text Copied!' : 'Copy Story Text (Brag to Friends)'}
                </button>

                <button
                  onClick={() => {
                    setShowGraduationModal(false);
                    navigate('/allowance');
                  }}
                  className="btn-primary"
                  style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <ArrowRight size={16} /> Setup Next Budget Cycle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeeklyReviewPage;
