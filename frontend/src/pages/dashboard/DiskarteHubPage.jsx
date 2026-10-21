import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Compass,
  PiggyBank,
  Lightbulb,
  ThumbsUp,
  Plus,
  X,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Wallet,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import {
  SolarBus,
  SolarBookBookmark,
  SolarMeal,
  SolarBagSmile,
  SolarChatRoundDots,
} from '../../components/common/SolarIcons';
import TiPig from '../../components/mascot/TiPig';
import { FormattedMarkdownText } from '../../components/common/FormattedMarkdownText';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import api from '../../api/axios';

// Philippine Student Micro-Growth Pathways
const INVESTMENT_PATHWAYS = [
  {
    id: 'digital_banks',
    title: 'High-Yield Digital Savings',
    providers: 'Maya Savings, CIMB GSave, SeaBank',
    rate: '4.0% – 10.0% p.a.',
    minDeposit: '₱1.00 (No minimum)',
    bestFor: 'Student Emergency Buffer & Cash Stash',
    description: 'Earn daily or monthly interest risk-free. Insured by PDIC up to ₱500,000. Far better than traditional banks giving 0.05%!',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    badge: 'Zero Risk • PDIC-Insured',
    actionTip: 'Transfer your unspent cash to Maya Personal Goals or CIMB GSave in GCash.',
  },
  {
    id: 'pagibig_mp2',
    title: 'Pag-IBIG MP2 (Modified Pag-IBIG II)',
    providers: 'Pag-IBIG Fund (Govt-backed)',
    rate: '6.0% – 7.0% p.a.',
    minDeposit: '₱500.00 via GCash/Maya',
    bestFor: 'College Graduation Seed Fund (5-Yr Lock)',
    description: 'Government-guaranteed voluntary savings. Any 18+ student with a Pag-IBIG MID can join online. High annual dividends without tax.',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    badge: "Gov't-Guaranteed • Tax-Free",
    actionTip: 'Save ₱500 from your cycle savings to open or top up your MP2 account via GCash.',
  },
  {
    id: 'gcash_ginvest',
    title: 'GCash GInvest (Money Market UITF)',
    providers: 'ATRAM Philippine Money Market',
    rate: '3.5% – 4.5% p.a.',
    minDeposit: '₱50.00 only',
    bestFor: 'Micro-Investing Small Surplus Change',
    description: 'A Unit Investment Trust Fund accessible right inside GCash. Invest surplus baon with low risk, redeemable anytime in 1-2 banking days.',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    badge: 'Start at ₱50 • Liquid',
    actionTip: 'Open GCash > GInvest > Money Market Fund to park ₱50+ surplus without locking it.',
  },
];

