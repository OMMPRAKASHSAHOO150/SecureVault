import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InputField from '../components/InputField';
import PasswordStrength from '../components/PasswordStrength';
import { useAuth } from '../context/AuthContext';
import { checkPasswordStrength, validateEmail } from '../utils/validators';

const ForgotPassword = () => {
  const { requestPasswordReset, confirmResetOtp, submitNewPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('request');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const passwordStrength = useMemo(
    () => checkPasswordStrength(formData.newPassword),
    [formData.newPassword]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      const data = await requestPasswordReset(formData.email);
      setSuccess(data.message || 'OTP sent to your email.');
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!formData.otp) {
      setError('OTP is required.');
      return;
    }

    setLoading(true);
    try {
      const data = await confirmResetOtp(formData.email, formData.otp);
      setSuccess(data.message || 'OTP verified successfully.');
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (passwordStrength.score < 5) {
      setError('Password must meet the strength requirements.');
      return;
    }

    setLoading(true);
    try {
      const data = await submitNewPassword(formData.email, formData.otp, formData.newPassword);
      setSuccess(data.message || 'Password reset successful.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">
          {step === 'request' && 'Enter your registered email to receive a one-time password.'}
          {step === 'verify' && 'Enter the OTP sent to your email.'}
          {step === 'reset' && 'Create a new password for your account.'}
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {step === 'request' && (
          <form onSubmit={handleRequestOtp}>
            <InputField
              label="Registered Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span>Sending OTP...</span> : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp}>
            <InputField
              label="Registered Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <InputField
              label="OTP"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              placeholder="6-digit code"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span>Verifying OTP...</span> : 'Verify OTP'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <InputField
              label="Registered Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <InputField
              label="OTP"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              required
            />
            <InputField
              label="New Password"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
            {formData.newPassword && <PasswordStrength password={formData.newPassword} />}
            <div style={{ height: '10px' }} />
            <InputField
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span>Resetting Password...</span> : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
