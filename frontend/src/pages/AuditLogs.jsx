import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analyticsApi';
import { useAuth } from '../context/AuthContext';
import { FileText, ArrowLeft } from 'lucide-react';

const AuditLogs = () => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!user) return;
        const fetchAuditLogs = async () => {
            try {
                const res = await analyticsApi.getAnalytics();
                setAuditLogs(res?.recentAuditLogs || []);
            } catch (err) {
                console.error("Failed to fetch audit logs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAuditLogs();
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
                            <FileText className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" /> Audit Logs
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Complete audit record of user and system interactions</p>
                    </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 1rem', borderWidth: '3px', color: '#3b82f6' }} />
                            <p className="text-gray-400">Loading audit logs...</p>
                        </div>
                    ) : auditLogs.length === 0 ? (
                        <div className="text-center py-16 bg-[#121B2D] border border-[#1E293B] rounded-xl">
                            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400">No audit logs recorded.</p>
                        </div>
                    ) : (
                        <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-[#1E293B] bg-[#0F172A] text-gray-400">
                                        <th className="p-4 font-semibold">ID</th>
                                        <th className="p-4 font-semibold">Action</th>
                                        <th className="p-4 font-semibold">Details / Status</th>
                                        <th className="p-4 font-semibold">IP Address</th>
                                        <th className="p-4 font-semibold">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-[#1E293B] hover:bg-[#1A233A] transition-colors">
                                            <td className="p-4 font-mono text-gray-400">#{log.id}</td>
                                            <td className="p-4 text-white font-medium">{log.action}</td>
                                            <td className="p-4 text-gray-300">{log.details || log.status || '-'}</td>
                                            <td className="p-4 font-mono text-xs text-blue-400">{log.ipAddress || 'Internal'}</td>
                                            <td className="p-4 text-gray-400 font-mono text-xs">
                                                {new Date(log.timestamp || log.createdAt).toLocaleString()}
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

export default AuditLogs;
