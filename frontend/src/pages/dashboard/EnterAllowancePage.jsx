import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Calendar,
  PiggyBank,
  Save,
  CheckCircle2,
  Info,
  PlusCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import TiPig from '../../components/mascot/TiPig';
import { AnimatedCounter } from '../../components/common/AnimatedCounter';
import api from '../../api/axios';

export const EnterAllowancePage = () => {
  const { activeCycle, dashboardData, refreshDashboard } = useAuth();
  const { showAlert, confirmAffirmative } = useModal();

  const [label, setLabel] = useState('My Budget Cycle');
  const [allowance, setAllowance] = useState('1500');
  const [days, setDays] = useState('7');
  const [startDate, setStartDate] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('150');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Quick Cash Top-Up (Mid-Cycle Extra Money Inflow)
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('200');
  const [topUpNote, setTopUpNote] = useState('Allowance Padala / Bonus');
  const [submittingTopUp, setSubmittingTopUp] = useState(false);

  useEffect(() => {
    if (activeCycle) {
      setLabel(activeCycle.label || 'My Budget Cycle');
      setAllowance(String(activeCycle.total_allowance || 1500));
      setDays(String(activeCycle.total_days || 7));
      setStartDate(activeCycle.start_date || '');
      setSavingsGoal(String(activeCycle.savings_goal || 0));
    }
  }, [activeCycle]);

  // Financial metrics from active cycle dashboard
  const financials = dashboardData?.financials || {};
  const time = dashboardData?.time || {};
  const currentDay = time.current_day || 1;
  const totalDays = time.total_days || parseInt(days) || 7;
  const remainingDays = time.remaining_days || Math.max(1, totalDays - currentDay + 1);
  const daysLeft = time.days_left !== undefined ? time.days_left : Math.max(0, totalDays - currentDay);
  const currentDailyGuide = Number(financials.daily_guide || 0);
  const currentUnreservedPool = Number(financials.remaining_unreserved || 0);
  const totalReserved = Number(financials.total_reserved || 0);
  const savingsGoalNum = Number(financials.savings_goal || parseFloat(savingsGoal) || 0);

  // Live Projected Math based on form inputs
  const inputAllowance = parseFloat(allowance) || 0;
  const inputDays = parseInt(days) || 1;
  const inputSavings = parseFloat(savingsGoal) || 0;
  const inputRemainingDays = Math.max(1, inputDays - currentDay + 1);

  // Projected new daily limit if saved
  const projectedSpendablePool = Math.max(0, inputAllowance - totalReserved - inputSavings - (financials.total_spent || 0));
  const projectedDailyQuota = inputRemainingDays > 0 ? (projectedSpendablePool / inputRemainingDays) : 0;
  const dailyDiff = projectedDailyQuota - currentDailyGuide;

  // Handle Main Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeCycle) {
      const confirmed = await confirmAffirmative({
        title: 'Update Budget Cycle Settings?',
        message: `Saving these changes will adjust your total cycle funds and duration. Your daily spending quota for the remaining ${remainingDays} days will adjust to ₱${projectedDailyQuota.toFixed(2)}/day.`,
        confirmText: 'Yes, Save Changes',
        cancelText: 'Keep Current',
        badge: 'Recalculate Quotas',
      });
      if (!confirmed) return;
    }

    setSaving(true);
    setSuccessMsg('');

    try {
      if (activeCycle) {
        await api.put(`/budget-cycles/${activeCycle.id}`, {
          label,
          total_allowance: parseFloat(allowance),
          total_days: parseInt(days),
          start_date: startDate || undefined,
          savings_goal: parseFloat(savingsGoal),
        });
      } else {
        await api.post('/budget-cycles', {
          label,
          total_allowance: parseFloat(allowance),
          total_days: parseInt(days),
          start_date: startDate || undefined,
          savings_goal: parseFloat(savingsGoal),
        });
      }

      await refreshDashboard();
      setSuccessMsg('Budget cycle and daily quotas successfully updated!');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      await showAlert({
        title: 'Unable to Save Cycle',
        message: 'Could not update cycle settings. Please verify your inputs and try again.',
        type: 'gold',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Quick Extra Cash Top-Up
  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const addAmt = parseFloat(topUpAmount);
    if (!activeCycle || isNaN(addAmt) || addAmt <= 0) return;

    setSubmittingTopUp(true);
    try {
      const newTotalAllowance = parseFloat(activeCycle.total_allowance) + addAmt;
      const boostPerDay = remainingDays > 0 ? addAmt / remainingDays : addAmt;

      await api.put(`/budget-cycles/${activeCycle.id}`, {
        total_allowance: newTotalAllowance,
      });

      setAllowance(String(newTotalAllowance));
      await refreshDashboard();
      setShowTopUpModal(false);
      setSuccessMsg(
        `Added +₱${addAmt.toFixed(2)} extra cash! Your daily limit for the remaining ${remainingDays} days increased by +₱${boostPerDay.toFixed(2)}/day.`
      );
      setTimeout(() => setSuccessMsg(''), 5500);
    } catch (err) {
      await showAlert({
        title: 'Top-Up Failed',
        message: 'Could not add extra cash. Please check your network connection.',
        type: 'danger',
      });
    } finally {
      setSubmittingTopUp(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header with Quick Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.65rem)', fontWeight: 900, color: 'var(--green-900)' }}>
            Enter Allowance & Mid-Cycle Adjustments
          </h2>
          <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Configure starting allowance, cycle length, or easily log extra cash top-ups mid-cycle.
          </p>
        </div>

        {activeCycle && (
          <button
            type="button"
            onClick={() => setShowTopUpModal(true)}
            className="btn-gold"
            style={{ padding: '12px 20px', fontSize: '0.9rem' }}
          >
            <PlusCircle size={18} /> + Add Extra Cash / Allowance
          </button>
        )}
      </div>

      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--green-50)',
            border: '1.5px solid var(--green-600)',
            color: 'var(--green-950)',
            padding: '14px 18px',
            borderRadius: '16px',
            fontWeight: 700,
            fontSize: '0.92rem',
          }}
        >
          <CheckCircle2 size={20} color="var(--green-600)" style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Live Mid-Cycle Cycle Health Card */}
      {activeCycle && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)',
            border: '2px solid var(--green-200)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--green-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Wallet size={22} color="var(--green-800)" />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--green-700)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                  Active Cycle Progress
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--green-950)', margin: '1px 0 0 0' }}>
                  {activeCycle.label || 'Current Cycle'}
                </h3>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Today is</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--green-900)' }}>
                Day {currentDay} of {totalDays}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bento */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Total Cycle Allowance</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--green-950)', marginTop: '2px' }}>
                <AnimatedCounter value={Number(activeCycle.total_allowance)} prefix="₱" decimals={2} />
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Current Daily Limit</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--green-700)', marginTop: '2px' }}>
                <AnimatedCounter value={currentDailyGuide} prefix="₱" decimals={2} suffix="/day" />
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Spending Days Remaining</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>
                {remainingDays} {remainingDays === 1 ? 'day' : 'days'}
              </div>
              <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                Days {currentDay} to {totalDays} ({daysLeft} after today)
              </span>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Protected Savings</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--gold-600)', marginTop: '2px' }}>
                <AnimatedCounter value={savingsGoalNum} prefix="₱" decimals={2} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Form & Dynamic Impact Simulator */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--green-950)', marginBottom: '16px' }}>
          Cycle Settings & Duration
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="form-label">Cycle Title / Description</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="form-input"
              placeholder="e.g. Finals Week Allowance, Oct 20-27"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <div>
              <label className="form-label">Total Allowance (₱)</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 900,
                    color: 'var(--gold-600)',
                    fontSize: '1.2rem',
                  }}
                >
                  ₱
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--green-900)' }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Got extra money mid-cycle? Use the "+ Add Extra Cash" button above.
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--green-800)', marginTop: '4px', display: 'block' }}>
                Fixed fare, dorm dues, or project fees? Ring-fence them in the <Link to="/reserves" style={{ color: 'var(--green-700)', fontWeight: 700, textDecoration: 'underline' }}>Reserve Essentials (Vaults)</Link> tab to protect your daily spendable allowance.
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Cycle Duration (Total Days)</label>
                <span style={{ fontSize: '0.72rem', color: 'var(--green-800)', fontWeight: 700 }}>
                  {inputRemainingDays} {inputRemainingDays === 1 ? 'spending day' : 'spending days'} (Days {currentDay}–{inputDays})
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px', fontWeight: 800, color: 'var(--green-900)' }}
                />
                <Calendar size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              {/* Quick Preset Duration Pills */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {[
                  { val: '5', label: '5d (School)' },
                  { val: '7', label: '7d (Week)' },
                  { val: '10', label: '10d (2 School Wks)' },
                  { val: '14', label: '14d (Bi-weekly)' },
                  { val: '15', label: '15d (Quincena)' },
                  { val: '30', label: '30d (Month)' },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setDays(preset.val)}
                    className={`badge-pill ${days === preset.val ? 'badge-gold' : 'badge-green'}`}
                    style={{ padding: '5px 10px', fontSize: '0.72rem', cursor: 'pointer', border: '1px solid var(--border-light)' }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Tap a preset above or type any custom number of days.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <div>
              <label className="form-label">Cycle Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Target Savings Goal (₱)</label>
                <span title="This target amount is set aside upfront and excluded from daily baon." style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} /> Protected Vault
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                />
                <PiggyBank size={18} color="var(--gold-600)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          {/* Live Dynamic Impact Simulation Box */}
          {activeCycle && (
            <div
              style={{
                backgroundColor: 'var(--bg-card-alt)',
                border: '1.5px dashed var(--green-300)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                  • Live Mathematical Impact Preview
                </span>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  If you save these changes now:
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--green-950)', marginTop: '2px' }}>
                  Daily spending limit will be: <strong>₱{projectedDailyQuota.toFixed(2)}/day</strong>
                  {dailyDiff !== 0 && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: dailyDiff > 0 ? 'var(--green-700)' : 'var(--status-danger)',
                      }}
                    >
                      ({dailyDiff > 0 ? `+₱${dailyDiff.toFixed(2)}` : `-₱${Math.abs(dailyDiff).toFixed(2)}`}/day)
                    </span>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', lineHeight: 1.4 }}>
                Past logged purchases are permanently locked and safe. Recalculation applies smoothly across your remaining days.
              </div>
            </div>
          )}

          <div>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '14px 28px' }}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Allowance Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Quick Extra Cash Modal (Add Cash Inflow) */}
      <AnimatePresence>
        {showTopUpModal && (
          <div
            className="mobile-fullscreen-modal-backdrop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 12000,
              padding: '16px',
              backdropFilter: 'blur(5px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ duration: 0.18 }}
              className="card mobile-fullscreen-modal-card"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '440px',
                padding: '26px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#FEF3C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PlusCircle size={22} color="#D97706" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--green-950)', margin: 0 }}>
                      Add Extra Cash Inflow
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Mid-cycle cash gift, padala, or side gig
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowTopUpModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleTopUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Extra Cash Amount (₱)</label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontWeight: 900,
                        color: 'var(--gold-600)',
                        fontSize: '1.2rem',
                      }}
                    >
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="1"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '38px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--green-900)' }}
                      placeholder="200"
                    />
                  </div>

                  {/* Preset Pills */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {[100, 200, 300, 500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTopUpAmount(String(preset))}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '8px',
                          border: topUpAmount === String(preset) ? '2px solid var(--green-600)' : '1px solid var(--border-light)',
                          backgroundColor: topUpAmount === String(preset) ? 'var(--green-50)' : '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        +₱{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">Note / Source (Optional)</label>
                  <input
                    type="text"
                    value={topUpNote}
                    onChange={(e) => setTopUpNote(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Allowance padala from parents"
                  />
                </div>

                {/* Instant Calculation Preview */}
                {parseFloat(topUpAmount) > 0 && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--green-50)',
                      border: '1px solid var(--green-200)',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      color: 'var(--green-900)',
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>Automatic Daily Boost:</strong> Adding ₱{parseFloat(topUpAmount).toFixed(2)} will immediately expand your daily limit across your remaining {remainingDays} days by <strong>+₱{(parseFloat(topUpAmount) / remainingDays).toFixed(2)}/day</strong>!
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowTopUpModal(false)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTopUp}
                    className="btn-gold"
                    style={{ flex: 1.3, padding: '12px', fontWeight: 800 }}
                  >
                    {submittingTopUp ? 'Adding...' : 'Confirm Top-Up'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Educational Guidance: How TipidTayo Handles Mid-Cycle Changes */}
      <div className="card" style={{ backgroundColor: 'var(--bg-card-alt)' }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--green-900)', textTransform: 'uppercase', marginBottom: '12px' }}>
          How TipidTayo Dynamically Adapts to Mid-Cycle Changes
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div>
            <strong style={{ color: 'var(--green-950)', display: 'block', marginBottom: '2px' }}>
              1. What if you get extra money?
            </strong>
            <p>
              Use the "+ Add Extra Cash" button. It instantly expands your remaining unspent pool and divides the surplus across your remaining days without corrupting past purchases.
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--green-950)', display: 'block', marginBottom: '2px' }}>
              2. What if your cycle duration changes?
            </strong>
            <p>
              If your week gets shortened (e.g. 5 days instead of 7 due to class suspension), shortening the days recalculates your daily limit to give you more baon per remaining day.
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--green-950)', display: 'block', marginBottom: '2px' }}>
              3. What if a sudden project fee comes up?
            </strong>
            <p>
              Head over to the Reserve Vaults tab and create a new vault (e.g. ₱180 Thesis Printing). It ring-fences that exact cash so you won't accidentally spend it on food or snacks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterAllowancePage;
