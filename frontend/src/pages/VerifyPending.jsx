import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyPending = () => {
  const { resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleResend = async () => {
    if (!email) {
      setErrorMessage('No email address provided.');
      return;
    }
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const data = await resendVerification(email);
      setSuccessMessage(data.message || 'Verification email resent successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div 
          style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1.5rem',
            color: 'var(--accent-blue)'
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <h2 className="auth-title">Verify Your Email</h2>
        <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
          We have sent a verification link to <br />
          <strong style={{ color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>{email || 'your email address'}</strong>
        </p>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Please click the verification link inside that email to activate your account. If you don't see it, check your spam/junk folder.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleResend}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" />
                <span>Resending...</span>
              </div>
            ) : (
              'Resend Verification Email'
            )}
          </button>
          
          <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyPending;
