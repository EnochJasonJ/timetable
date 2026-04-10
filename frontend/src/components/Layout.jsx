import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Calendar, Users, Building2, 
    BookOpen, Layers, Menu, X, LogOut, CalendarDays,
    Settings, ShieldCheck, DoorOpen, GraduationCap,
    Moon, Sun, ChevronRight, Wand2, LayoutGrid,
    Network, Box, BookMarked, Contact, Clock
} from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Updated navigation to match the screenshot exactly
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
                { path: '/timetables/generate', label: 'Generate', icon: Wand2 },
                { path: '/timetables/master', label: 'Master Timetable', icon: LayoutGrid },
            ]
        },
        {
            title: 'ACADEMIC SETUP',
            items: [
                { path: '/departments', label: 'Departments', icon: Network, adminOnly: true },
                { path: '/programs', label: 'Programs', icon: GraduationCap, adminOnly: true },
                { path: '/academic-years', label: 'Academic Years', icon: CalendarDays, adminOnly: true },
                { path: '/subjects', label: 'Subjects', icon: BookOpen, adminOnly: true },
                { path: '/sections', label: 'Sections', icon: Box, adminOnly: true },
                { path: '/course-offerings', label: 'Course Offerings', icon: BookMarked, adminOnly: true },
            ]
        },
        {
            title: 'INFRASTRUCTURE',
            items: [
                { path: '/faculty', label: 'Faculty', icon: Contact, adminOnly: true },
                { path: '/rooms', label: 'Rooms', icon: Building2, adminOnly: true },
                { path: '/time-slots', label: 'Time Slots', icon: Clock, adminOnly: true },
            ]
        },
        {
            title: 'ADMINISTRATION',
            items: [
                { path: '/users', label: 'Users & Roles', icon: Users, adminOnly: true },
            ]
        }
    ];

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TIMETABLE_ADMIN';

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-0 h-screen w-64 bg-[#1E293B] text-slate-300 z-50
                transition-transform duration-300 ease-in-out border-r border-slate-800/50
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                print:hidden
            `}>
                <div className="flex flex-col h-full">
                    {/* Header Branding */}
                    <div className="flex items-center justify-between h-20 px-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Calendar className="text-white" size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-white leading-tight tracking-tight">Timetable Manager</span>
                                <span className="text-[11px] text-slate-400 font-medium">Academic Scheduling Platform</span>
                            </div>
                        </div>
                        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto pt-4 px-4 space-y-7 custom-scrollbar pb-10">
                        {navCategories.map((category) => (
                            <div key={category.title} className="space-y-1">
                                <h3 className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                                    {category.title}
                                </h3>
                                <div className="space-y-0.5">
                                    {category.items.map((item) => {
                                        if (item.adminOnly && !isAdmin) return null;
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`
                                                    group flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150
                                                    ${isActive 
                                                        ? 'bg-indigo-600/20 text-white border border-indigo-500/20' 
                                                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}
                                                `}
                                            >
                                                <item.icon size={18} className={`mr-3 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-800/50 bg-[#1E293B]">
                        <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/20 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#6366F1] flex items-center justify-center font-bold text-white shadow-md">
                                {user?.username?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">
                                    {user?.username || 'System Admin'}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-semibold">
                                    {user?.role?.replace('_', ' ') || 'Super Admin'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/40 hover:text-white transition-all">
                                <Moon size={18} />
                                <span className="text-sm font-semibold">Dark Mode</span>
                            </button>
                            <button 
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-semibold"
                            >
                                <LogOut size={18} />
                                <span className="text-sm">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col">
                <header className="sticky top-0 z-30 flex items-center justify-between h-16 bg-white border-b border-slate-200 px-6 md:px-8 shadow-sm shadow-slate-200/50 print:hidden">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 p-1.5 hover:bg-slate-100 rounded-md transition-all">
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex items-center text-xs text-slate-400 font-medium tracking-wide">
                            <span className="hover:text-indigo-600 transition-colors cursor-pointer uppercase tracking-widest text-[10px]">Portal</span>
                            <ChevronRight size={12} className="mx-2 opacity-30" />
                            <span className="text-slate-900 font-semibold uppercase tracking-widest text-[10px]">
                                {location.pathname.split('/').pop() || 'Dashboard'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-all">
                            <span className="hidden md:inline uppercase tracking-widest text-[10px]">Support Center</span>
                        </button>
                        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                        <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Calendar size={18} />
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white" />
                        </button>
                    </div>
                </header>

                <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;

