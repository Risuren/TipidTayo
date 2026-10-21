import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TiPig from '../../components/mascot/TiPig';

export const GoogleCallbackPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    const onboarded = params.get('onboarded') === '1';

    if (token) {
      localStorage.setItem('tipidtayo_token', token);
      refreshUser().then(() => {
        if (onboarded) {
          navigate('/daily-limit');
        } else {
          navigate('/onboarding');
        }
      });
    } else {
      navigate('/login?error=Google+login+failed');
    }
  }, [params, navigate, refreshUser]);

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <TiPig state="thinking" size={100} />
      <h3 style={{ marginTop: '16px', fontWeight: 800, color: 'var(--green-900)' }}>
        Kinokonekta ang iyong Google Account...
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
        Sandali lamang, inihahanda ni TiPig ang iyong workspace!
      </p>
    </div>
  );
};

export default GoogleCallbackPage;
