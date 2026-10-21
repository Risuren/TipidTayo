import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Trash2,
  PiggyBank,
  Wallet,
  Calendar,
  Compass,
  Info,
  Clock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { SolarChatRoundDots } from '../../components/common/SolarIcons';
import TiPig from '../../components/mascot/TiPig';
import QuoteBubble from '../../components/mascot/QuoteBubble';
import api from '../../api/axios';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();
  const { user, refreshUser, refreshDashboard } = useAuth();

  // Restore existing draft from localStorage if present
  const getDraft = () => {
    try {
      const saved = localStorage.getItem('tipidtayo_onboarding_draft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  const draft = getDraft();

  const [step, setStep] = useState(draft?.step || 1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [allowance, setAllowance] = useState(draft?.allowance || '1500');
  const [days, setDays] = useState(draft?.days || '7');
  const [isCustomDays, setIsCustomDays] = useState(draft?.isCustomDays || false);
  const [customDaysValue, setCustomDaysValue] = useState(draft?.customDaysValue || '10');
  const [startDate, setStartDate] = useState(
    draft?.startDate || new Date().toLocaleDateString('en-CA')
  );
  const [savingsGoal, setSavingsGoal] = useState(draft?.savingsGoal || '150');

  // Vaults: ZERO default items by design so users don't unintentionally save dummy presets!
  const [reserves, setReserves] = useState(draft?.reserves || []);

  // Mid-cycle past spending state
  const [hasPastSpent, setHasPastSpent] = useState(draft?.hasPastSpent ?? false);
  const [pastSpent, setPastSpent] = useState(draft?.pastSpent || '');
  const [pastSpentNote, setPastSpentNote] = useState(draft?.pastSpentNote || '');

  // Reserve input for adding new item
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Food');
  const [newAmount, setNewAmount] = useState('');

  // Persist draft on any input change
  useEffect(() => {
    localStorage.setItem(
      'tipidtayo_onboarding_draft',
      JSON.stringify({
        step,
        allowance,
        days,
        isCustomDays,
        customDaysValue,
        startDate,
        savingsGoal,
        reserves,
        hasPastSpent,
        pastSpent,
        pastSpentNote,
      })
    );
  }, [
    step,
    allowance,
    days,
    isCustomDays,
    customDaysValue,
    startDate,
    savingsGoal,
    reserves,
    hasPastSpent,
    pastSpent,
    pastSpentNote,
  ]);

  // Calendar & Mid-Cycle Date Math
  const todayStr = new Date().toLocaleDateString('en-CA');
  const isPastStart = Boolean(startDate && startDate < todayStr);

  let daysElapsed = 0;
  if (isPastStart) {
    const sDate = new Date(startDate);
    const tDate = new Date(todayStr);
    const diffMs = tDate - sDate;
    daysElapsed = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Active duration
  const effectiveDays = isCustomDays
    ? parseInt(customDaysValue) || 1
    : parseInt(days) || 1;
  const currentDayNumber = isPastStart ? Math.min(effectiveDays, daysElapsed + 1) : 1;
  const remainingDays = Math.max(1, effectiveDays - currentDayNumber + 1);

  // Past spent amount
  const numPastSpent = isPastStart && hasPastSpent ? parseFloat(pastSpent) || 0 : 0;

  // Math computations
  const numAllowance = parseFloat(allowance) || 0;
  const numSavings = parseFloat(savingsGoal) || 0;
  const numReserves = reserves.reduce((acc, r) => acc + (parseFloat(r.allocated_amount) || 0), 0);

  // Spendable pool after past expenses, vaults, and target savings
  const freeSpendable = Math.max(0, numAllowance - numReserves - numSavings - numPastSpent);
  const dailyGuide = remainingDays > 0 ? freeSpendable / remainingDays : 0;

  const handleAddReserve = () => {
    if (!newTitle.trim() || !newAmount || parseFloat(newAmount) <= 0) return;
    setReserves([
      ...reserves,
      {
        title: newTitle.trim(),
        category: newCategory,
        allocated_amount: newAmount,
        is_optional: false,
      },
    ]);
    setNewTitle('');
    setNewAmount('');
  };

  const handleRemoveReserve = (index) => {
    setReserves(reserves.filter((_, i) => i !== index));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4CAF50', '#F59E0B', '#2E7D32', '#FBBF24'],
    });
  };

  // Step 3 Next validation: Prompt if an unsaved vault entry is typed in the inputs
  const handleProceedFromStep3 = async () => {
    const trimmedTitle = newTitle.trim();
    const parsedAmount = parseFloat(newAmount);
    const hasDraftEntry = Boolean(trimmedTitle || (newAmount && parsedAmount > 0));

    if (hasDraftEntry) {
      if (!trimmedTitle || isNaN(parsedAmount) || parsedAmount <= 0) {
        await showAlert({
          title: 'Incomplete Vault Entry',
          message: 'You have an unfinished vault entry. Please enter both a title and an amount greater than ₱0, or clear the fields before proceeding.',
          type: 'gold',
        });
        return;
      }

      // Prompt confirmation to include in budget
      const shouldInclude = await showConfirm({
        title: 'Include Vault in Computation?',
        message: `You entered "${trimmedTitle}" for ₱${parsedAmount.toFixed(2)} (${newCategory}), but haven't clicked the "+" button yet. Would you like to include this vault in your budget computation?`,
        confirmText: 'Yes, Include in Budget',
        cancelText: 'Cancel & Let Me Edit',
        type: 'gold',
        badge: 'Unsaved Vault Entry',
        details: {
          vault_title: trimmedTitle,
          category: newCategory,
          amount_to_reserve: `₱${parsedAmount.toFixed(2)}`,
        },
      });

      if (!shouldInclude) {
        // User clicked Cancel to stay on Step 3 and edit
        return;
      }

      // Add to reserves and clear input fields
      setReserves((prev) => [
        ...prev,
        {
          title: trimmedTitle,
          category: newCategory,
          allocated_amount: newAmount,
          is_optional: false,
        },
      ]);
      setNewTitle('');
      setNewAmount('');
    }

    setStep(4);
    triggerConfetti();
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.post('/onboarding/complete', {
        total_allowance: numAllowance,
        total_days: effectiveDays,
        start_date: startDate,
        savings_goal: numSavings,
        reserves: reserves.map((r) => ({
          title: r.title,
          category: r.category,
          allocated_amount: parseFloat(r.allocated_amount),
          is_optional: false,
        })),
        past_spent_amount: isPastStart && hasPastSpent ? numPastSpent : 0,
        past_spent_note: isPastStart && hasPastSpent ? pastSpentNote : null,
      });

      // Clear draft on successful completion
      localStorage.removeItem('tipidtayo_onboarding_draft');

      await refreshUser();
      await refreshDashboard();
      navigate('/daily-limit');
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      await showAlert({
        title: 'Unable to Save Onboarding',
        message: 'Please verify your allowance, days, and reserve allocations, then try again.',
        type: 'gold',
      });
    } finally {
      setLoading(false);
    }
  };

  // Preset Cycle Options including 5-day school week, 10-day 2 school weeks, 14, 15, and 30 days
  const cyclePresets = [
    { val: '5', label: '5 Days', sub: '1 School Week (M-F)' },
    { val: '7', label: '7 Days', sub: '1 Full Week' },
    { val: '10', label: '10 Days', sub: '2 School Weeks' },
    { val: '14', label: '14 Days', sub: '2 Full Weeks' },
    { val: '15', label: '15 Days', sub: 'Quincena (1/2 Mo)' },
    { val: '30', label: '30 Days', sub: '1 Month' },
  ];

  return (
    <div
      className="onboarding-container"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-page)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 48px 16px',
      }}
    >
      {/* Top Progress Track */}
      <div style={{ width: '100%', maxWidth: '640px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Setup Step {step} of 4
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {step === 1 && 'Meet TiPig'}
            {step === 2 && 'Allowance & Schedule'}
            {step === 3 && 'Reserved Vaults'}
            {step === 4 && 'Ready to Start'}
          </span>
        </div>
        <div style={{ height: '10px', backgroundColor: '#E2E8DF', borderRadius: '9999px', overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', backgroundColor: 'var(--green-600)', borderRadius: '9999px' }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Main Wizard Card */}
      <div
        className="onboarding-card"
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          padding: '32px 28px',
        }}
      >
        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME SLIDE */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
            >
              <TiPig state="safe" size={typeof window !== 'undefined' && window.innerWidth < 640 ? 100 : 145} />
              <div style={{ marginTop: '14px', maxWidth: '480px' }}>
                <QuoteBubble
                  text={`Hello, ${user?.name || 'Friend'}! I am TiPig, your student piggy bank companion. I'll help you budget your allowance so you never run out of baon!`}
                  mood="safe"
                />
              </div>

              <div
                className="onboarding-step1-pillars"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '10px',
                  width: '100%',
                  marginTop: '22px',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '12px', backgroundColor: 'var(--green-50)', borderRadius: '14px', border: '1px solid var(--green-200)' }}>
                  <ShieldCheck size={20} color="var(--green-700)" style={{ marginBottom: '4px' }} />
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--green-900)' }}>Protected Vaults</h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Lock transit & projects in advance.</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--gold-50)', borderRadius: '14px', border: '1px solid var(--gold-400)' }}>
                  <Wallet size={20} color="var(--gold-600)" style={{ marginBottom: '4px' }} />
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400E' }}>Daily Limit Guide</h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Live safe-to-spend quota every day.</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#EEF2FF', borderRadius: '14px', border: '1px solid #C7D2FE' }}>
                  <SolarChatRoundDots size={20} color="var(--ai-indigo)" style={{ marginBottom: '4px' }} />
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3730A3' }}>AI Companion</h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Quick taglish logging & Kaya ba? check.</p>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="btn-primary"
                style={{ marginTop: '24px', width: '100%', padding: '14px', fontSize: '0.96rem' }}
              >
                Start Setup <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: ALLOWANCE & SCHEDULE */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--green-900)' }}>
                  Total Allowance & Schedule
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Set your cycle funds, duration, and target savings.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Total Allowance Input with Presets */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Total Allowance (₱)</label>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Tap quick preset:</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: 'var(--gold-600)', fontSize: '1.15rem' }}>
                      ₱
                    </span>
                    <input
                      type="number"
                      value={allowance}
                      onChange={(e) => setAllowance(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '36px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--green-900)' }}
                      placeholder="1500"
                    />
                  </div>
                  {/* Preset Pills in Single Clean Swipeable Strip */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      marginTop: '8px',
                      overflowX: 'auto',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none',
                    }}
                  >
                    {['500', '1000', '1500', '2000', '3000'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAllowance(preset)}
                        className={`badge-pill ${allowance === preset ? 'badge-gold' : ''}`}
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          border: '1px solid var(--border-light)',
                          flexShrink: 0,
                          backgroundColor: allowance === preset ? 'var(--gold-100)' : '#FFFFFF',
                          color: allowance === preset ? '#92400E' : 'var(--text-secondary)',
                        }}
                      >
                        ₱{Number(preset).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration in Days (Clean Compact Segmented Chips) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Cycle Duration</label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green-800)' }}>
                      {effectiveDays} {effectiveDays === 1 ? 'Day' : 'Days Total'}
                    </span>
                  </div>
                  
                  {/* Compact Duration Chips (Preserves All Options Without Clutter) */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {cyclePresets.map((opt) => {
                      const isSelected = !isCustomDays && days === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            setIsCustomDays(false);
                            setDays(opt.val);
                          }}
                          className={`badge-pill ${isSelected ? 'badge-gold' : ''}`}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: isSelected ? '1.5px solid var(--gold-500)' : '1px solid var(--border-light)',
                            backgroundColor: isSelected ? 'var(--gold-100)' : '#FFFFFF',
                            color: isSelected ? '#92400E' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setIsCustomDays(true)}
                      className={`badge-pill ${isCustomDays ? 'badge-gold' : ''}`}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: isCustomDays ? '1.5px solid var(--gold-500)' : '1px solid var(--border-light)',
                        backgroundColor: isCustomDays ? 'var(--gold-100)' : '#FFFFFF',
                        color: isCustomDays ? '#92400E' : 'var(--text-secondary)',
                      }}
                    >
                      + Custom
                    </button>
                  </div>

                  {/* Active Duration Note */}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                    {!isCustomDays
                      ? (cyclePresets.find((c) => c.val === days)?.sub || `${days} Days`)
                      : 'Type your custom cycle duration below:'}
                  </div>

                  {/* Custom Days Input Field when Selected */}
                  {isCustomDays && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{ marginTop: '8px' }}
                    >
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={customDaysValue}
                          onChange={(e) => setCustomDaysValue(e.target.value)}
                          className="form-input"
                          style={{ paddingLeft: '38px', fontWeight: 800, color: 'var(--green-900)', fontSize: '0.9rem' }}
                          placeholder="Number of days (e.g. 4)"
                        />
                        <Calendar size={18} color="var(--gold-600)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Start Date (Fixes Image 1: Quick Pills placed in Label row, Date input full width) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Cycle Start Date</label>
                      <span
                        title="Select when your budget cycle begins. TipidTayo counts full calendar days from 12:00 AM of this date."
                        style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}
                      >
                        <Info size={13} />
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setStartDate(todayStr)}
                        className={`badge-pill ${startDate === todayStr ? 'badge-gold' : ''}`}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          border: '1px solid var(--border-light)',
                          backgroundColor: startDate === todayStr ? 'var(--gold-100)' : '#FFFFFF',
                          color: startDate === todayStr ? '#92400E' : 'var(--text-secondary)',
                        }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const y = new Date();
                          y.setDate(y.getDate() - 1);
                          setStartDate(y.toLocaleDateString('en-CA'));
                        }}
                        className={`badge-pill ${startDate !== todayStr && startDate === new Date(Date.now() - 86400000).toLocaleDateString('en-CA') ? 'badge-gold' : ''}`}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          border: '1px solid var(--border-light)',
                          backgroundColor: startDate !== todayStr && startDate === new Date(Date.now() - 86400000).toLocaleDateString('en-CA') ? 'var(--gold-100)' : '#FFFFFF',
                          color: startDate !== todayStr && startDate === new Date(Date.now() - 86400000).toLocaleDateString('en-CA') ? '#92400E' : 'var(--text-secondary)',
                        }}
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>

                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', fontSize: '0.92rem' }}
                  />
                </div>

                {/* Mid-Cycle Detection Box (ONLY SHOWN IF startDate < today) */}
                {isPastStart && daysElapsed > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--gold-50)',
                      border: '1.5px solid var(--gold-400)',
                      borderRadius: '18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <Clock size={20} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400E' }}>
                          Mid-Cycle Start Detected (Started {daysElapsed} {daysElapsed === 1 ? 'day' : 'days'} ago)
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#B45309', marginTop: '2px', lineHeight: 1.4 }}>
                          Since your cycle started on {startDate}, today is already <strong>Day {currentDayNumber}</strong> of {effectiveDays}. Have you already spent any of your ₱{numAllowance.toLocaleString()} allowance before today?
                        </p>

                        {/* Choice Pills */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setHasPastSpent(false);
                              setPastSpent('');
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              borderRadius: '12px',
                              border: !hasPastSpent ? '2px solid var(--green-600)' : '1px solid var(--border-light)',
                              backgroundColor: !hasPastSpent ? 'var(--green-50)' : '#FFFFFF',
                              color: !hasPastSpent ? 'var(--green-900)' : 'var(--text-secondary)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            No, full allowance untouched
                          </button>
                          <button
                            type="button"
                            onClick={() => setHasPastSpent(true)}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              borderRadius: '12px',
                              border: hasPastSpent ? '2px solid var(--gold-500)' : '1px solid var(--border-light)',
                              backgroundColor: hasPastSpent ? '#FFFFFF' : '#FFFFFF',
                              color: hasPastSpent ? '#92400E' : 'var(--text-secondary)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Yes, I spent some money
                          </button>
                        </div>

                        {/* If user spent money before today */}
                        {hasPastSpent && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ marginTop: '12px' }}
                          >
                            <label className="form-label" style={{ fontSize: '0.78rem', color: '#92400E' }}>
                              Total Amount Spent Before Today (₱)
                            </label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--gold-600)' }}>
                                ₱
                              </span>
                              <input
                                type="number"
                                value={pastSpent}
                                onChange={(e) => setPastSpent(e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '32px', fontSize: '0.95rem', fontWeight: 800 }}
                                placeholder="e.g. 250"
                              />
                            </div>
                            <input
                              type="text"
                              value={pastSpentNote}
                              onChange={(e) => setPastSpentNote(e.target.value)}
                              className="form-input"
                              style={{ marginTop: '6px', fontSize: '0.8rem' }}
                              placeholder="Optional note: e.g. Jeep fare & snacks for Day 1"
                            />
                            {numPastSpent > 0 && (
                              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--green-900)', fontWeight: 600 }}>
                                TiPig will deduct ₱{numPastSpent.toFixed(2)} so your remaining {remainingDays} days quota starts accurately!
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Savings Goal */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Target Savings Goal (₱)</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0.05, 0.1, 0.15, 0.2].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            const calculated = Math.round(numAllowance * pct);
                            setSavingsGoal(String(calculated));
                          }}
                          className="badge-pill"
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            border: '1px solid var(--border-light)',
                            backgroundColor: savingsGoal === String(Math.round(numAllowance * pct)) ? 'var(--gold-100)' : '#FFFFFF',
                            color: savingsGoal === String(Math.round(numAllowance * pct)) ? '#92400E' : 'var(--text-secondary)',
                          }}
                        >
                          {pct * 100}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--gold-600)' }}>
                      ₱
                    </span>
                    <input
                      type="number"
                      value={savingsGoal}
                      onChange={(e) => setSavingsGoal(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '34px', fontSize: '1rem', fontWeight: 700 }}
                      placeholder="150"
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Protected upfront and excluded from daily spending baon.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={() => setStep(3)} className="btn-primary" disabled={numAllowance <= 0} style={{ padding: '10px 20px' }}>
                  Next: Reserve Essentials <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: RESERVES ALLOCATION */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-900)' }}>
                  Set Aside Fixed Essentials (Vaults)
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Protect your transit fare and school expenses upfront from accidental spending.
                </p>
              </div>

              {/* Live Balance Summary */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  padding: '14px',
                  backgroundColor: 'var(--green-50)',
                  borderRadius: '16px',
                  border: '1px solid var(--green-200)',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Allowance</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-900)' }}>₱{numAllowance.toFixed(2)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Locked Reserves</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: numReserves > 0 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                    ₱{numReserves.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Free Spendable</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-600)' }}>₱{freeSpendable.toFixed(2)}</p>
                </div>
              </div>

              {/* GHOST VAULT BASIS (Shown ONLY when reserves are empty) */}
              {reserves.length === 0 ? (
                <div
                  style={{
                    border: '2px dashed #CBD5E1',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '18px',
                    padding: '20px',
                    position: 'relative',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: '#64748B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94A3B8' }} />
                      Ghost Basis Example (Not Added to Your Budget)
                    </span>
                    <span className="badge-pill" style={{ fontSize: '0.7rem', color: '#64748B', backgroundColor: '#E2E8F0' }}>
                      Template Guide
                    </span>
                  </div>

                  {/* Sample Card Structure to give visual basis */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: '14px',
                      opacity: 0.85,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={18} color="#94A3B8" />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>
                          Weekly Commute (Jeep / Bus / MRT)
                        </span>
                      </div>
                      <span className="badge-pill" style={{ marginTop: '4px', fontSize: '0.7rem', backgroundColor: '#E2E8F0', color: '#475569' }}>
                        Transportation
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, color: '#64748B', fontSize: '1rem' }}>
                        ₱350.00
                      </span>
                      <span style={{ display: 'block', fontSize: '0.68rem', color: '#94A3B8' }}>
                        Example only
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.45 }}>
                    <strong>How Vaults Work:</strong> Vaults lock away essential, non-negotiable money (like weekly fare or project printing) upfront so it doesn't get consumed as everyday snack baon.
                  </p>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setReserves([
                          {
                            title: 'Weekly Commute (Jeep / Bus)',
                            category: 'Transportation',
                            allocated_amount: '350',
                            is_optional: false,
                          },
                        ]);
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '7px 12px' }}
                    >
                      <Plus size={14} /> Adopt Commute Template
                    </button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      or add your own custom vault below, or skip if you have none!
                    </span>
                  </div>
                </div>
              ) : (
                /* User's Active Reserves List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {reserves.map((res, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: '14px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ShieldCheck size={16} color="var(--green-600)" />
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-950)' }}>{res.title}</span>
                        </div>
                        <span className="badge-pill badge-green" style={{ marginTop: '4px', fontSize: '0.7rem' }}>
                          {res.category}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--green-800)', fontSize: '1rem' }}>
                          ₱{Number(res.allocated_amount).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveReserve(idx)}
                          style={{ color: '#EF4444', padding: '4px', cursor: 'pointer' }}
                          title="Remove this vault"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Reserve Form */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#F9FAF6',
                  borderRadius: '16px',
                  border: '1px dashed var(--border-medium)',
                  marginBottom: '24px',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green-900)' }}>
                  + Add Custom Reserve Vault
                </span>
                <div
                  className="onboarding-add-vault-grid"
                  style={{
                    display: 'grid',
                    gap: '8px',
                    marginTop: '10px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Vault Title (e.g. WiFi Load, Dorm Rent)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="form-input onboarding-vault-title"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="form-input onboarding-vault-category"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="Food">Food</option>
                    <option value="Transportation">Transportation</option>
                    <option value="School Expenses">School Expenses</option>
                    <option value="Personal Needs">Personal Needs</option>
                  </select>
                  <input
                    type="number"
                    placeholder="₱ Amount"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="form-input onboarding-vault-amount"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddReserve}
                    className="btn-primary onboarding-vault-btn"
                    style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Add Vault"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(2)} className="btn-secondary">
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedFromStep3}
                  className="btn-primary"
                >
                  Calculate Daily Limit <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: CELEBRATION & DAILY LIMIT REVEAL */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center' }}
            >
              <TiPig state="safe" size={170} />

              <div style={{ marginTop: '20px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--green-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  All Set!
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--green-950)', marginTop: '4px' }}>
                  Here is Your Daily Spending Limit:
                </h3>
              </div>

              {/* Big Gold Metric Card */}
              <div
                style={{
                  margin: '28px 0',
                  padding: '24px',
                  backgroundColor: 'var(--gold-50)',
                  border: '2px solid var(--gold-400)',
                  borderRadius: '24px',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>
                  Safe Daily Allowance
                </span>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--gold-600)', margin: '8px 0' }}>
                  ₱{dailyGuide.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p style={{ fontSize: '0.88rem', color: '#B45309', fontWeight: 600 }}>
                  This is your safe daily spending allowance for the {remainingDays} {remainingDays === 1 ? 'day' : 'remaining days'}{' '}
                  without touching your ₱{numReserves.toFixed(2)} reserved vaults or ₱{numSavings.toFixed(2)} target savings.
                  {numPastSpent > 0 && ` (Includes ₱${numPastSpent.toFixed(2)} deducted from previous days' spending).`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(3)} className="btn-secondary" style={{ flex: 1 }}>
                  <ArrowLeft size={18} /> Adjust
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="btn-gold"
                  style={{ flex: 2, padding: '16px', fontSize: '1.05rem' }}
                >
                  {loading ? 'Preparing Dashboard...' : (
                    <>
                      Enter TipidTayo Dashboard <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
