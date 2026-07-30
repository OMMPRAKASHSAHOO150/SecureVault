import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hasCalled = useRef(false);

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Avoid double invocation in React StrictMode
    if (hasCalled.current) return;
    hasCalled.current = true;

    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please check your verification link.');
        return;
      }

      try {
        const data = await verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Your email address has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The token may be invalid or expired.');
      }
    };

    performVerification();
  }, [token, verifyEmail]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'verifying' && (
          <div style={{ padding: '2rem 0' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem', borderWidth: '3px' }} />
            <h2 className="auth-title">Verifying Email</h2>
            <p className="auth-subtitle">Securing your account, please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '1.5rem',
                color: 'var(--color-success)'
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="auth-title">Success!</h2>
            <p className="auth-subtitle" style={{ color: 'var(--color-success)', fontWeight: '600' }}>
              {message}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Your account is now active and ready. You can log in to start saving your passwords securely.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Proceed to Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '1.5rem',
                color: 'var(--color-danger)'
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="auth-title">Verification Failed</h2>
            <p className="auth-subtitle" style={{ color: 'var(--color-danger)', fontWeight: '600', marginBottom: '1.5rem' }}>
              {message}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
              The verification link might have expired (valid for 24 hours), already been used, or contains typos.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Go to Sign In
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                Back to Registration
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
