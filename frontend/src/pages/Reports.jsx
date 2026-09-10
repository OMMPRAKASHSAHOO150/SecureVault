import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPasswordHealthReport, getLoginActivityReport } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { 
    Shield, ArrowLeft, Key, Activity, 
    CheckCircle, XCircle, AlertTriangle, Info
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const Reports = () => {
    const [passwordHealth, setPasswordHealth] = useState(null);
    const [loginActivity, setLoginActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!user) return;
        const fetchReports = async () => {
            try {
                const [healthRes, activityRes] = await Promise.all([
                    getPasswordHealthReport(),
                    getLoginActivityReport()
                ]);
                setPasswordHealth(healthRes.data);
                setLoginActivity(activityRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch reports:", err);
                setError("Failed to load security reports. Ensure the backend server has been restarted.");
                setLoading(false);
            }
        };

        fetchReports();
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="flex h-screen bg-[#0B1120] items-center justify-center">
                <div className="text-center">
                    <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem', borderWidth: '3px', color: '#3b82f6' }} />
                    <p className="text-gray-400">Generating reports...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen bg-[#0B1120] flex items-center justify-center text-red-500">
                <div className="text-center bg-[#121B2D] p-8 rounded-xl border border-red-900/50">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                    <p>{error}</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const healthData = passwordHealth ? [
        { name: 'Strong', value: passwordHealth.strongPasswords, color: '#10B981' },
        { name: 'Medium', value: passwordHealth.mediumPasswords, color: '#F59E0B' },
        { name: 'Weak', value: passwordHealth.weakPasswords, color: '#EF4444' }
    ] : [];

    const loginData = loginActivity ? [
        { 
            name: 'Login Attempts', 
            Success: loginActivity.successfulLogins, 
            Failed: loginActivity.failedLogins 
        }
    ] : [];

    return (
        <div className="flex h-screen bg-[#0B1120] text-gray-300 font-sans overflow-hidden">
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                
                {/* Header */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-4 border-b border-[#1E293B] shrink-0 sticky top-0 bg-[#0B1120] z-10">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors text-gray-400 hover:text-white shrink-0"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                            <Shield className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" /> Security Reports
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Detailed analysis of your account's security posture</p>
                    </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    
                    {/* Password Health Report */}
                    <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg flex flex-col">
                        <div className="p-5 border-b border-[#1E293B] flex items-center gap-3">
                            <div className="p-2 bg-blue-900/30 rounded-lg">
                                <Key className="text-blue-500 w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Password Health</h2>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col">
                            
                            {/* Score Card */}
                            <div className="flex items-center justify-between mb-8 p-4 bg-gradient-to-r from-[#1A233A] to-[#121B2D] border border-[#1E293B] rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-400 font-medium mb-1">Health Score</p>
                                    <div className="flex items-end gap-2">
                                        <span className={`text-4xl font-bold ${
                                            passwordHealth?.healthScore >= 80 ? 'text-emerald-500' :
                                            passwordHealth?.healthScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                                        }`}>
                                            {passwordHealth?.healthScore}%
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400 font-medium mb-1">Total Credentials</p>
                                    <span className="text-3xl font-bold text-white">{passwordHealth?.totalCredentials}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 flex-1">
                                {/* Details List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-[#1E293B]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                            <span className="text-gray-300">Strong</span>
                                        </div>
                                        <span className="font-bold text-white">{passwordHealth?.strongPasswords}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-[#1E293B]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <span className="text-gray-300">Medium</span>
                                        </div>
                                        <span className="font-bold text-white">{passwordHealth?.mediumPasswords}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-[#1E293B]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span className="text-gray-300">Weak</span>
                                        </div>
                                        <span className="font-bold text-white">{passwordHealth?.weakPasswords}</span>
                                    </div>
                                    
                                    {passwordHealth?.weakPasswords > 0 && (
                                        <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded-lg flex gap-3 text-xs text-gray-300 leading-relaxed">
                                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                            <p>You have {passwordHealth.weakPasswords} weak password(s). Consider updating them.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Donut Chart */}
                                <div className="h-48 relative flex items-center justify-center">
                                    {passwordHealth?.totalCredentials > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={healthData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={45}
                                                    outerRadius={70}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {healthData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-gray-500 text-sm text-center">No passwords<br/>stored yet</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Login Activity Report */}
                    <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg flex flex-col">
                        <div className="p-5 border-b border-[#1E293B] flex items-center gap-3">
                            <div className="p-2 bg-purple-900/30 rounded-lg">
                                <Activity className="text-purple-500 w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Login Activity</h2>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col">
                            
                            {/* Score Card */}
                            <div className="flex items-center justify-center mb-8 p-4 bg-gradient-to-r from-[#1A233A] to-[#121B2D] border border-[#1E293B] rounded-xl text-center">
                                <div>
                                    <p className="text-sm text-gray-400 font-medium mb-1">Total Attempts</p>
                                    <span className="text-4xl font-bold text-white">{loginActivity?.totalAttempts}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 flex-1">
                                {/* Details List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-[#1E293B]">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            <span className="text-gray-300">Successful</span>
                                        </div>
                                        <span className="font-bold text-emerald-500">{loginActivity?.successfulLogins}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-[#1E293B]">
                                        <div className="flex items-center gap-3">
                                            <XCircle className="w-4 h-4 text-red-500" />
                                            <span className="text-gray-300">Failed</span>
                                        </div>
                                        <span className="font-bold text-red-500">{loginActivity?.failedLogins}</span>
                                    </div>
                                    
                                    <div className="mt-4 p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg flex gap-3 text-xs text-gray-300 leading-relaxed">
                                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <p>This report monitors all login attempts to your account, highlighting potential unauthorized access.</p>
                                    </div>
                                </div>

                                {/* Bar Chart */}
                                <div className="h-48 relative">
                                    {loginActivity?.totalAttempts > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={loginData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                                                <XAxis dataKey="name" hide />
                                                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} dx={-5} />
                                                <RechartsTooltip cursor={{fill: '#1E293B'}} contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                                                <Bar dataKey="Success" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                                                <Bar dataKey="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={30} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center">No login activity<br/>recorded yet</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Reports;
