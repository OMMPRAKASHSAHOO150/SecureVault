import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analyticsApi';
import { useAuth } from '../context/AuthContext';
import { Bell, ArrowLeft, ShieldAlert } from 'lucide-react';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!user) return;
        const fetchAlerts = async () => {
            try {
                const res = await analyticsApi.getAnalytics();
                setAlerts(res?.recentAlerts || []);
            } catch (err) {
                console.error("Failed to fetch alerts:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
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
                            <Bell className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" /> Security Alerts
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Real-time alerts triggered by system events</p>
                    </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 1rem', borderWidth: '3px', color: '#ef4444' }} />
                            <p className="text-gray-400">Loading alerts...</p>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="text-center py-16 bg-[#121B2D] border border-[#1E293B] rounded-xl">
                            <ShieldAlert className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400">No security alerts found.</p>
                        </div>
                    ) : (
                        <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-[#1E293B] bg-[#0F172A] text-gray-400">
                                        <th className="p-4 font-semibold">ID</th>
                                        <th className="p-4 font-semibold">Severity</th>
                                        <th className="p-4 font-semibold">Alert Description</th>
                                        <th className="p-4 font-semibold">Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alerts.map((alert) => (
                                        <tr key={alert.id} className="border-b border-[#1E293B] hover:bg-[#1A233A] transition-colors">
                                            <td className="p-4 font-mono text-gray-400">#{alert.id}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    alert.severity === 'HIGH' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                    alert.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                    'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                }`}>
                                                    {alert.severity}
                                                </span>
                                            </td>
                                            <td className="p-4 text-white font-medium">{alert.description || alert.alertType}</td>
                                            <td className="p-4 text-gray-400 font-mono text-xs">
                                                {new Date(alert.createdAt).toLocaleString()}
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

export default Alerts;
