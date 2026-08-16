import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, {
  createVaultEntry,
  deleteVaultEntry,
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
    try {
      setVaultLoading(true);
      setSharedLoading(true);
      const [vaultRes, sharedRes] = await Promise.all([listVaultEntries(), listSharedVaultEntries()]);
      setVaultEntries(vaultRes.data);
      setSharedEntries(sharedRes.data);
    } catch {
      setVaultError('Failed to load vault entries.');
      setSharedError('Failed to load shared entries.');
    } finally {
      setVaultLoading(false);
      setSharedLoading(false);
    }
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

  const handleDelete = async (id) => {
    setVaultError('');
    try {
      await deleteVaultEntry(id);
      setVaultEntries((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setVaultError(err.response?.data?.message || 'Unable to delete password entry.');
    }
  };

  const copyPassword = async (password) => navigator.clipboard.writeText(password);

  const availableShareTargets = useMemo(() => vaultEntries.map((entry) => ({ id: entry.id, title: entry.title })), [vaultEntries]);
  const vaultCount = vaultEntries.length;
  const sharedCount = sharedEntries.length;

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
                  <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => handleDelete(entry.id)}>
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="vault-item-body">
            <div>{entry.websiteUrl || 'No website saved'}</div>
            <div className="vault-password">{showPasswordFor === entry.id ? entry.password : '••••••••••••'}</div>
            {entry.notes ? <div className="vault-note">{entry.notes}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );

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
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
            Sign Out
          </button>
        </div>

        {loadError && <div className="alert alert-danger">{loadError}</div>}

        <div className="dashboard-metrics">
          <div className="metric-card"><div className="metric-label">Session</div><div className="metric-value">{profile ? 'Active' : 'Checking'}</div></div>
          <div className="metric-card"><div className="metric-label">My Items</div><div className="metric-value">{vaultCount}</div></div>
          <div className="metric-card"><div className="metric-label">Shared With Me</div><div className="metric-value">{sharedCount}</div></div>
        </div>

        <div className="section-tabs">
          <button className={`tab-button ${view === 'mine' ? 'active' : ''}`} onClick={() => setView('mine')} type="button">My Vault</button>
          <button className={`tab-button ${view === 'shared' ? 'active' : ''}`} onClick={() => setView('shared')} type="button">Shared Vault</button>
        </div>

        <div className="section-header">
          <div>
            <h3 className="section-title">{view === 'mine' ? 'Password Vault' : 'Shared Credentials'}</h3>
            <p className="section-subtitle">
              {view === 'mine' ? 'Create, update, and share your stored credentials.' : 'Open credentials shared to your account.'}
            </p>
          </div>
          <div className="vault-count">{view === 'mine' ? `${vaultCount} saved` : `${sharedCount} shared`}</div>
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
          </div>
        ) : (
          <div className="vault-panel">
            {sharedLoading ? <div className="empty-state">Loading shared entries...</div> : sharedEntries.length === 0 ? <div className="empty-state">No shared credentials yet.</div> : renderVaultList(sharedEntries, true)}
            {sharedError ? <div className="alert alert-danger" style={{ marginTop: '1rem' }}>{sharedError}</div> : null}
          </div>
        )}

        {apiLoading ? <div className="empty-state" style={{ marginTop: '1rem' }}>Verifying credentials...</div> : null}
      </div>
    </div>
  );
};

export default Dashboard;
