import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, ArrowLeft, User, Mail, Shield, CheckCircle, AlertCircle } from 'lucide-react';

const Settings = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
        if (user) {
            setFullName(user.name || user.fullName || '');
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setSaving(true);

        try {
            await updateProfile({ fullName });
            setMessage('Profile updated successfully!');
        } catch (err) {
            console.error("Profile update error:", err);
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

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
                            <SettingsIcon className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" /> Account Settings
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Manage your profile details and security preferences</p>
                    </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
                    <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg p-6">
                        <h2 className="text-lg font-bold text-white mb-6 border-b border-[#1E293B] pb-4 flex items-center gap-2">
                            <User size={20} className="text-blue-400" /> Edit Profile Details
                        </h2>

                        {message && (
                            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-400 text-sm">
                                <CheckCircle size={18} /> {message}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Email Address (Read-only)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full pl-10 pr-4 py-2.5 bg-[#0F172A]/50 border border-[#1E293B] rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Account Role (Read-only)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                        <Shield size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={user?.role || 'USER'}
                                        disabled
                                        className="w-full pl-10 pr-4 py-2.5 bg-[#0F172A]/50 border border-[#1E293B] rounded-lg text-gray-500 cursor-not-allowed uppercase font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : 'Save Profile Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
