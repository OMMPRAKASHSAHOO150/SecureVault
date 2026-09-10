import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, {
  createVaultEntry,
  deleteVaultEntry,
  getLoginActivity,
  getSecurityOverview,
  listSharedVaultEntries,
  listVaultEntries,
  shareVaultEntry,
  updateVaultEntry,
} from '../api/authApi';
import PasswordStrength from '../components/PasswordStrength';

const emptyForm = { title: '', loginName: '', websiteUrl: '', password: '', notes: '' };

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [apiLoading, setApiLoading] = useState(true);
  const [vaultEntries, setVaultEntries] = useState([]);
  const [sharedEntries, setSharedEntries] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(true);
  const [sharedLoading, setSharedLoading] = useState(true);
  const [vaultError, setVaultError] = useState('');
  const [sharedError, setSharedError] = useState('');
  const [loginActivity, setLoginActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [securityOverview, setSecurityOverview] = useState(null);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securityError, setSecurityError] = useState('');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [view, setView] = useState('mine');
  const [editingId, setEditingId] = useState(null);
  const [showPasswordFor, setShowPasswordFor] = useState(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [shareForm, setShareForm] = useState({ passwordEntryId: '', recipientEmail: '', permission: 'VIEW_ONLY' });
  const [shareMessage, setShareMessage] = useState('');
  const sharePanelRef = React.useRef(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowPasswordField(false);
  };

  const refreshData = async () => {
    setVaultLoading(true);
    setSharedLoading(true);
    setVaultError('');
    setSharedError('');
    setSecurityError('');

    const [vaultResult, sharedResult] = await Promise.allSettled([
      listVaultEntries(),
      listSharedVaultEntries(),
    ]);
    const [activityResult, securityResult] = await Promise.allSettled([
      getLoginActivity(),
      getSecurityOverview(),
    ]);

    if (vaultResult.status === 'fulfilled') {
      setVaultEntries(vaultResult.value.data);
    } else {
      setVaultError(
        vaultResult.reason?.response?.data?.message || 'Failed to load vault entries.'
      );
    }

    if (sharedResult.status === 'fulfilled') {
      setSharedEntries(sharedResult.value.data);
    } else {
      setSharedError(
        sharedResult.reason?.response?.data?.message || 'Failed to load shared entries.'
      );
    }

    setVaultLoading(false);
    setSharedLoading(false);
    if (activityResult.status === 'fulfilled') {
      setLoginActivity(activityResult.value.data);
    }
    setActivityLoading(false);
    if (securityResult.status === 'fulfilled') {
      setSecurityOverview(securityResult.value.data);
    } else {
      setSecurityError(securityResult.reason?.response?.data?.message || 'Failed to load security overview.');
    }
    setSecurityLoading(false);
  };

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        setApiLoading(true);
        const res = await api.get('/api/auth/me');
        setProfile(res.data);
      } catch {
        setLoadError('Failed to verify profile session with the server.');
      } finally {
        setApiLoading(false);
      }
    };
    fetchProfile();
    refreshData();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleShareChange = (e) => setShareForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVaultError('');
    try {
      if (editingId) {
        const res = await updateVaultEntry(editingId, form);
        setVaultEntries((prev) => prev.map((item) => (item.id === editingId ? res.data : item)));
      } else {
        const res = await createVaultEntry(form);
        setVaultEntries((prev) => [res.data, ...prev]);
      }
      resetForm();
    } catch (err) {
      setVaultError(err.response?.data?.message || 'Unable to save password entry.');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setShareMessage('');
    try {
      await shareVaultEntry({
        passwordEntryId: Number(shareForm.passwordEntryId),
        recipientEmail: shareForm.recipientEmail,
        permission: shareForm.permission,
      });
      setShareMessage('Share saved.');
      setShareForm({ passwordEntryId: '', recipientEmail: '', permission: 'VIEW_ONLY' });
      refreshData();
    } catch (err) {
      setShareMessage(err.response?.data?.message || 'Unable to share credential.');
    }
  };

  const startShare = (entryId) => {
    setView('mine');
    setShareForm((prev) => ({ ...prev, passwordEntryId: String(entryId) }));
    window.requestAnimationFrame(() => {
      sharePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      title: entry.title || '',
      loginName: entry.loginName || '',
      websiteUrl: entry.websiteUrl || '',
      password: entry.password || '',
      notes: entry.notes || '',
    });
  };

  const handleDelete = async (entry) => {
    setVaultError('');
    try {
      if (entry.shareId) {
        await api.delete(`/api/vault/share/${entry.shareId}`);
        setSharedEntries((prev) => prev.filter((item) => item.shareId !== entry.shareId));
      } else {
        await deleteVaultEntry(entry.id);
        setVaultEntries((prev) => prev.filter((item) => item.id !== entry.id));
        if (editingId === entry.id) resetForm();
      }
    } catch (err) {
      setVaultError(err.response?.data?.message || 'Unable to delete password entry.');
    }
  };

  const copyPassword = async (password) => navigator.clipboard.writeText(password);

  const availableShareTargets = useMemo(() => vaultEntries.map((entry) => ({ id: entry.id, title: entry.title })), [vaultEntries]);
  const filteredActivities = useMemo(() => {
    const activities = loginActivity?.recentActivities || [];
    if (activityFilter === 'SUCCESS') return activities.filter((item) => item.status === 'SUCCESS');
    if (activityFilter === 'FAILED') return activities.filter((item) => item.status === 'FAILED');
    return activities;
  }, [loginActivity, activityFilter]);
  const vaultCount = vaultEntries.length;
  const sharedCount = sharedEntries.length;
  const alertCount = securityOverview?.securityAlerts?.length ?? 0;
  const suspiciousCount = securityOverview?.suspiciousActivities?.length ?? 0;

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

  const renderVaultList = (entries, isShared = false) => (
    <div className="vault-list">
      {entries.map((entry) => (
        <div key={entry.id} className="vault-item">
          {isShared ? (
            <div className="vault-item-meta" style={{ marginBottom: '0.35rem' }}>
              Access: {entry.permission || 'VIEW_ONLY'}
            </div>
          ) : null}
          <div className="vault-item-head">
            <div>
              <div className="vault-item-title">{entry.title}</div>
              <div className="vault-item-meta">{entry.loginName}</div>
              {isShared ? <div className="vault-item-meta">Shared credential</div> : null}
            </div>
            <div className="vault-item-buttons">
              <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => setShowPasswordFor((prev) => (prev === entry.id ? null : entry.id))}>
                {showPasswordFor === entry.id ? 'Hide' : 'Show'}
              </button>
              <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => copyPassword(entry.password)}>
                Copy
              </button>
              {!isShared && (
                <>
                  <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => startShare(entry.id)}>
                    Share
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => startEdit(entry)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => handleDelete(entry)}>
                    Remove
                  </button>
                </>
              )}
              {isShared && entry.permission !== 'VIEW_ONLY' ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: 'auto', padding: '0.45rem 0.8rem' }}
                  onClick={() => startEdit(entry)}
                >
                  Edit
                </button>
              ) : null}
              {isShared && entry.permission === 'FULL_MANAGEMENT' ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: 'auto', padding: '0.45rem 0.8rem' }}
                  onClick={() => handleDelete(entry)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
          <div className="vault-item-body">
            <div>{entry.websiteUrl || 'No website saved'}</div>
            <div className="vault-password">{showPasswordFor === entry.id ? entry.password : '••••••••••••'}</div>
            {entry.notes ? <div className="vault-note">{entry.notes}</div> : null}
            {isShared ? <div className="vault-note">Permission: {entry.permission || 'VIEW_ONLY'}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSharedContent = () => {
    if (sharedLoading) {
      return <div className="empty-state">Loading shared entries...</div>;
    }

    if (sharedError) {
      return (
        <>
          <div className="alert alert-danger">{sharedError}</div>
          <div className="empty-state" style={{ marginTop: '1rem' }}>
            Shared vault could not be loaded.
          </div>
        </>
      );
    }

    if (sharedEntries.length === 0) {
      return <div className="empty-state">No shared credentials yet.</div>;
    }

    return renderVaultList(sharedEntries, true);
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Secure Vault Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome back, <strong style={{ color: '#fff' }}>{user?.name}</strong>. Manage your credentials and share them with access controls.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
              Security Analytics
            </button>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
              Sign Out
            </button>
          </div>
        </div>

        {loadError && <div className="alert alert-danger">{loadError}</div>}

        <div className="dashboard-metrics">
          <div className="metric-card"><div className="metric-label">Session</div><div className="metric-value">{profile ? 'Active' : 'Checking'}</div></div>
          <div className="metric-card"><div className="metric-label">My Items</div><div className="metric-value">{vaultCount}</div></div>
          <div className="metric-card"><div className="metric-label">Shared With Me</div><div className="metric-value">{sharedCount}</div></div>
          <div className="metric-card"><div className="metric-label">Total Attempts</div><div className="metric-value">{loginActivity?.totalAttempts ?? 0}</div></div>
          <div className="metric-card"><div className="metric-label">Failed Logins</div><div className="metric-value">{loginActivity?.failedAttempts ?? 0}</div></div>
          <div className="metric-card"><div className="metric-label">Alerts</div><div className="metric-value">{alertCount}</div></div>
        </div>

        <div className="section-tabs">
          <button className={`tab-button ${view === 'mine' ? 'active' : ''}`} onClick={() => setView('mine')} type="button">My Vault</button>
          <button className={`tab-button ${view === 'shared' ? 'active' : ''}`} onClick={() => setView('shared')} type="button">Shared Vault</button>
          <button className={`tab-button ${view === 'security' ? 'active' : ''}`} onClick={() => setView('security')} type="button">Security</button>
        </div>

        <div className="section-header">
          <div>
            <h3 className="section-title">{view === 'mine' ? 'Password Vault' : view === 'shared' ? 'Shared Credentials' : 'Security Overview'}</h3>
            <p className="section-subtitle">
              {view === 'mine'
                ? 'Create, update, and share your stored credentials.'
                : view === 'shared'
                  ? 'Open credentials shared to your account.'
                  : 'Review alerts, suspicious activity, and audit history.'}
            </p>
          </div>
          <div className="vault-count">
            {view === 'mine' ? `${vaultCount} saved` : view === 'shared' ? `${sharedCount} shared` : `${suspiciousCount} flagged`}
          </div>
        </div>

        {view === 'mine' ? (
          <div className="vault-grid">
            <div className="vault-panel" ref={sharePanelRef}>
              <div className="vault-panel-title">Share credential</div>
              <div className="vault-panel-note">Use this panel to share any password already stored in your vault.</div>
              <form className="vault-form" onSubmit={handleShare}>
                <select className="form-control" name="passwordEntryId" value={shareForm.passwordEntryId} onChange={handleShareChange} required>
                  <option value="">Select credential</option>
                  {availableShareTargets.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
                </select>
                <input className="form-control" name="recipientEmail" value={shareForm.recipientEmail} onChange={handleShareChange} placeholder="Recipient email" required />
                <select className="form-control" name="permission" value={shareForm.permission} onChange={handleShareChange}>
                  <option value="VIEW_ONLY">View Only</option>
                  <option value="EDIT_ACCESS">Edit Access</option>
                  <option value="FULL_MANAGEMENT">Full Management</option>
                </select>
                <button type="submit" className="btn btn-primary">Share</button>
              </form>
              {shareMessage ? <div className="alert alert-success" style={{ marginTop: '1rem' }}>{shareMessage}</div> : null}
            </div>

            <form className="vault-panel" onSubmit={handleSubmit}>
              <div className="vault-panel-title">{editingId ? 'Edit entry' : 'Add entry'}</div>
              <div className="vault-panel-note">Keep the title short and use the login field for the account identity.</div>
              <div className="vault-form">
                <input className="form-control" name="title" value={form.title} onChange={handleChange} placeholder="Service name" required />
                <input className="form-control" name="loginName" value={form.loginName} onChange={handleChange} placeholder="Username or email" required />
                <input className="form-control" name="websiteUrl" value={form.websiteUrl} onChange={handleChange} placeholder="Website URL" />
                <div className="password-row">
                  <input className="form-control" name="password" type={showPasswordField ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Password" required />
                  <div className="password-row-actions">
                    <button type="button" className="btn btn-secondary password-generate-btn" onClick={() => {
                      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.?';
                      const bytes = new Uint32Array(16);
                      window.crypto?.getRandomValues?.(bytes);
                      const password = Array.from(bytes, (value) => charset[value % charset.length]).join('');
                      setForm((prev) => ({ ...prev, password }));
                      setShowPasswordField(true);
                    }}>
                      Generate
                    </button>
                    <button type="button" className="btn btn-secondary password-generate-btn" onClick={() => setShowPasswordField((prev) => !prev)} disabled={!form.password}>
                      {showPasswordField ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                {form.password ? <PasswordStrength password={form.password} /> : null}
                <textarea className="form-control vault-notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" />
              </div>
              <div className="vault-actions">
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>{editingId ? 'Update' : 'Save'}</button>
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={resetForm}>Clear</button>
              </div>
              {vaultError ? <div className="alert alert-danger" style={{ marginTop: '1rem' }}>{vaultError}</div> : null}
            </form>

            <div className="vault-panel">
              <div className="vault-panel-title">Stored passwords</div>
              <div className="vault-panel-note">Each credential has a Share action next to it for quick access.</div>
              <div style={{ marginTop: '1.25rem' }}>
                {vaultLoading ? <div className="empty-state">Loading vault entries...</div> : vaultEntries.length === 0 ? <div className="empty-state">No saved passwords yet.</div> : renderVaultList(vaultEntries)}
              </div>
            </div>

            <div className="vault-panel">
              <div className="vault-panel-title">Login monitoring</div>
              <div className="vault-panel-note">Recent successful and failed sign-ins for this account.</div>
              <div style={{ marginTop: '0.9rem', marginBottom: '0.8rem', maxWidth: '240px' }}>
                <select
                  className="form-control"
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  aria-label="Filter login activity"
                >
                  <option value="ALL">All activity</option>
                  <option value="SUCCESS">Login activity</option>
                  <option value="FAILED">Failed activity</option>
                </select>
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                {activityLoading ? (
                  <div className="empty-state">Loading login activity...</div>
                ) : filteredActivities.length ? (
                  <div className="vault-list">
                    {filteredActivities.map((item, index) => (
                      <div key={`${item.status}-${item.createdAt}-${index}`} className="vault-item">
                        <div className="vault-item-head">
                          <div>
                            <div className="vault-item-title">{item.status}</div>
                            <div className="vault-item-meta">
                              Attempts: {item.attemptNumber || 0}
                            </div>
                          </div>
                          <div className="vault-item-meta">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                          </div>
                        </div>
                        <div className="vault-item-body">
                          <div>{item.failureReason || 'Authenticated successfully'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    {activityFilter === 'ALL' ? 'No login events recorded yet.' : 'No matching activity found.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : view === 'shared' ? (
          <div className="vault-panel">
            {renderSharedContent()}
          </div>
        ) : (
          <div className="security-grid">
            <div className="security-panel">
              <div className="vault-panel-title">Security Alerts</div>
              <div className="vault-panel-note">High-priority notifications generated from suspicious activity.</div>
              {securityLoading ? (
                <div className="empty-state">Loading security alerts...</div>
              ) : securityError ? (
                <div className="alert alert-danger">{securityError}</div>
              ) : (securityOverview?.securityAlerts?.length ?? 0) > 0 ? (
                <div className="vault-list">
                  {securityOverview.securityAlerts.map((alert) => (
                    <div key={alert.id} className="vault-item">
                      <div className="vault-item-head">
                        <div>
                          <div className="vault-item-title">⚠ {alert.alertType?.replaceAll('_', ' ')}</div>
                          <div className="vault-item-meta">Severity: {alert.severity}</div>
                        </div>
                        <div className="vault-item-meta">{alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString() : ''}</div>
                      </div>
                      <div className="vault-item-body">
                        <div>{alert.message}</div>
                        <div>Status: {alert.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No security alerts recorded.</div>
              )}
            </div>

            <div className="security-panel">
              <div className="vault-panel-title">Suspicious Activity</div>
              <div className="vault-panel-note">Login activity that crossed the configured threshold.</div>
              {securityLoading ? (
                <div className="empty-state">Loading suspicious activity...</div>
              ) : (securityOverview?.suspiciousActivities?.length ?? 0) > 0 ? (
                <div className="vault-list">
                  {securityOverview.suspiciousActivities.map((item) => (
                    <div key={item.id} className="vault-item">
                      <div className="vault-item-head">
                        <div>
                          <div className="vault-item-title">{item.activityType?.replaceAll('_', ' ')}</div>
                          <div className="vault-item-meta">Failed attempts: {item.failedAttempts}</div>
                        </div>
                        <div className="vault-item-meta">{item.detectedAt ? new Date(item.detectedAt).toLocaleTimeString() : ''}</div>
                      </div>
                      <div className="vault-item-body">
                        <div>{item.description}</div>
                        <div>Status: {item.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No suspicious activity detected yet.</div>
              )}
            </div>

            <div className="security-panel security-panel-wide">
              <div className="vault-panel-title">Audit Logs</div>
              <div className="vault-panel-note">Important security and login events in chronological order.</div>
              {securityLoading ? (
                <div className="empty-state">Loading audit logs...</div>
              ) : (securityOverview?.auditLogs?.length ?? 0) > 0 ? (
                <div className="vault-list">
                  {securityOverview.auditLogs.map((item) => (
                    <div key={item.id} className="vault-item">
                      <div className="vault-item-head">
                        <div className="vault-item-title">{item.action.replaceAll('_', ' ')}</div>
                        <div className="vault-item-meta">{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}</div>
                      </div>
                      <div className="vault-item-body">
                        <div>{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No audit logs recorded yet.</div>
              )}
            </div>
          </div>
        )}

        {apiLoading ? <div className="empty-state" style={{ marginTop: '1rem' }}>Verifying credentials...</div> : null}
      </div>
    </div>
  );
};

export default Dashboard;
