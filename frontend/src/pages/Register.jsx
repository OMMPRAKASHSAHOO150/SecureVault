import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import PasswordStrength from '../components/PasswordStrength';
import { validateEmail, validateFullName, checkPasswordStrength } from '../utils/validators';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  // Validation Errors
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear validation error when editing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};

    const nameErr = validateFullName(formData.fullName);
    if (nameErr) newErrors.fullName = nameErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const strength = checkPasswordStrength(formData.password);
      if (strength.score < 5) {
        newErrors.password = 'Password must meet all complexity requirements';
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setServerError('');

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username || null,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.acceptTerms,
      });

      // Redirect to verification pending page
      navigate(`/verify-pending?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      // Set field-specific validation errors returned by Spring Validation if any
      if (err.errors) {
        setErrors(err.errors);
      }
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Get started with your secure password manager</p>

        {serverError && <div className="alert alert-danger">{serverError}</div>}

        <form onSubmit={handleSubmit}>
          <InputField
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
            placeholder="John Doe"
            required
          />

          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="john@example.com"
            required
          />

          <InputField
            label="Username (Optional)"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            placeholder="johndoe"
          />

          <InputField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="••••••••"
            required
          />

          {formData.password && (
            <PasswordStrength password={formData.password} />
          )}

          <div style={{ height: '10px' }} />

          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="••••••••"
            required
          />

          <label className="checkbox-group">
            <input
              name="acceptTerms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="checkbox-control"
            />
            <span className="checkbox-label">
              I accept the <a href="#terms">Terms & Conditions</a> and <a href="#privacy">Privacy Policy</a>
            </span>
          </label>
          {errors.acceptTerms && (
            <div className="form-error" style={{ marginTop: '-1rem', marginBottom: '1.25rem' }}>
              {errors.acceptTerms}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" />
                <span>Creating Account...</span>
              </div>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
