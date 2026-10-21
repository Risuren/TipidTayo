import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Info,
  Clock,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  PiggyBank,
  Wallet,
} from 'lucide-react';
import {
  SolarBus,
  SolarBookBookmark,
  SolarMeal,
  SolarBagSmile,
  SolarShieldCheck,
  SolarCalculator,
  SolarTrashBinTrash,
} from '../../components/common/SolarIcons';
import { TiPig } from '../../components/mascot/TiPig';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import api from '../../api/axios';

// Student Quick-Shield Starter Packs
const STARTER_PACKS = [
  {
    id: 'commute',
    title: 'Campus Commute Shield',
    category: 'Transportation',
    amount: 250,
    subtitle: '5-Day Jeepney, Bus & MRT Fare',
    description: 'Ring-fences your transport money so you never scramble for coins or walk miles to school.',
    icon: SolarBus,
    color: '#0284C7',
    bgColor: '#E0F2FE',
    tag: 'Transit Security',
    tagColor: '#0369A1',
  },
  {
    id: 'projects',
    title: 'Project & Xerox Stash',
    category: 'School Expenses',
    amount: 200,
    subtitle: 'Readings, Module Prints & Lab Supplies',
    description: 'Guarantees academic project deliverables remain fully funded without cutting into meal budget.',
    icon: SolarBookBookmark,
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    tag: 'Academics & Printing',
    tagColor: '#6D28D9',
  },
  {
    id: 'emergency',
    title: 'Emergency Medical & Buffer',
    category: 'Personal Needs',
    amount: 150,
    subtitle: 'Medicine, Umbrella & Urgent Essentials',
    description: 'Quick micro-cushion for flu meds, umbrella replacements, or urgent campus necessities.',
    icon: SolarBagSmile,
    color: '#D97706',
    bgColor: '#FEF3C7',
    tag: 'Emergency Buffer',
    tagColor: '#B45309',
  },
];

// Helper to resolve category visuals
const getCategoryMeta = (category) => {
  switch (category) {
    case 'Transportation':
      return {
        icon: SolarBus,
        color: '#0284C7',
        bg: '#E0F2FE',
        border: '#BAE6FD',
        tag: 'Transit Access',
      };
    case 'School Expenses':
      return {
        icon: SolarBookBookmark,
        color: '#7C3AED',
        bg: '#F3E8FF',
        border: '#E9D5FF',
        tag: 'Academics',
      };
    case 'Food':
      return {
        icon: SolarMeal,
        color: '#16A34A',
        bg: '#DCFCE7',
        border: '#BBF7D0',
        tag: 'Meal Security',
      };
    default:
      return {
        icon: SolarBagSmile,
        color: '#D97706',
        bg: '#FEF3C7',
        border: '#FDE68A',
        tag: 'Essentials',
      };
  }
};

// Vault Health State helper
const getVaultHealth = (allocated, spent) => {
  const remaining = Math.max(0, allocated - spent);
  if (spent <= 0) {
    return {
      status: 'untouched',
      label: '100% Untouched',
      badgeClass: 'badge-green',
      color: 'var(--green-700)',
      bg: '#DCFCE7',
      desc: 'Full fund available',
    };
  }
  if (remaining <= 0) {
    return {
      status: 'depleted',
      label: 'Depleted',
      badgeClass: 'badge-danger',
      color: '#DC2626',
      bg: '#FEE2E2',
      desc: 'All funds utilized',
    };
  }
  const ratio = remaining / allocated;
  if (ratio <= 0.25) {
    return {
      status: 'low',
      label: 'Low Balance',
      badgeClass: 'badge-gold',
      color: '#D97706',
      bg: '#FEF3C7',
      desc: 'Less than 25% remaining',
    };
  }
  return {
    status: 'active',
    label: 'Pacing Well',
    badgeClass: 'badge-blue',
    color: '#0284C7',
    bg: '#E0F2FE',
    desc: 'Actively protecting budget',
  };
};

