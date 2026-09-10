import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, updateUserStatus, updateUserRole, deleteUser } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { Users as UsersIcon, ArrowLeft, Shield, Ban, CheckCircle, Trash2 } from 'lucide-react';

const Users = () => {
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await getAllUsers();
            setUsersList(res.data || []);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError("Failed to fetch registered users list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchUsers();
    }, [user]);

    const handleStatusToggle = async (userId, currentStatus) => {
        const nextStatus = currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
        try {
            await updateUserStatus(userId, nextStatus);
            fetchUsers();
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    const handleRoleToggle = async (userId, currentRole) => {
        const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        try {
            await updateUserRole(userId, nextRole);
            fetchUsers();
        } catch (err) {
            alert('Failed to update user role');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await deleteUser(userId);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
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
                            <UsersIcon className="text-purple-500 w-5 h-5 sm:w-6 sm:h-6" /> User Management
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Admin oversight and control of user accounts</p>
                    </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 1rem', borderWidth: '3px', color: '#a855f7' }} />
                            <p className="text-gray-400">Loading user accounts...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 bg-[#121B2D] border border-[#1E293B] rounded-xl text-red-400">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="bg-[#121B2D] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-[#1E293B] bg-[#0F172A] text-gray-400">
                                        <th className="p-4 font-semibold">User ID</th>
                                        <th className="p-4 font-semibold">Name</th>
                                        <th className="p-4 font-semibold">Email</th>
                                        <th className="p-4 font-semibold">Role</th>
                                        <th className="p-4 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList.map((usr) => (
                                        <tr key={usr.id} className="border-b border-[#1E293B] hover:bg-[#1A233A] transition-colors">
                                            <td className="p-4 font-mono text-gray-400">#{usr.id}</td>
                                            <td className="p-4 text-white font-medium">{usr.name || 'N/A'}</td>
                                            <td className="p-4 text-gray-300">{usr.email}</td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                    {usr.role || 'USER'}
                                                </span>
                                            </td>
                                            <td className="p-4 flex items-center gap-2">
                                                <button
                                                    onClick={() => handleRoleToggle(usr.id, usr.role)}
                                                    className="p-1.5 hover:bg-[#1E293B] rounded-lg transition-colors text-purple-400 font-mono text-xs border border-purple-500/20"
                                                    title={usr.role === 'ADMIN' ? 'Demote to USER' : 'Promote to ADMIN'}
                                                >
                                                    {usr.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                                                </button>
                                                <button
                                                    onClick={() => handleStatusToggle(usr.id, usr.status)}
                                                    className="p-1.5 hover:bg-[#1E293B] rounded-lg transition-colors text-yellow-500"
                                                    title={usr.status === 'BLOCKED' ? 'Unblock User' : 'Block User'}
                                                >
                                                    {usr.status === 'BLOCKED' ? <CheckCircle size={18} /> : <Ban size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(usr.id)}
                                                    className="p-1.5 hover:bg-[#1E293B] rounded-lg transition-colors text-red-500"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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

export default Users;
