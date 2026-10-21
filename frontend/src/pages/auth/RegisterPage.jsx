import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect straight to onboarding or dashboard
  useEffect(() => {
    if (user) {
      if (!user.onboarding_completed) {
        navigate('/onboarding');
      } else {
        navigate('/daily-limit');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      // New user goes directly to interactive onboarding wizard
      navigate('/onboarding');
    } catch (err) {
      const msg =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.password?.[0] ||
        err.response?.data?.message ||
        'Registration failed. Please review your input details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8000/api/auth/google/redirect';
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green-900)' }}>
          Create an Account
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Start your stress-free student budgeting journey with TiPig!
        </p>
      </div>

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
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}

      {/* Google Sign Up Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '11px 16px',
          backgroundColor: '#FFFFFF',
          border: '2px solid var(--border-light)',
          borderRadius: '14px',
          fontSize: '0.9rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          marginBottom: '20px',
          transition: 'all 0.15s ease',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Sign up with Google
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR REGISTER WITH EMAIL</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label className="form-label">Full Name</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              placeholder="Maria Santos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
            <UserIcon size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <div>
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              required
              placeholder="maria@tipidtayo.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
            <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <div>
          <label className="form-label">Password (Min. 8 characters)</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px', paddingRight: '40px' }}
            />
            <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="form-label">Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="••••••••"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
            <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', marginTop: '6px', padding: '14px' }}
        >
          {loading ? 'Creating Account...' : (
            <>
              Continue to Setup <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--green-800)', fontWeight: 800, textDecoration: 'underline' }}>
          Log in here
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
