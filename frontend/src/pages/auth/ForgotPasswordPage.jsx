import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.reset_url) {
        setResetUrl(res.data.reset_url);
      }
    } catch (err) {
      setError('Unable to send reset link. Please verify your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green-900)' }}>
          Reset Your Password
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      {message && (
        <div
          style={{
            backgroundColor: 'var(--green-50)',
            border: '1px solid var(--green-500)',
            color: 'var(--green-900)',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '0.88rem',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px' }}>
            <CheckCircle2 size={18} color="var(--green-600)" />
            Success!
          </div>
          {message}
          {resetUrl && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--green-200)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Direct Testing Link:</p>
              <a href={resetUrl} style={{ fontSize: '0.82rem', color: 'var(--green-700)', wordBreak: 'break-all', fontWeight: 700 }}>
                {resetUrl}
              </a>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #F87171',
            color: '#B91C1C',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '0.85rem',
            marginBottom: '18px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              required
              placeholder="student@university.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
            <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', padding: '14px' }}
        >
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.88rem',
            color: 'var(--green-800)',
            fontWeight: 700,
          }}
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
