import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Calendar, Users, Building, 
    BookOpen, Layers, Menu, X, LogOut, CalendarDays,
    Settings, ShieldCheck, DoorOpen, GraduationCap,
    Moon, Sun, ChevronRight
} from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Grouping navigation into categories like the reference screenshots
    const navCategories = [
        {
            title: 'OVERVIEW',
            items: [
                { path: '/', label: 'Dashboard', icon: LayoutDashboard }
            ]
        },
        {
            title: 'TIMETABLES',
            items: [
                { path: '/timetables', label: 'All Timetables', icon: Calendar },
                { path: '/timetables/generate', label: 'Generate', icon: Settings },
            ]
        },
        {
            title: 'ACADEMIC SETUP',
            items: [
                { path: '/departments', label: 'Departments', icon: Building, adminOnly: true },
                { path: '/programs', label: 'Programs', icon: GraduationCap, adminOnly: true },
                { path: '/academic-years', label: 'Academic Years', icon: CalendarDays, adminOnly: true },
                { path: '/subjects', label: 'Subjects', icon: BookOpen, adminOnly: true },
                { path: '/sections', label: 'Sections', icon: Layers, adminOnly: true },
            ]
        },
        {
            title: 'INFRASTRUCTURE',
            items: [
                { path: '/faculty', label: 'Faculty', icon: Users, adminOnly: true },
                { path: '/rooms', label: 'Rooms', icon: DoorOpen, adminOnly: true },
            ]
        }
    ];

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TIMETABLE_ADMIN';

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-0 h-screen w-72 bg-[#0F172A] text-slate-300 z-50
                transition-transform duration-300 ease-in-out border-r border-slate-800
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Header Branding */}
                    <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Calendar className="text-white" size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-white leading-tight">Timetable Manager</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Academic Platform</span>
                            </div>
                        </div>
                        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto pt-6 px-4 space-y-8 custom-scrollbar">
                        {navCategories.map((category) => (
                            <div key={category.title} className="space-y-2">
                                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[2px]">
                                    {category.title}
                                </h3>
                                <div className="space-y-1">
                                    {category.items.map((item) => {
                                        if (item.adminOnly && !isAdmin) return null;
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`
                                                    group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                                    ${isActive 
                                                        ? 'bg-indigo-600/10 text-white shadow-sm border border-indigo-500/20' 
                                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} />
                                                    <span>{item.label}</span>
                                                </div>
                                                {isActive && <div className="w-1 h-4 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-800/50 bg-[#0F172A]/80 backdrop-blur-md">
                        <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl border border-slate-700/30 mb-4 shadow-inner">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg">
                                {user?.username?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">
                                    {user?.username || 'System Admin'}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-bold">
                                    {user?.role?.replace('_', ' ') || 'Super Admin'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 px-1">
                            <button className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                                <Moon size={16} />
                                <span className="text-xs font-semibold">Dark Mode</span>
                            </button>
                            <button 
                                onClick={logout}
                                className="p-2.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
                                title="Sign Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col">
                <header className="sticky top-0 z-30 flex items-center justify-between h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 md:px-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all">
                            <Menu size={24} />
                        </button>
                        <div className="hidden md:flex items-center text-sm text-slate-500 font-medium">
                            <span className="hover:text-slate-800 cursor-pointer">Platform</span>
                            <ChevronRight size={14} className="mx-2 opacity-50" />
                            <span className="text-slate-900 font-bold capitalize">
                                {location.pathname.split('/').pop() || 'Dashboard'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all">
                            <Menu size={16} className="md:hidden" />
                            <span className="hidden md:inline">Dashboard Chat</span>
                            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px]">3</div>
                        </button>
                    </div>
                </header>

                <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;