export const ReserveEssentialsPage = () => {
  const { activeCycle, dashboardData, refreshDashboard } = useAuth();
  const { showConfirm, showAlert, confirmDelete } = useModal();

  const [reserves, setReserves] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Reserve Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Transportation');
  const [amount, setAmount] = useState('');
  const [isOptional, setIsOptional] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Reserve Modal State
  const [editingReserve, setEditingReserve] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Transportation');
  const [editAmount, setEditAmount] = useState('');
  const [editIsOptional, setEditIsOptional] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchReserves = async () => {
    try {
      const res = await api.get('/reserves');
      setReserves(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Error fetching reserves', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserves();
  }, [activeCycle]);

  // Handle Create Vault
  const handleAddReserve = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    setSubmitting(true);
    try {
      await api.post('/reserves', {
        title: title.trim(),
        category,
        allocated_amount: parseFloat(amount),
        is_optional: isOptional,
      });

      setTitle('');
      setAmount('');
      setIsOptional(false);
      setShowAddForm(false);
      await fetchReserves();
      await refreshDashboard();
    } catch (err) {
      await showAlert({
        title: 'Unable to Save Vault',
        message: 'Could not save the reserve vault. Please check your inputs.',
        type: 'gold',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Starter Pack Quick-Add
  const handleApplyStarterPack = async (pack) => {
    const confirmed = await showConfirm({
      title: `Allocate ${pack.title}?`,
      message: `Reserve ₱${pack.amount.toFixed(2)} for ${pack.category.toLowerCase()} essentials? This ring-fences the funds so your everyday spending pool won't accidentally eat into it.`,
      confirmText: `Yes, Reserve ₱${pack.amount}`,
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await api.post('/reserves', {
        title: pack.title,
        category: pack.category,
        allocated_amount: pack.amount,
        is_optional: false,
      });
      await fetchReserves();
      await refreshDashboard();
    } catch (err) {
      await showAlert({
        title: 'Unable to Save Vault',
        message: 'Could not apply the starter pack. Please check your inputs.',
        type: 'gold',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (res) => {
    setEditingReserve(res);
    setEditTitle(res.title);
    setEditCategory(res.category);
    setEditAmount(String(res.allocated_amount));
    setEditIsOptional(Boolean(res.is_optional));
  };

  // Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReserve || !editTitle.trim() || !editAmount) return;

    setEditSubmitting(true);
    try {
      await api.put(`/reserves/${editingReserve.id}`, {
        title: editTitle.trim(),
        category: editCategory,
        allocated_amount: parseFloat(editAmount),
        is_optional: editIsOptional,
      });

      setEditingReserve(null);
      await fetchReserves();
      await refreshDashboard();
    } catch (err) {
      await showAlert({
        title: 'Unable to Update Vault',
        message: 'Could not update reserve vault. Please try again.',
        type: 'gold',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete Vault
  const handleDelete = async (id, vaultTitle = 'this reserve vault', allocated = null) => {
    const details = allocated
      ? {
          vault_title: vaultTitle,
          allocated_fund: `₱${Number(allocated).toFixed(2)}`,
          impact: 'Unspent funds will return to daily spendable pool immediately',
        }
      : null;

    const confirmed = await confirmDelete({
      title: 'Remove Reserve Vault?',
      message: `Are you sure you want to remove "${vaultTitle}"? Any unspent funds allocated to this vault will be returned to your general spendable pool.`,
      details,
      confirmText: 'Yes, Remove Vault',
      cancelText: 'Keep Vault',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/reserves/${id}`);
      await fetchReserves();
      await refreshDashboard();
    } catch (err) {
      await showAlert({
        title: 'Unable to Remove Vault',
        message: 'Could not remove reserve vault. Please try again.',
        type: 'danger',
      });
    }
  };

  // Financial metrics
  const safeReserves = Array.isArray(reserves) ? reserves : [];
  const totalAllowance = Number(dashboardData?.financials?.total_allowance || activeCycle?.total_allowance || 0);
  const totalReserved = safeReserves.reduce((sum, r) => sum + parseFloat(r.allocated_amount || 0), 0);
  const totalSpent = safeReserves.reduce((sum, r) => sum + parseFloat(r.spent_amount || 0), 0);
  const totalRemainingInVaults = Math.max(0, totalReserved - totalSpent);
  const savingsGoal = Number(dashboardData?.financials?.savings_goal || activeCycle?.savings_goal || 0);
  const remainingDays = Number(dashboardData?.time?.remaining_days || 1);
  const unreservedPool = Number(dashboardData?.financials?.remaining_unreserved ?? Math.max(0, totalAllowance - totalReserved - savingsGoal));
  const dailyGuide = Number(dashboardData?.financials?.daily_guide || 0);

  // Proportions for Bento Bar
  const pctReserved = totalAllowance > 0 ? Math.min(100, Math.round((totalReserved / totalAllowance) * 100)) : 0;
  const pctSavings = totalAllowance > 0 ? Math.min(100, Math.round((savingsGoal / totalAllowance) * 100)) : 0;
  const pctDaily = Math.max(0, 100 - pctReserved - pctSavings);

  // Aggregate any scheduled payments attached to reserves
  const allAttachedScheduled = safeReserves.flatMap((r) =>
    (r.scheduled_payments || []).map((sp) => ({
      ...sp,
      reserve_title: r.title,
      reserve_category: r.category,
    }))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.65rem)', fontWeight: 900, color: 'var(--green-900)', margin: 0 }}>
              Reserve Essentials (Vaults)
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)', color: 'var(--text-secondary)', margin: 0 }}>
              Digital envelopes protecting transit fare, school project fees, and critical buffers upfront.
            </p>
            <span
              title="Reserves are ring-fenced funds subtracted upfront from your total allowance so you won't accidentally spend your fare or project money on daily food or impulse buys."
              style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--green-700)', cursor: 'help' }}
            >
              <Info size={15} />
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
          style={{ padding: '10px 18px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {showAddForm ? <X size={18} /> : <Plus size={18} />}
          {showAddForm ? 'Close Form' : 'Add New Vault'}
        </button>
      </div>

      {/* 2. 3-Bucket Capital Breakdown Bento */}
      <div
        className="card"
        style={{
          padding: '24px',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #BBF7D0',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)',
        }}
      >
        <div className="reserves-buckets-header" style={{ marginBottom: '20px' }}>
          <div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#15803D',
                backgroundColor: '#DCFCE7',
                border: '1px solid #BBF7D0',
                padding: '4px 10px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Layers size={13} />
              3-Bucket Student Capital Architecture
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--green-950)', margin: '8px 0 0 0' }}>
              How Your Total Allowance Is Shielded
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Upfront ring-fencing ensures essential commitments and savings never get swallowed by daily variable expenses.
            </p>
          </div>

          <div className="reserves-allowance-box">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Registered Allowance</span>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--green-950)' }}>
              ₱{Number(totalAllowance).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* 3 Metric Mini-Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {/* Bucket 1: Ring-Fenced Vaults */}
          <div
            style={{
              padding: '16px 18px',
              backgroundColor: '#FEFCE8',
              borderRadius: '16px',
              border: '1.5px solid #FEF08A',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#854D0E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={14} /> Bucket 1: Essential Vaults
              </span>
              <span style={{ fontSize: '0.72rem', color: '#A16207', fontWeight: 800, backgroundColor: '#FEF9C3', padding: '2px 6px', borderRadius: '6px' }}>{pctReserved}%</span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#713F12' }}>
              ₱{Number(totalReserved).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#A16207', display: 'block', marginTop: '3px' }}>
              ₱{Number(totalRemainingInVaults).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available ({safeReserves.length} {safeReserves.length === 1 ? 'vault' : 'vaults'})
            </span>
          </div>

          {/* Bucket 2: Target Savings */}
          <div
            style={{
              padding: '16px 18px',
              backgroundColor: '#EFF6FF',
              borderRadius: '16px',
              border: '1.5px solid #BFDBFE',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <PiggyBank size={14} /> Bucket 2: Target Savings
              </span>
              <span style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 800, backgroundColor: '#DBEAFE', padding: '2px 6px', borderRadius: '6px' }}>{pctSavings}%</span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1E3A8A' }}>
              ₱{Number(savingsGoal).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#2563EB', display: 'block', marginTop: '3px' }}>
              100% locked & preserved
            </span>
          </div>

          {/* Bucket 3: Spendable Daily Pool */}
          <div
            style={{
              padding: '16px 18px',
              backgroundColor: '#F0FDF4',
              borderRadius: '16px',
              border: '1.5px solid #BBF7D0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Wallet size={14} /> Bucket 3: Spendable Daily Pool
              </span>
              <span style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 800, backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '6px' }}>{pctDaily}%</span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#064E3B' }}>
              ₱{Number(unreservedPool).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#166534', display: 'block', marginTop: '3px' }}>
              Remaining pool for everyday variable spending
            </span>
          </div>
        </div>

        {/* Proportional Segmented Visual Bar with Smooth Fill Animation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              height: '12px',
              backgroundColor: '#E2E8F0',
              borderRadius: '9999px',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctReserved}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                backgroundColor: '#EAB308',
                height: '100%',
              }}
              title={`Vaults: ₱${totalReserved.toFixed(2)} (${pctReserved}%)`}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctSavings}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
              style={{
                backgroundColor: '#3B82F6',
                height: '100%',
              }}
              title={`Savings: ₱${savingsGoal.toFixed(2)} (${pctSavings}%)`}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctDaily}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              style={{
                backgroundColor: '#10B981',
                height: '100%',
              }}
              title={`Spendable Pool: ₱${unreservedPool.toFixed(2)} (${pctDaily}%)`}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ color: '#854D0E' }}>🟡 Vaults: {pctReserved}%</span>
            <span style={{ color: '#1E40AF' }}>🔵 Savings: {pctSavings}%</span>
            <span style={{ color: '#166534' }}>🟢 Spendable Pool: {pctDaily}%</span>
          </div>
        </div>
      </div>

      {/* 3. Add New Reserve Form Drawer/Card */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="card" style={{ border: '2px solid var(--green-500)', backgroundColor: 'var(--green-50)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green-950)', margin: 0 }}>
                  Create New Protected Vault
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{ color: 'var(--text-muted)', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddReserve} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label className="form-label">Vault Title / Purpose</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Transit to campus or Thesis printing"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="form-input"
                    >
                      <option value="Transportation">Transportation (Jeep / Bus / MRT)</option>
                      <option value="School Expenses">School Expenses (Print / Projects)</option>
                      <option value="Food">Food (Fixed Meal Reserve)</option>
                      <option value="Personal Needs">Personal Needs (Emergency Essentials)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Allocated Amount (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="250"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="isOptional"
                    checked={isOptional}
                    onChange={(e) => setIsOptional(e.target.checked)}
                    style={{ accentColor: 'var(--green-600)', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="isOptional" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Mark as "Optional" (flexible priority fund)
                  </label>
                </div>

                {parseFloat(amount) > 0 && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid var(--green-300)',
                      fontSize: '0.8rem',
                      color: 'var(--green-950)',
                      lineHeight: 1.4,
                    }}
                  >
                    <strong>Mid-Cycle Protection:</strong> Ring-fencing ₱{parseFloat(amount).toFixed(2)} locks this fund for {category}. Your daily spendable allowance for the remaining {remainingDays} {remainingDays === 1 ? 'day' : 'days'} adjusts by approx. <strong>-₱{(parseFloat(amount) / Math.max(1, remainingDays)).toFixed(2)}/day</strong>, while your ₱{savingsGoal.toFixed(2)} Target Savings stays 100% safe.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Saving...' : 'Save Vault'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Educational Zero-State with 3 Student Quick-Shield Starter Packs (When safeReserves.length === 0) */}
      {safeReserves.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Main TiPig Mascot Zero-State Banner */}
          <div
            className="card reserves-hero-card"
            style={{
              padding: '28px 24px',
              backgroundColor: '#FFFFFF',
              border: '2px dashed var(--green-300)',
              borderRadius: '20px',
            }}
          >
            <div className="reserves-hero-mascot">
              <TiPig state="vault" size={135} />
            </div>

            <div className="reserves-hero-content">
              <div className="reserves-hero-badges">
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  <ShieldCheck size={13} /> TiPig Student Shield
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--green-700)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  • Fixed Costs Protected
                </span>
              </div>

              <h3 className="reserves-hero-title">
                Your Essential Funds Are Currently Unprotected!
              </h3>
              <p className="reserves-hero-desc">
                Without vaults, everyday student necessities like commute fare and project printing mix directly into your daily meal allowance. Ring-fencing these funds upfront guarantees you'll never run out of jeepney fare or sacrifice lunch for thesis photocopies!
              </p>

              <div className="reserves-hero-cta">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary"
                  style={{ padding: '9px 20px', fontSize: '0.88rem' }}
                >
                  <Plus size={16} /> Create Custom Vault
                </button>
              </div>
            </div>
          </div>

          {/* Quick-Shield Starter Packs Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--green-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="var(--gold-600)" />
                Recommended Student Quick-Shield Packs
              </h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                1-click setup based on PH student spending habits
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '16px' }}>
              {STARTER_PACKS.map((pack) => {
                const IconComp = pack.icon;
                return (
                  <div
                    key={pack.id}
                    className="card"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: `1.5px solid ${pack.color}30`,
                      backgroundColor: '#FFFFFF',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    <div>
                      {/* Top Meta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: pack.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: pack.color,
                          }}
                        >
                          <IconComp size={24} color={pack.color} />
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: `${pack.color}15`,
                            color: pack.color,
                          }}
                        >
                          {pack.tag}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--green-950)', margin: '0 0 2px 0' }}>
                        {pack.title}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                        {pack.subtitle}
                      </span>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                        {pack.description}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recommended Fund</span>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--green-900)' }}>
                          ₱{pack.amount.toFixed(2)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setTitle(pack.title);
                            setCategory(pack.category);
                            setAmount(String(pack.amount));
                            setShowAddForm(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          title="Customize amount or details"
                        >
                          Customize
                        </button>
                        <button
                          onClick={() => handleApplyStarterPack(pack)}
                          disabled={submitting}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Plus size={14} /> Quick Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Active Reserves Cards Grid (When safeReserves.length > 0) */}
      {safeReserves.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--green-950)', margin: 0 }}>
              Your Active Envelopes ({safeReserves.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Total Vault Pool: <strong>₱{totalRemainingInVaults.toFixed(2)}</strong> available
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '16px' }}>
            {safeReserves.map((res, index) => {
              const allocated = parseFloat(res.allocated_amount) || 0;
              const spent = parseFloat(res.spent_amount) || 0;
              const remaining = Math.max(0, allocated - spent);
              const pct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
              const meta = getCategoryMeta(res.category);
              const health = getVaultHealth(allocated, spent);
              const IconComp = meta.icon;

              // Check for scheduled payments attached to this vault
              const attachedScheduled = res.scheduled_payments || [];
              const scheduledTotal = attachedScheduled.reduce((sum, sp) => sum + parseFloat(sp.amount || 0), 0);

              return (
                <div
                  key={res.id}
                  className="card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-light)',
                    position: 'relative',
                  }}
                >
                  <div>
                    {/* Header Row: Icon + Title + Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: meta.bg,
                            border: `1px solid ${meta.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: meta.color,
                            flexShrink: 0,
                          }}
                        >
                          <IconComp size={22} color={meta.color} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--green-950)', margin: 0 }}>
                            {res.title}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--green-700)' }}>
                              {res.category}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>•</span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '9999px',
                                backgroundColor: health.bg,
                                color: health.color,
                              }}
                            >
                              {health.label}
                            </span>
                            {res.is_optional && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold-700)' }}>
                                (Optional)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Edit and Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => openEditModal(res)}
                          style={{
                            padding: '6px',
                            color: 'var(--text-secondary)',
                            borderRadius: '8px',
                            transition: 'color 0.2s',
                          }}
                          title="Edit vault title or allocation"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(res.id, res.title, res.allocated_amount)}
                          style={{
                            padding: '6px',
                            color: '#EF4444',
                            borderRadius: '8px',
                            transition: 'color 0.2s',
                          }}
                          title="Remove vault"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Scheduled Commitment Pill (If Any) */}
                    {scheduledTotal > 0 && (
                      <div
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#FFFBEB',
                          borderRadius: '10px',
                          border: '1px solid #FDE68A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '12px',
                          fontSize: '0.75rem',
                          color: '#B45309',
                        }}
                      >
                        <Clock size={14} color="#D97706" style={{ flexShrink: 0 }} />
                        <span>
                          <strong>₱{scheduledTotal.toFixed(2)}</strong> committed for {attachedScheduled.length} scheduled {attachedScheduled.length === 1 ? 'payment' : 'payments'}.
                        </span>
                      </div>
                    )}

                    {/* Progress Bar & Details */}
                    <div style={{ margin: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                        <span>₱{spent.toFixed(2)} spent ({pct}%)</span>
                        <span style={{ fontWeight: 700, color: 'var(--green-900)' }}>₱{allocated.toFixed(2)} allocated</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#E2E8DF', borderRadius: '9999px', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut', delay: index * 0.08 }}
                          style={{
                            height: '100%',
                            backgroundColor: pct >= 90 ? 'var(--status-danger)' : pct >= 70 ? 'var(--gold-500)' : 'var(--green-600)',
                            borderRadius: '9999px',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Remaining & Protection context */}
                  <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Remaining in Vault:</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 900, color: remaining > 0 ? 'var(--green-800)' : 'var(--status-danger)' }}>
                        ₱{remaining.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      Protects ~₱{(remaining / Math.max(1, remainingDays)).toFixed(2)}/day across remaining {remainingDays} {remainingDays === 1 ? 'day' : 'days'}.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Upcoming Scheduled Vault Payments (If any scheduled commitments exist) */}
      {allAttachedScheduled.length > 0 && (
        <div className="card" style={{ padding: '20px', border: '1px solid var(--green-200)', backgroundColor: '#F9FBF9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Calendar size={18} color="var(--green-700)" />
            <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--green-950)', margin: 0 }}>
              Upcoming Scheduled Vault Payments
            </h4>
            <span className="badge-pill badge-green" style={{ fontSize: '0.7rem' }}>
              {allAttachedScheduled.length} committed
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
            These commitments are scheduled to draw directly from your essential reserve vaults when due, leaving your daily meal limit untouched.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {allAttachedScheduled.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--green-950)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Vault: <strong style={{ color: 'var(--green-800)' }}>{item.reserve_title}</strong>
                    {item.target_day && ` • Day ${item.target_day}`}
                  </div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--gold-600)' }}>
                  ₱{Number(item.amount || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Edit Vault Modal */}
      <AnimatePresence>
        {editingReserve && (
          <div
            className="mobile-fullscreen-modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card mobile-fullscreen-modal-card"
              style={{
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit2 size={18} color="var(--green-800)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--green-950)', margin: 0 }}>
                    Edit Reserve Vault
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingReserve(null)}
                  style={{ color: 'var(--text-muted)', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Vault Title / Purpose</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="form-input"
                  >
                    <option value="Transportation">Transportation (Jeep / Bus / MRT)</option>
                    <option value="School Expenses">School Expenses (Print / Projects)</option>
                    <option value="Food">Food (Fixed Meal Reserve)</option>
                    <option value="Personal Needs">Personal Needs (Emergency Essentials)</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Allocated Amount (₱)</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Previously: ₱{Number(editingReserve.allocated_amount).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="editIsOptional"
                    checked={editIsOptional}
                    onChange={(e) => setEditIsOptional(e.target.checked)}
                    style={{ accentColor: 'var(--green-600)', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="editIsOptional" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Mark as "Optional" (flexible priority fund)
                  </label>
                </div>

                {parseFloat(editAmount) > 0 && parseFloat(editAmount) !== parseFloat(editingReserve.allocated_amount) && (
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#F0FDF4',
                      borderRadius: '10px',
                      border: '1px solid #BBF7D0',
                      fontSize: '0.78rem',
                      color: 'var(--green-900)',
                      lineHeight: 1.4,
                    }}
                  >
                    <strong>Quota Rebalance:</strong> Adjusting allocation by{' '}
                    {parseFloat(editAmount) > parseFloat(editingReserve.allocated_amount) ? '+' : ''}
                    ₱{(parseFloat(editAmount) - parseFloat(editingReserve.allocated_amount)).toFixed(2)}{' '}
                    will re-balance your daily limit by approx.{' '}
                    {parseFloat(editAmount) > parseFloat(editingReserve.allocated_amount) ? '-' : '+'}
                    ₱{(Math.abs(parseFloat(editAmount) - parseFloat(editingReserve.allocated_amount)) / Math.max(1, remainingDays)).toFixed(2)}/day.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" disabled={editSubmitting} className="btn-primary" style={{ flex: 1 }}>
                    {editSubmitting ? 'Updating...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditingReserve(null)} className="btn-secondary" style={{ flex: 1 }}>
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

export default ReserveEssentialsPage;