export const DiskarteHubPage = () => {
  const { dashboardData, activeCycle } = useAuth();
  const { showAlert } = useModal();

  // Community Tips State
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddTipModal, setShowAddTipModal] = useState(false);
  const [newTipText, setNewTipText] = useState('');
  const [newTipCategory, setNewTipCategory] = useState('Tight Budget Survival');
  const [newTipAuthor, setNewTipAuthor] = useState('');
  const [newTipSaves, setNewTipSaves] = useState('');
  const [submittingTip, setSubmittingTip] = useState(false);

  // In-Place Wealth Compass State (Smooth slide-down inside card)
  const [isCompassExpanded, setIsCompassExpanded] = useState(false);
  const [wealthAdvisory, setWealthAdvisory] = useState('');
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);

  // Financial Context
  const financials = dashboardData?.financials || {};
  const analytics = dashboardData?.analytics || {};
  const time = dashboardData?.time || {};

  const totalAllowance = Number(financials.total_allowance || 0);
  const totalSpentAll = Number(financials.total_spent_all || 0);
  const savingsGoal = Number(financials.savings_goal || 0);
  const savingsStatus = financials.savings_status || 'intact';
  const totalDays = Number(time.total_days || 7);

  const actualSavedTotal = Number(analytics.actual_saved_total ?? Math.max(0, totalAllowance - totalSpentAll));
  const surplusSavings = Number(analytics.surplus_savings ?? Math.max(0, actualSavedTotal - savingsGoal));

  // Fetch Community Tips
  const fetchTips = async (category = 'All') => {
    try {
      setTipsLoading(true);
      const url = category && category !== 'All' ? `/community-tips?category=${encodeURIComponent(category)}` : '/community-tips';
      const res = await api.get(url);
      setTips(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Error fetching community tips', err);
    } finally {
      setTipsLoading(false);
    }
  };

  useEffect(() => {
    fetchTips(selectedCategory);
  }, [selectedCategory]);

  // Handle Upvote
  const handleUpvote = async (tipId) => {
    try {
      setTips((prev) =>
        prev.map((t) => (t.id === tipId ? { ...t, upvotes_count: t.upvotes_count + 1 } : t))
      );
      await api.post(`/community-tips/${tipId}/upvote`);
    } catch (err) {
      console.warn('Upvote failed', err);
    }
  };

  // Handle New Tip Submit
  const handleCreateTip = async (e) => {
    e.preventDefault();
    if (!newTipText.trim()) return;

    setSubmittingTip(true);
    try {
      const res = await api.post('/community-tips', {
        tip_text: newTipText,
        category: newTipCategory,
        author_alias: newTipAuthor.trim() || undefined,
        estimated_daily_savings: parseFloat(newTipSaves) || 0,
      });

      setTips((prev) => [res.data.tip, ...prev]);
      setShowAddTipModal(false);
      setNewTipText('');
      setNewTipAuthor('');
      setNewTipSaves('');
      await showAlert({
        title: 'Salamat sa Diskarte!',
        message: 'Your student tip was added to the Community Wall to help fellow students save.',
        type: 'success',
      });
    } catch (err) {
      await showAlert({
        title: 'Error Submitting Tip',
        message: 'Could not post your tip. Please try again.',
        type: 'danger',
      });
    } finally {
      setSubmittingTip(false);
    }
  };

  // Consult TiPig Wealth Compass (In-Place Slide-Down inside Physical Reality card)
  const handleToggleWealthCompass = async () => {
    if (isCompassExpanded) {
      setIsCompassExpanded(false);
      return;
    }

    setIsCompassExpanded(true);
    if (wealthAdvisory) return; // already loaded

    setLoadingAdvisory(true);
    try {
      const prompt = `As TiPig AI student financial advisor, give a practical, motivating, 3-step action plan in friendly Taglish for a college student who has ₱${Number(actualSavedTotal).toFixed(2)} in physical cash saved from a ₱${Number(totalAllowance).toFixed(2)} allowance over a ${totalDays}-day cycle. Their target savings was ₱${Number(savingsGoal).toFixed(2)} (${savingsStatus}). Explain exactly what to do with this physical cash (Alkansya, Maya/CIMB digital banks, GInvest ₱50, or MP2) and how to protect it from being spent next week. Keep it concise, high energy, and strictly zero emojis.`;

      const res = await api.post('/ai/interact', {
        mode: 'chat',
        prompt: prompt,
      });

      setWealthAdvisory(res.data.reply || 'Great savings discipline! Segregate your cash immediately.');
    } catch (err) {
      setWealthAdvisory(
        `### TiPig Wealth Recommendation\n\n1. **Physical Alkansya Segregation:** Remove your ₱${Number(actualSavedTotal).toFixed(2)} from your spending wallet immediately so you do not spend it as free cash next cycle.\n\n2. **High-Yield Digital Savings:** Transfer at least ₱${Number(savingsGoal).toFixed(2)} to Maya Personal Goals (4-10% p.a.) or CIMB GSave in GCash for zero-risk emergency backing.\n\n3. **Micro-Growth:** If you have surplus cash above ₱50, try GCash GInvest ATRAM Money Market for low-risk inflation defense!`
      );
    } finally {
      setLoadingAdvisory(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header & Financial Overview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--gold-700)',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              padding: '4px 10px',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Lightbulb size={13} />
            Decision Making & Savings Hub
          </span>
          <h2 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.65rem)', fontWeight: 900, color: 'var(--green-950)', margin: '8px 0 0 0' }}>
            Diskarte & Long-Term Wealth Hub
          </h2>
          <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Transform unspent allowance into lasting physical capital, explore micro-investments, and exchange real budget diskarte with fellow students.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/review" className="btn-secondary" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>
            ← View Weekly Stats & Trends
          </Link>
          <button
            onClick={() => setShowAddTipModal(true)}
            className="btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Share Tip to Community
          </button>
        </div>
      </div>

      {/* 2. The Physical Reality Container Card with In-Place Wealth Compass */}
      <div
        className="card"
        style={{
          border: '1.5px solid #BBF7D0',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={22} color="var(--green-800)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--green-950)', margin: 0 }}>
                The Physical Reality: Where Does Your Saved Cash Go?
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              TipidTayo tracks your numbers, but your <strong>₱{actualSavedTotal.toFixed(2)}</strong> is physically in your hands or wallet. Segregate it now so it won't be spent as free cash next cycle!
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleToggleWealthCompass}
            disabled={loadingAdvisory}
            className="btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              backgroundColor: isCompassExpanded ? 'var(--green-800)' : 'var(--green-700)',
            }}
          >
            <Compass size={16} />
            {loadingAdvisory ? 'Analyzing Cash...' : isCompassExpanded ? 'Hide Advice' : 'Ask TiPig Wealth Compass'}
            {isCompassExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </motion.button>
        </div>

        {/* IN-PLACE SLIDE-DOWN WEALTH COMPASS ADVISORY */}
        <AnimatePresence>
          {isCompassExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{ overflow: 'hidden', marginBottom: '20px' }}
            >
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '16px',
                  border: '1.5px solid #86EFAC',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        backgroundColor: '#DCFCE7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#15803D',
                      }}
                    >
                      <Compass size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--green-950)', margin: 0 }}>
                        TiPig Wealth Compass Advisory
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--green-800)' }}>
                        Tailored physical cash protection plan
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setWealthAdvisory('');
                        handleToggleWealthCompass();
                      }}
                      title="Regenerate advice"
                      style={{
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #BBF7D0',
                        borderRadius: '8px',
                        color: 'var(--green-900)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCompassExpanded(false)}
                      style={{
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #BBF7D0',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {loadingAdvisory ? (
                  <div style={{ padding: '24px 0', textAlign: 'center' }}>
                    <TiPig state="thinking" size={60} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--green-900)', marginTop: '8px', fontWeight: 600 }}>
                      TiPig is analyzing your savings and preparing your physical cash action plan...
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #BBF7D0',
                      lineHeight: 1.6,
                      fontSize: '0.88rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <FormattedMarkdownText content={wealthAdvisory} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alkansya Ritual Banner */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#F0FDF4',
            borderRadius: '14px',
            border: '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A',
              flexShrink: 0,
            }}
          >
            <PiggyBank size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--green-950)' }}>
              Physical Action Required: The Alkansya Drop
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--green-900)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
              Take your physical <strong>₱{actualSavedTotal.toFixed(2)}</strong> out of your everyday pocket wallet right now. Deposit it into your physical coin bank or transfer it to an interest-earning digital bank.
            </p>
          </div>
        </div>

        {/* 3 Philippine Student Micro-Growth Pathways */}
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green-950)', margin: '0 0 12px 0' }}>
          Where Can Students Safely Park or Multiply Saved Baon?
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {INVESTMENT_PATHWAYS.map((path) => (
            <div
              key={path.id}
              style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: path.bgColor,
                border: `1.5px solid ${path.color}40`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: path.color,
                      backgroundColor: '#FFFFFF',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      border: `1.5px solid ${path.color}35`,
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {path.badge}
                  </span>
                  <span
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 900,
                      color: path.color,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {path.rate}
                  </span>
                </div>
                <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--green-950)', margin: '0 0 4px 0' }}>
                  {path.title}
                </h5>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Providers: <strong>{path.providers}</strong> • Min: {path.minDeposit}
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                  {path.description}
                </p>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '10px',
                  fontSize: '0.76rem',
                  color: 'var(--green-950)',
                  border: `1px solid ${path.color}25`,
                }}
              >
                <strong>Student Action:</strong> {path.actionTip}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Community Diskarte Wall */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SolarChatRoundDots size={22} color="var(--green-800)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--green-950)', margin: 0 }}>
                Community Diskarte Wall
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Real-world budget hacks, jeepney routes, cheap karinderyas, and emergency survival tips tested by Filipino students.
            </p>
          </div>

          <button
            onClick={() => setShowAddTipModal(true)}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Add Tip
          </button>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
          {['All', 'Commute Hacks', 'Tipid Meals', 'Project Stash', 'Academic Materials', 'Tight Budget Survival'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: selectedCategory === cat ? 800 : 600,
                backgroundColor: selectedCategory === cat ? 'var(--green-800)' : '#F1F5F9',
                color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tips Stream */}
        {tipsLoading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading community tips...
          </div>
        ) : !Array.isArray(tips) || tips.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '14px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              No tips posted for this category yet. Be the first to share your student diskarte!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
            {tips.map((tip) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.5px solid var(--border-light)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {tip.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                    "{tip.tip_text}"
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span>By <strong>{tip.author_alias || 'Tipid Student'}</strong></span>
                    {Number(tip.estimated_daily_savings) > 0 && (
                      <span style={{ color: '#16A34A', fontWeight: 700, marginLeft: '6px' }}>
                        • Saves ~₱{Number(tip.estimated_daily_savings).toFixed(0)}/day
                      </span>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleUpvote(tip.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid #BBF7D0',
                      backgroundColor: '#F0FDF4',
                      color: '#16A34A',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <ThumbsUp size={13} /> {tip.upvotes_count || 0}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Add Tip Modal */}
      <AnimatePresence>
        {showAddTipModal && (
          <div
            className="mobile-fullscreen-modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="card mobile-fullscreen-modal-card"
              style={{ width: '100%', maxWidth: '500px', padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--green-950)', margin: 0 }}>
                  Share Your Student Diskarte Tip
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddTipModal(false)}
                  style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTip} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={newTipCategory}
                    onChange={(e) => setNewTipCategory(e.target.value)}
                    className="form-input"
                  >
                    <option value="Commute Hacks">Commute Hacks (Transit & Jeep)</option>
                    <option value="Tipid Meals">Tipid Meals (Food & Baon)</option>
                    <option value="Project Stash">Project Stash (Printing & Materials)</option>
                    <option value="Academic Materials">Academic Materials (Books & Photocopy)</option>
                    <option value="Tight Budget Survival">Tight Budget Survival (End of Week Hacks)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Your Practical Tip / Hack</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Always bring a water tumbler to campus to save ₱30/day on bottled water. Take the ordinary bus instead of aircon to save ₱15 fare."
                    value={newTipText}
                    onChange={(e) => setNewTipText(e.target.value)}
                    className="form-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Your Alias (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. DiskarteEngr"
                      value={newTipAuthor}
                      onChange={(e) => setNewTipAuthor(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Est. Daily Savings (₱)</label>
                    <input
                      type="number"
                      placeholder="e.g. 30"
                      min="0"
                      value={newTipSaves}
                      onChange={(e) => setNewTipSaves(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" disabled={submittingTip} className="btn-primary" style={{ flex: 1 }}>
                    {submittingTip ? 'Posting...' : 'Post Tip to Wall'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTipModal(false)}
                    className="btn-secondary"
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

export default DiskarteHubPage;
