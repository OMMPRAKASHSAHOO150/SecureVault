import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analyticsApi';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ArrowLeft, Shield, RefreshCw, Clock } from 'lucide-react';

const formatRelativeTime = (dateStr, now) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 5) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
};

const SuspiciousActivity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [now, setNow] = useState(new Date());
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    // Live clock timer updating every 1s
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchActivities = useCallback(async (isManual = false) => {
        if (isManual) setIsRefreshing(true);
        try {
            const res = await analyticsApi.getAnalytics();
            setActivities(res?.recentSuspiciousActivities || []);
        } catch (err) {
            console.error("Failed to fetch suspicious activities:", err);
        } finally {
            setLoading(false);
            if (isManual) setIsRefreshing(false);
        }
    }, []);

    // Initial fetch and 3-second real-time auto-polling
    useEffect(() => {
        if (!user) return;
        fetchActivities();
        const pollInterval = setInterval(() => {
            fetchActivities();
        }, 3000);
        return () => clearInterval(pollInterval);
    }, [user, fetchActivities]);

    return (
        <div className="flex h-screen bg-[#0B1120] text-gray-300 font-sans overflow-hidden">
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                
                {/* Header */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] shrink-0 sticky top-0 bg-[#0B1120] z-10">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors text-gray-400 hover:text-white shrink-0"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                                <AlertTriangle className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6" /> Suspicious Activity Logs
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Flagged anomalous behavior and access attempts</p>
                        </div>
                    </div>

                    {/* Live Clock & Refresh Controls */}
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121B2D] border border-[#1E293B] text-xs font-mono text-gray-300 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                            <Clock size={14} className="text-yellow-400 shrink-0" />
                            <span>{now.toLocaleTimeString()}</span>
                        </div>

                        <button 
                            onClick={() => fetchActivities(true)}
                            disabled={isRefreshing}
                            className="p-2 hover:bg-[#1E293B] bg-[#121B2D] border border-[#1E293B] rounded-lg transition-colors text-gray-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
                            title="Refresh Suspicious Activity"
                        >
                            <RefreshCw size={15} className={`text-yellow-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 1rem', borderWidth: '3px', color: '#eab308' }} />
                            <p className="text-gray-400">Loading activities...</p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-16 bg-[#121B2D] border border-[#1E293B] rounded-xl">
                            <Shield className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400">No suspicious activity detected.</p>
                        </div>
                    ) : (
                        <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-[#1E293B] bg-[#0F172A] text-gray-400">
                                            <th className="p-4 font-semibold whitespace-nowrap">ID</th>
                                            <th className="p-4 font-semibold whitespace-nowrap">Activity Type</th>
                                            <th className="p-4 font-semibold whitespace-nowrap">IP Address</th>
                                            <th className="p-4 font-semibold whitespace-nowrap">Details</th>
                                            <th className="p-4 font-semibold whitespace-nowrap">Detected At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.map((act) => {
                                            const timeStr = act.detectedAt || act.createdAt;
                                            const relativeTime = formatRelativeTime(timeStr, now);
                                            return (
                                                <tr key={act.id} className="border-b border-[#1E293B] hover:bg-[#1A233A] transition-colors">
                                                    <td className="p-4 font-mono text-gray-400 whitespace-nowrap">#{act.id}</td>
                                                    <td className="p-4 text-white font-medium whitespace-nowrap">{act.activityType}</td>
                                                    <td className="p-4 font-mono text-xs text-blue-400 whitespace-nowrap">{act.ipAddress || 'Unknown'}</td>
                                                    <td className="p-4 text-gray-300 whitespace-nowrap">{act.description || '-'}</td>
                                                    <td className="p-4 font-mono text-xs whitespace-nowrap">
                                                        <span className="text-gray-300">
                                                            {new Date(timeStr).toLocaleString()}
                                                        </span>
                                                        {relativeTime && (
                                                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-yellow-950 text-yellow-400 border border-yellow-900/60 font-semibold">
                                                                {relativeTime}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SuspiciousActivity;
