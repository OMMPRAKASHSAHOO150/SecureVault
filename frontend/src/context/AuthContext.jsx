import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api, { setAccessToken, forgotPassword, verifyResetOtp, resetPassword } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Silent refresh on mount/refresh
  const checkSession = useCallback(async () => {
    try {
      // Attempt to refresh the access token silently
      const res = await api.post('/api/auth/refresh-token', {});
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
    } catch (err) {
      // Failed silently (user is not logged in or cookie expired)
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();

    // Listen for session expiration events from axios interceptor
    const handleSessionExpired = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, [checkSession]);

  const login = async (emailOrUsername, password) => {
    setAuthError(null);
    try {
      const res = await api.post('/api/auth/login', { emailOrUsername, password });
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await api.post('/api/auth/register', userData);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      const errors = err.response?.data?.errors;
      const errorObj = new Error(message);
      errorObj.errors = errors;
      throw errorObj;
    }
  };

  const verifyEmail = async (token) => {
    try {
      const res = await api.get(`/api/auth/verify?token=${token}`);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed.';
      throw new Error(message);
    }
  };

  const resendVerification = async (email) => {
    try {
      const res = await api.post('/api/auth/resend-verification', { email });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend verification.';
      throw new Error(message);
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const res = await forgotPassword(email);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to request password reset.';
      throw new Error(message);
    }
  };

  const confirmResetOtp = async (email, otp) => {
    try {
      const res = await verifyResetOtp(email, otp);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'OTP verification failed.';
      throw new Error(message);
    }
  };

  const submitNewPassword = async (email, otp, newPassword) => {
    try {
      const res = await resetPassword(email, otp, newPassword);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed.';
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (err) {
      console.error('Logout error on server', err);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        register,
        verifyEmail,
        resendVerification,
        requestPasswordReset,
        confirmResetOtp,
        submitNewPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
