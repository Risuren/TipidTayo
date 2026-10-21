import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, Calendar, ShieldCheck, Tag, Info } from 'lucide-react';
import { SolarBagPlus, SolarChatRoundDots } from '../../components/common/SolarIcons';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import api from '../../api/axios';

export const RecordPurchasesPage = () => {
  const { activeCycle, dashboardData, refreshDashboard } = useAuth();
  const { showConfirm, showAlert, confirmDelete } = useModal();

  const [expenses, setExpenses] = useState([]);
  const [reserves, setReserves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Smart AI Bar
  const [aiText, setAiText] = useState('');
  const [aiLogging, setAiLogging] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  // Manual Form
  const [showManualForm, setShowManualForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [reserveId, setReserveId] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Filter
  const [selectedCat, setSelectedCat] = useState('All');

  const fetchExpensesAndReserves = async () => {
    try {
      const [expRes, resRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/reserves'),
      ]);
      setExpenses(expRes.data.data || expRes.data || []);
      setReserves(resRes.data || []);
    } catch (err) {
      console.warn('Error fetching expenses/reserves', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndReserves();
  }, [activeCycle]);

  // AI Natural Language Logger
  const handleAiLog = async (e) => {
    e.preventDefault();
    if (!aiText.trim() || aiLogging) return;

    setAiLogging(true);
    setAiFeedback(null);

    try {
      const res = await api.post('/ai/interact', {
        prompt: aiText.trim(),
        mode: 'log',
      });

      setAiFeedback(res.data);
      setAiText('');
      await fetchExpensesAndReserves();
      await refreshDashboard();
    } catch (err) {
      await showAlert({
        title: 'Unable to Record Expense',
        message: 'Please try rephrasing your input (e.g. "Jeep 15" or "Turon 20").',
        type: 'gold',
      });
    } finally {
      setAiLogging(false);
    }
  };

  // Manual Logger
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    setSubmittingManual(true);
    try {
      await api.post('/expenses', {
        title: title.trim(),
        category,
        amount: parseFloat(amount),
        reserve_id: reserveId || null,
        is_from_reserved: Boolean(reserveId),
      });

      setTitle('');
      setAmount('');
      setReserveId('');
      setShowManualForm(false);
      await fetchExpensesAndReserves();
      await refreshDashboard();
    } catch (err) {
      await showAlert({
        title: 'Unable to Save Manual Expense',
        message: 'Please check your inputs and try again.',
        type: 'gold',
      });
    } finally {
      setSubmittingManual(false);
    }
  };

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
      message: `Are you sure you want to remove "${expTitle}"? Funds will be restored immediately.`,
      details,
      confirmText: 'Yes, Remove Expense',
      cancelText: 'Keep Expense',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/expenses/${id}`);
      await fetchExpensesAndReserves();
      await refreshDashboard();
    } catch (err) {
      await showAlert({
        title: 'Unable to Remove Expense',
        message: 'A network error occurred while deleting the expense. Please try again.',
        type: 'danger',
      });
    }
  };

  const filteredExpenses = selectedCat === 'All'
    ? expenses
    : expenses.filter((e) => e.category === selectedCat);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge-pill badge-green" style={{ fontSize: '0.8rem' }}>
              Step 3
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--green-900)' }}>
              Record Purchases & Expenses
            </h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Log daily student purchases using quick natural language input or manual form entry.
          </p>
        </div>

        <button
          onClick={() => setShowManualForm(!showManualForm)}
          className="btn-secondary"
          style={{ padding: '10px 18px', fontSize: '0.9rem' }}
        >
          <Plus size={18} /> Manual Entry
        </button>
      </div>

      {/* 1. Natural Language Quick Logging Bar (AI Power) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1B4332 0%, #2E7D32 100%)',
          color: '#FFFFFF',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SolarBagPlus size={20} color="var(--gold-400)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
              Smart Expense Logger (AI Companion)
            </h3>
          </div>
          <span
            title="Type multiple expenses in one line like: 'Jeep 15, then Siomai rice 45'. The AI Companion parses amounts and automatically assigns them to matching vaults or daily spendable!"
            style={{ display: 'inline-flex', alignItems: 'center', color: '#C8E6C9', cursor: 'help' }}
          >
            <Info size={16} />
          </span>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#C8E6C9', marginBottom: '14px' }}>
          Type naturally! For example: <em>"Jeep 20, then Siomai rice 45 and ballpen 15"</em>
        </p>

        <form onSubmit={handleAiLog} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            required
            placeholder="Type your expenses here (e.g. Jeep 15, lunch 50)..."
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            style={{
              flex: 1,
              padding: '14px 18px',
              borderRadius: '14px',
              border: 'none',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={aiLogging}
            className="btn-gold"
            style={{ padding: '0 24px', whiteSpace: 'nowrap' }}
          >
            {aiLogging ? 'Logging...' : 'Record Expenses'}
          </button>
        </form>

        {aiFeedback && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              whiteSpace: 'pre-line',
            }}
          >
            {aiFeedback.reply}
          </div>
        )}
      </div>

      {/* Manual Entry Form Drawer */}
      {showManualForm && (
        <div className="card" style={{ border: '2px solid var(--green-500)', backgroundColor: 'var(--green-50)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green-900)', marginBottom: '14px' }}>
            Manual Expense Entry
          </h3>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label">Item / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canteen lunch, coffee, or printing"
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
                  <option value="Food">Food & Drinks</option>
                  <option value="Transportation">Transportation (Commute)</option>
                  <option value="School Expenses">School Expenses (Projects / Printing)</option>
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Deduct from Reserved Vault? (Optional)</label>
                <select
                  value={reserveId}
                  onChange={(e) => setReserveId(e.target.value)}
                  className="form-input"
                >
                  <option value="">No (Deduct from Daily Spendable)</option>
                  {reserves.map((r) => (
                    <option key={r.id} value={r.id}>
                      Vault: {r.title} (₱{r.allocated_amount})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button type="submit" disabled={submittingManual} className="btn-primary">
                {submittingManual ? 'Saving...' : 'Save Expense'}
              </button>
              <button type="button" onClick={() => setShowManualForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Purchases Feed & History */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-900)' }}>
            Logged Expenses History ({filteredExpenses.length})
          </h3>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['All', 'Food', 'Transportation', 'School Expenses', 'Personal Needs'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`badge-pill ${selectedCat === cat ? 'badge-green' : ''}`}
                style={{
                  padding: '5px 12px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-light)',
                  backgroundColor: selectedCat === cat ? 'var(--green-700)' : '#FFFFFF',
                  color: selectedCat === cat ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
            <Receipt size={40} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>No expenses recorded yet in this category.</p>
            <p style={{ fontSize: '0.8rem' }}>Use the Smart Logger above to record your purchases!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-card-alt)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--green-950)' }}>
                      {exp.title}
                    </span>
                    {exp.is_from_reserved ? (
                      <span className="badge-pill badge-gold" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={12} /> Vault Deducted
                      </span>
                    ) : (
                      <span className="badge-pill badge-green" style={{ fontSize: '0.68rem' }}>
                        Daily Pool
                      </span>
                    )}
                    {exp.logged_via === 'AI_Agent' && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--ai-indigo)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <SolarChatRoundDots size={11} /> AI Logged
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '3px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{exp.category}</span>
                    <span>•</span>
                    <span>{new Date(exp.logged_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green-900)' }}>
                    ₱{Number(exp.amount).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(exp.id, exp.title, exp.amount)}
                    style={{ color: '#EF4444', padding: '4px' }}
                    title="Remove expense"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordPurchasesPage;
