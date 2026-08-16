import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login mode: 'email' or 'username'
  const [loginMode, setLoginMode] = useState('email');

  const [formData, setFormData] = useState({
    identifier: '', // Email or Username
    password: '',
    rememberMe: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setLoginMode((prev) => (prev === 'email' ? 'username' : 'email'));
    setFormData((prev) => ({ ...prev, identifier: '' }));
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData.identifier, formData.password);
      // Successful login -> Redirect to protected dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to manage your vault credentials</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button
              type="button"
              onClick={toggleMode}
              className="toggle-login-method"
            >
              Use {loginMode === 'email' ? 'Username' : 'Email Address'} instead
            </button>
            
            <InputField
              label={loginMode === 'email' ? 'Email Address' : 'Username'}
              name="identifier"
              type={loginMode === 'email' ? 'email' : 'text'}
              value={formData.identifier}
              onChange={handleChange}
              placeholder={
                loginMode === 'email'
                  ? 'enter your registered email'
                  : 'enter your username'
              }
              required
            />
          </div>

          <InputField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem',
              marginTop: '-0.5rem' 
            }}
          >
            <label className="checkbox-group" style={{ marginBottom: 0 }}>
              <input
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="checkbox-control"
              />
              <span className="checkbox-label">Remember me</span>
            </label>
            
            <Link 
              to="/forgot-password" 
              className="auth-link" 
              style={{ fontSize: '0.8rem', fontWeight: '500' }}
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" />
                <span>Verifying...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
