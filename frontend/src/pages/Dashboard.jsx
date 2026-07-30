import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/authApi';

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [apiLoading, setApiLoading] = useState(true);

  // Redirection if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Load profile via protected API endpoint
  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      try {
        setApiLoading(true);
        const res = await api.get('/api/auth/me');
        setProfile(res.data);
      } catch (err) {
        setLoadError('Failed to verify profile session with the server.');
      } finally {
        setApiLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Mock Vault Credentials for Vault UX theme
  const mockCredentials = [
    { id: 1, site: 'Google Account', username: 'om.prakash@gmail.com', strength: 'Strong', updated: '2 days ago' },
    { id: 2, site: 'GitHub Profile', username: 'op_sahoo_dev', strength: 'Strong', updated: '1 week ago' },
    { id: 3, site: 'Stripe Merchant', username: 'om@sahoo-corp.com', strength: 'Medium', updated: '3 weeks ago' },
  ];

  if (loading || (!user && !loadError)) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem', borderWidth: '3px' }} />
          <p>Loading your secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Secure Vault Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Welcome back, <strong style={{ color: '#fff' }}>{user?.name}</strong>. Your credentials are encrypted.
            </p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
            Sign Out
          </button>
        </div>

        {loadError && <div className="alert alert-danger">{loadError}</div>}

        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#fff' }}>Session Profile (Protected API Result)</h3>
        {apiLoading ? (
          <div style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Verifying credentials...</div>
        ) : profile ? (
          <div className="user-profile-grid">
            <div className="profile-item">
              <div className="profile-label">Database ID</div>
              <div className="profile-value">{profile.id}</div>
            </div>
            <div className="profile-item">
              <div className="profile-label">Full Name</div>
              <div className="profile-value">{profile.name}</div>
            </div>
            <div className="profile-item">
              <div className="profile-label">Email Address</div>
              <div className="profile-value">{profile.email}</div>
            </div>
            <div className="profile-item">
              <div className="profile-label">Security Role</div>
              <div className="profile-value">
                <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)', fontWeight: 'bold' }}>
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Saved Credentials</h3>
            <button 
              className="btn btn-primary" 
              style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={() => alert('New credential addition form is not implemented in this authentication scope.')}
            >
              + Add Item
            </button>
          </div>
          
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Resource</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Username / Identifier</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Security</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {mockCredentials.map((cred) => (
                  <tr key={cred.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>{cred.site}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{cred.username}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: cred.strength === 'Strong' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: cred.strength === 'Strong' ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 'bold' }}>
                        {cred.strength}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{cred.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
