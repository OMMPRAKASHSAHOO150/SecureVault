import React, { useEffect, useState, useMemo } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { 
    Shield, Home, Bell, AlertTriangle, FileText, Users, Settings, BarChart2, 
    Calendar, Lock, Globe, ClipboardList, AlertCircle, XCircle, KeyRound,
    Menu, CheckCircle2, ArrowRight, Activity, Zap, PlayCircle, FileDown
} from 'lucide-react';
import '../index.css';

const SecurityAnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [now, setNow] = useState(new Date());
    const navigate = useNavigate();
    const { user, loading: authLoading, logout } = useAuth();

    // Live clock timer updating every 1s
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auth guard: redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!user) return;
        const fetchAnalytics = async () => {
            try {
                const data = await analyticsApi.getAnalytics();
                setAnalytics(data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
                setError("Failed to load security analytics dashboard.");
                setLoading(false);
            }
        };

        fetchAnalytics();
        const pollInterval = setInterval(() => {
            fetchAnalytics();
        }, 3000);
        return () => clearInterval(pollInterval);
    }, [user]);

    const alertsSeverityData = useMemo(() => {
        const high = analytics?.recentAlerts?.filter(a => a.severity === 'HIGH').length || analytics?.securityAlertsCount || 0;
        const medium = analytics?.recentAlerts?.filter(a => a.severity === 'MEDIUM').length || 0;
        const low = analytics?.recentAlerts?.filter(a => a.severity === 'LOW').length || 0;
        return [
            { name: 'HIGH', value: high },
            { name: 'MEDIUM', value: medium },
            { name: 'LOW', value: low }
        ];
    }, [analytics]);

    // Build audit event timeline items from real data
    const auditTimelineItems = useMemo(() => {
        if (!analytics?.recentAuditLogs || analytics.recentAuditLogs.length === 0) return [];
        return analytics.recentAuditLogs.slice(0, 8).map(log => {
            let icon;
            const action = log.action || '';
            if (action.includes('LOGIN_FAILED') || action.includes('FAILED')) {
                icon = <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
            } else if (action.includes('SUSPICIOUS') || action.includes('FLAGGED')) {
                icon = <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
            } else if (action.includes('ALERT') || action.includes('SECURITY')) {
                icon = <Shield className="w-4 h-4 text-red-500 shrink-0" />;
            } else {
                icon = <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
            }
            const logTime = log.timestamp || log.createdAt;
            const date = logTime ? new Date(logTime) : null;
            let timeStr = date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : '';
            if (date) {
                const diffSec = Math.floor((now - date) / 1000);
                if (diffSec < 5) timeStr += ' (just now)';
                else if (diffSec < 60) timeStr += ` (${diffSec}s ago)`;
                else if (diffSec < 3600) timeStr += ` (${Math.floor(diffSec / 60)}m ago)`;
            }
            const text = action.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            return { icon, text, time: timeStr, id: log.id, details: log.details || 'System activity logged' };
        });
    }, [analytics, now]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-screen bg-[#0B1120] items-center justify-center">
                <div className="text-center">
                    <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem', borderWidth: '3px', color: '#3b82f6' }} />
                    <p className="text-gray-400">Loading security dashboard...</p>
                </div>
            </div>
        );
    }
    if (error) return <div className="h-screen bg-[#0B1120] flex items-center justify-center text-red-500">{error}</div>;

    const totalFailedLogins = analytics?.failedLogins || 0;
    const totalAlerts = analytics?.securityAlertsCount || 0;
    const totalSuspicious = analytics?.suspiciousActivitiesCount || 0;
    const uniqueIPs = analytics?.uniqueIPs || 1;
    const totalAuditEvents = analytics?.recentAuditLogs?.length || 0;

    return (
        <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-[#0B1120] text-gray-300 font-sans overflow-x-hidden lg:overflow-hidden">
            
            {/* RESPONSIVE SIDEBAR */}
            <Sidebar 
                isOpen={isMobileMenuOpen} 
                onClose={() => setIsMobileMenuOpen(false)} 
                totalAlerts={totalAlerts} 
                alertsSeverityData={alertsSeverityData} 
                user={user} 
                handleLogout={handleLogout} 
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto lg:overflow-hidden">
                
                {/* Mobile Header Bar */}
                <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0F172A] border-b border-[#1E293B] sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors"
                            aria-label="Open Navigation Menu"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-500" />
                            <span className="font-bold text-white tracking-wide text-lg">SecureVault</span>
                        </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800/50 font-medium">
                        {user?.role || 'USER'}
                    </span>
                </div>

                {/* Dashboard Header */}
                <div className="px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0 border-b border-[#1E293B]/40 lg:border-none">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">SecureVault</h1>
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> LIVE MONITORED
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                                {now.toLocaleTimeString()}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400">Real-time endpoint security monitoring and access control</p>
                    </div>
                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <button 
                            onClick={() => navigate('/vault')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-blue-600/25"
                        >
                            <KeyRound size={16} /> Open Password Vault
                        </button>
                        <button className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#334155] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-[#334155] text-gray-200">
                            Last 24 Hours <Calendar size={15} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Main Content Body */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 custom-scrollbar space-y-6">
                    
                    {/* Top Executive Stats Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        <StatCard 
                            title="Critical Alerts" value={totalAlerts} subtitle="Requires Attention" 
                            icon={<Shield className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />}
                            color="text-red-500" borderColor="border-red-900/40" bgColor="bg-red-950/30"
                            onClick={() => navigate('/alerts')}
                        />
                        <StatCard 
                            title="Suspicious Activity" value={totalSuspicious} subtitle="Potential Anomalies" 
                            icon={<AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500" />}
                            color="text-yellow-500" borderColor="border-yellow-900/40" bgColor="bg-yellow-950/30"
                            onClick={() => navigate('/suspicious-activity')}
                        />
                        <StatCard 
                            title="Failed Logins" value={totalFailedLogins} subtitle="Observed Attempts" 
                            icon={<Lock className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />}
                            color="text-blue-500" borderColor="border-blue-900/40" bgColor="bg-blue-950/30"
                            onClick={() => navigate('/reports')}
                        />
                        <StatCard 
                            title="Active IPs" value={uniqueIPs} subtitle="Currently Engaged" 
                            icon={<Globe className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />}
                            color="text-emerald-500" borderColor="border-emerald-900/40" bgColor="bg-emerald-950/30"
                            onClick={() => navigate('/suspicious-activity')}
                        />
                        <StatCard 
                            title="Audit Events" value={totalAuditEvents} subtitle="System Interactions" 
                            icon={<ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-purple-500" />}
                            color="text-purple-500" borderColor="border-purple-900/40" bgColor="bg-purple-950/30"
                            onClick={() => navigate('/audit-logs')}
                        />
                    </div>

                    {/* Quick Action Navigation Bar */}
                    <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl p-4 shadow-lg">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Navigation & Operations</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <ActionButton 
                                icon={<KeyRound className="w-5 h-5 text-blue-400" />}
                                label="Password Vault"
                                description="Manage credentials"
                                onClick={() => navigate('/vault')}
                            />
                            <ActionButton 
                                icon={<Bell className="w-5 h-5 text-red-400" />}
                                label="Security Alerts"
                                description={`${totalAlerts} Active Flagged`}
                                onClick={() => navigate('/alerts')}
                            />
                            <ActionButton 
                                icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />}
                                label="Suspicious Activity"
                                description="Review threat logs"
                                onClick={() => navigate('/suspicious-activity')}
                            />
                            <ActionButton 
                                icon={<BarChart2 className="w-5 h-5 text-purple-400" />}
                                label="Security Reports"
                                description="Export health reports"
                                onClick={() => navigate('/reports')}
                            />
                        </div>
                    </div>

                    {/* Real-Time Feeds Section (Replacing Graphs) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Real-Time Security Alert Feed */}
                        <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl p-5 shadow-lg flex flex-col">
                            <div className="flex items-center justify-between mb-4 border-b border-[#1E293B] pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-red-950/40 border border-red-900/50">
                                        <Bell className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Live Security Alert Feed</h3>
                                        <p className="text-xs text-gray-400">Latest flagged threats & access violations</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate('/alerts')} 
                                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                                >
                                    View All <ArrowRight size={14} />
                                </button>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px] custom-scrollbar pr-1">
                                {analytics?.recentAlerts && analytics.recentAlerts.length > 0 ? (
                                    analytics.recentAlerts.slice(0, 6).map((alert, index) => (
                                        <div key={alert.id || index} className="p-3.5 rounded-lg bg-[#0F172A] border border-[#1E293B] hover:border-red-900/50 transition-colors flex items-start gap-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 mt-0.5 ${
                                                alert.severity === 'HIGH' ? 'bg-red-950 text-red-400 border border-red-900/60' :
                                                alert.severity === 'MEDIUM' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900/60' :
                                                'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                                            }`}>
                                                {alert.severity}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="font-semibold text-xs text-white truncate">{alert.alertType}</span>
                                                    <span className="text-[11px] text-gray-500 shrink-0">
                                                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 truncate">{alert.message}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-gray-500 text-xs">
                                        No active security alerts recorded
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* System Status Overview Card */}
                        <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl p-5 shadow-lg flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4 border-b border-[#1E293B] pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/50">
                                            <Activity className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">System Status Overview</h3>
                                            <p className="text-xs text-gray-400">Endpoint integrity & threat prevention</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-emerald-400 font-medium">99.9% Operational</span>
                                </div>

                                {/* Status Banner */}
                                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-bold text-emerald-300">All Security Systems Active</h4>
                                            <p className="text-xs text-emerald-400/80">Firewall, Intrusion Detection, & Multi-Factor Guard operational</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Item Rows */}
                                <div className="space-y-2.5 text-xs">
                                    <StatusRow label="Authentication Gateway" status="Active" value="JWT Session Enforced" color="emerald" />
                                    <StatusRow label="Failed Login Lockout Guard" status="Enforced" value={`${totalFailedLogins} Attempts Blocked`} color="blue" />
                                    <StatusRow label="Suspicious Activity Sentinel" status="Monitoring" value={`${totalSuspicious} Flagged Events`} color="yellow" />
                                    <StatusRow label="IP Geolocation Monitoring" status="Online" value={`${uniqueIPs} IP Addresses Monitored`} color="emerald" />
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-[#1E293B] flex items-center justify-between">
                                <span className="text-xs text-gray-400">User Account: <strong className="text-white">{user?.name}</strong></span>
                                <button 
                                    onClick={() => navigate('/settings')} 
                                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                                >
                                    Security Settings →
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Audit Event Activity Logs Section */}
                    <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl p-0 shadow-lg overflow-hidden flex flex-col">
                        <div className="p-4 sm:p-5 border-b border-[#1E293B] flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-gray-200">System Audit Trail</h3>
                                <p className="text-xs text-gray-400">Verified log history of account interactions</p>
                            </div>
                            <button onClick={() => navigate('/audit-logs')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                                View Full Logs ({totalAuditEvents}) <ArrowRight size={14} />
                            </button>
                        </div>
                        
                        <div className="divide-y divide-[#1E293B]">
                            {auditTimelineItems.length > 0 ? (
                                auditTimelineItems.map((item) => (
                                    <div key={item.id} className="p-4 hover:bg-[#1E293B]/30 transition-colors flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {item.icon}
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-white truncate">{item.text}</p>
                                                <p className="text-[11px] text-gray-400 truncate">{item.details}</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-gray-400 shrink-0 font-medium">{item.time}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-xs text-gray-500">
                                    No recent audit logs available
                                </div>
                            )}
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

// Reusable Components

const StatCard = ({ title, value, subtitle, icon, color, bgColor, borderColor, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-[#121B2D] border ${borderColor} rounded-xl p-3.5 sm:p-4 shadow-lg flex flex-col justify-between hover:border-blue-500/50 hover:bg-[#1A233A] transition-all cursor-pointer group`}
    >
        <div className="flex justify-between items-start mb-2">
            <div className="min-w-0 flex-1">
                <p className={`text-[11px] sm:text-xs font-semibold mb-0.5 truncate ${color}`}>{title}</p>
                <h3 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${color}`}>{value}</h3>
            </div>
            <div className={`p-2 rounded-lg shrink-0 ${bgColor}`}>
                {icon}
            </div>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{subtitle}</p>
    </div>
);

const ActionButton = ({ icon, label, description, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-3 p-3 rounded-lg bg-[#0F172A] border border-[#1E293B] hover:border-blue-600/60 hover:bg-[#1E293B]/50 transition-all text-left group"
    >
        <div className="p-2 rounded-lg bg-[#1E293B] group-hover:bg-blue-600/20 transition-colors shrink-0">
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">{label}</p>
            <p className="text-[10px] text-gray-400 truncate">{description}</p>
        </div>
    </button>
);

const StatusRow = ({ label, status, value, color }) => (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F172A] border border-[#1E293B]">
        <span className="text-gray-300 font-medium">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-gray-400">{value}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                color === 'emerald' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' :
                color === 'yellow' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900/60' :
                'bg-blue-950 text-blue-400 border border-blue-900/60'
            }`}>
                {status}
            </span>
        </div>
    </div>
);

export default SecurityAnalyticsDashboard;
