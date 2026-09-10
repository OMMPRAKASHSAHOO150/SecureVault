import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analyticsApi';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ArrowLeft, Shield } from 'lucide-react';

const SuspiciousActivity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!user) return;
        const fetchActivities = async () => {
            try {
                const res = await analyticsApi.getAnalytics();
                setActivities(res?.recentSuspiciousActivities || []);
            } catch (err) {
                console.error("Failed to fetch suspicious activities:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, [user]);

    return (
        <div className="flex h-screen bg-[#0B1120] text-gray-300 font-sans overflow-hidden">
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                
                {/* Header */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-4 border-b border-[#1E293B] shrink-0 sticky top-0 bg-[#0B1120] z-10">
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
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-[#1E293B] bg-[#0F172A] text-gray-400">
                                        <th className="p-4 font-semibold">ID</th>
                                        <th className="p-4 font-semibold">Activity Type</th>
                                        <th className="p-4 font-semibold">IP Address</th>
                                        <th className="p-4 font-semibold">Details</th>
                                        <th className="p-4 font-semibold">Detected At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.map((act) => (
                                        <tr key={act.id} className="border-b border-[#1E293B] hover:bg-[#1A233A] transition-colors">
                                            <td className="p-4 font-mono text-gray-400">#{act.id}</td>
                                            <td className="p-4 text-white font-medium">{act.activityType}</td>
                                            <td className="p-4 font-mono text-xs text-blue-400">{act.ipAddress || 'Unknown'}</td>
                                            <td className="p-4 text-gray-300">{act.description || '-'}</td>
                                            <td className="p-4 text-gray-400 font-mono text-xs">
                                                {new Date(act.detectedAt || act.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SuspiciousActivity;
