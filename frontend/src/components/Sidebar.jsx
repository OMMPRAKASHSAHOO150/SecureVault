import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Shield, Home, Bell, AlertTriangle, FileText, Users, Settings, BarChart2, 
    LogOut, KeyRound, X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, totalAlerts = 0, alertsSeverityData = [], user, handleLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const totalSeverity = alertsSeverityData.reduce((a, b) => a + b.value, 0);
    const highCount = alertsSeverityData[0]?.value || 0;
    const medLowCount = (alertsSeverityData[1]?.value || 0) + (alertsSeverityData[2]?.value || 0);

    const handleNav = (path) => {
        navigate(path);
        if (onClose) onClose();
    };

    const navContent = (
        <div className="flex flex-col h-full bg-[#0F172A]">
            {/* Header / Logo */}
            <div className="p-5 flex items-center justify-between border-b border-[#1E293B]">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg shrink-0">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-wide">SecureVault</span>
                </div>
                {/* Mobile Close Button */}
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
            
            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <nav className="space-y-1 px-3">
                    <NavItem 
                        icon={<Home size={18} />} 
                        label="Dashboard" 
                        active={location.pathname === '/dashboard' || location.pathname === '/analytics'} 
                        onClick={() => handleNav('/dashboard')} 
                    />
                    <NavItem 
                        icon={<Bell size={18} />} 
                        label="Alerts" 
                        badge={totalAlerts} 
                        active={location.pathname === '/alerts'} 
                        onClick={() => handleNav('/alerts')} 
                    />
                    <NavItem 
                        icon={<AlertTriangle size={18} />} 
                        label="Suspicious Activity" 
                        active={location.pathname === '/suspicious-activity'} 
                        onClick={() => handleNav('/suspicious-activity')} 
                    />
                    <NavItem 
                        icon={<FileText size={18} />} 
                        label="Audit Logs" 
                        active={location.pathname === '/audit-logs'} 
                        onClick={() => handleNav('/audit-logs')} 
                    />
                    <NavItem 
                        icon={<KeyRound size={18} />} 
                        label="Vault" 
                        active={location.pathname === '/vault'} 
                        onClick={() => handleNav('/vault')} 
                    />
                    {(user?.role === 'ADMIN' || user?.email?.includes('admin')) && (
                        <NavItem 
                            icon={<Users size={18} />} 
                            label="Users" 
                            active={location.pathname === '/users'} 
                            onClick={() => handleNav('/users')} 
                        />
                    )}
                    <NavItem 
                        icon={<Settings size={18} />} 
                        label="Settings" 
                        active={location.pathname === '/settings'} 
                        onClick={() => handleNav('/settings')} 
                    />
                    <NavItem 
                        icon={<BarChart2 size={18} />} 
                        label="Reports" 
                        active={location.pathname === '/reports'} 
                        onClick={() => handleNav('/reports')} 
                    />
                </nav>
            </div>

            {/* Bottom Total Alerts Widget */}
            <div className="p-4 mx-3 mb-3 rounded-xl border border-red-900/30 bg-gradient-to-b from-[#1A1525] to-[#110C1A]">
                <p className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Total Security Alerts</p>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <span className="text-2xl font-bold text-red-500">{totalAlerts}</span>
                        <p className="text-[11px] text-gray-500">flagged</p>
                    </div>
                    <Shield className="w-8 h-8 text-red-500/80 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                </div>
                <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">High Priority</span>
                        <span className="text-red-400 font-semibold">
                            {highCount} ({totalSeverity > 0 ? Math.round(highCount / totalSeverity * 100) : 0}%)
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Medium / Low</span>
                        <span className="text-blue-400 font-semibold">
                            {medLowCount} ({totalSeverity > 0 ? Math.round(medLowCount / totalSeverity * 100) : 0}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <div className="px-3 pb-4">
                <button 
                    onClick={() => {
                        if (onClose) onClose();
                        handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-950/40 hover:text-red-400 transition-colors text-sm font-medium"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Fixed Sidebar */}
            <aside className="hidden lg:flex w-64 border-r border-[#1E293B] shrink-0 h-screen sticky top-0">
                {navContent}
            </aside>

            {/* Mobile / Tablet Overlay Drawer */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                    />
                    {/* Sliding Drawer */}
                    <div className="relative w-72 max-w-[85vw] bg-[#0F172A] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
                        {navContent}
                    </div>
                </div>
            )}
        </>
    );
};

const NavItem = ({ icon, label, badge, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
            active 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'text-gray-400 hover:bg-[#1E293B] hover:text-gray-200'
        }`}
    >
        <div className="flex items-center gap-3 truncate">
            <span className={active ? "text-white" : "text-gray-400"}>{icon}</span>
            <span className="truncate">{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2">
                {badge}
            </span>
        )}
    </button>
);

export default Sidebar;
