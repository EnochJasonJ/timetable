import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
    Building2, BookOpen, Users, LayoutDashboard, 
    Layers, DoorOpen, Calendar, AlertTriangle,
    PlusCircle, ArrowRight, Clock, MapPin, 
    AlertCircle, CheckCircle2, MoreVertical,
    Activity, ShieldAlert
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState({
        stats: null,
        recent_timetables: [],
        conflicts: { items: [], total: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('dashboard/');
                setData(response.data);
            } catch (err) {
                setError('Failed to load dashboard data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-md"></div>
                <p className="mt-4 text-slate-500 font-medium">Loading intelligence board...</p>
            </div>
        );
    }

    const { stats, recent_timetables, conflicts } = data;

    const statCards = [
        { label: 'Departments', value: stats?.departments, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Faculty', value: stats?.faculty, icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
        { label: 'Subjects', value: stats?.subjects, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-100' },
        { label: 'Sections', value: stats?.sections, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { label: 'Rooms', value: stats?.rooms, icon: DoorOpen, color: 'text-pink-600', bg: 'bg-pink-100' },
        { label: 'Timetables', value: stats?.timetables, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-100' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* 1. Hero Banner matching Phase 3 requirements */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#A855F7] rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-indigo-500/20 group">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="text-white space-y-4 max-w-xl text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase mb-2">
                           <Activity size={14} className="animate-pulse" /> AI-Powered Scheduling Engine
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
                            Academic Timetable Management System
                        </h1>
                        <p className="text-indigo-100 text-base md:text-lg opacity-90 leading-relaxed font-medium">
                            Manage your institution's schedule — configure departments, subjects, faculty, and rooms, then let the AI generate conflict-free timetables.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 pt-4 justify-center md:justify-start">
                            <button 
                                onClick={() => navigate('/timetables/generate')}
                                className="px-6 py-3 bg-white text-indigo-700 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-900/10 hover:bg-slate-100 transition-all active:scale-95"
                            >
                                <PlusCircle size={20} /> Generate Timetable
                            </button>
                            <button 
                                onClick={() => navigate('/timetables')}
                                className="px-6 py-3 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/30 transition-all active:scale-95"
                            >
                                <LayoutDashboard size={20} /> Master View
                            </button>
                        </div>
                    </div>
                    <div className="hidden lg:block relative">
                         <div className="w-80 h-80 bg-white/10 backdrop-blur-3xl rounded-[3rem] border border-white/20 rotate-12 flex items-center justify-center p-8 shadow-inner overflow-hidden group">
                            <Calendar size={180} className="text-white/20 -rotate-12 transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center -rotate-12">
                                <span className="text-6xl font-black text-white">{stats?.timetables || 0}</span>
                                <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Active Boards</span>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* 2. Stat Grid refined with circular icons */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0 mb-4 transition-transform group-hover:rotate-12`}>
                            <stat.icon size={26} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-black text-slate-800 tracking-tight">
                                {stat.value || 0}
                            </p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {stat.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Detailed Management Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity Column */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200/70 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Timetables</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Latest generated schedules</p>
                        </div>
                        <button onClick={() => navigate('/timetables')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl transition-all">
                            View All
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recent_timetables?.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 font-medium">No activity recorded yet.</div>
                        ) : (
                            recent_timetables.map((tt) => (
                                <div key={tt.id} className="group flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                                    <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center font-bold">
                                        {tt.section_label?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{tt.section_label}</h4>
                                        <p className="text-xs text-slate-400 font-medium">{tt.academic_year_label} • {new Date(tt.generated_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                                        ${tt.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                          tt.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                          'bg-amber-50 text-amber-600 border-amber-100'}
                                    `}>
                                        {tt.status}
                                    </span>
                                    <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-all" size={20} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Conflict Board Column */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200/70 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Conflict Summary</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Scheduling conflicts detected</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full">
                            <ShieldAlert size={14} />
                            <span className="text-xs font-black tracking-widest uppercase">{conflicts?.total || 0} Conflicts</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {conflicts?.total === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-60">
                                <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
                                <p className="font-bold text-slate-500 text-lg">System Conflict-Free</p>
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">All boards optimized</span>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {conflicts.items.map((conflict, i) => (
                                    <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border ${conflict.severity === 'HIGH' ? 'bg-red-50/50 border-red-100 text-red-900' : 'bg-amber-50/50 border-amber-100 text-amber-900'}`}>
                                        <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${conflict.severity === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h5 className="font-black text-sm tracking-tight">{conflict.title}</h5>
                                                <span className="text-[10px] font-black uppercase bg-white/50 px-2 py-0.5 rounded-full">Intensity: 0.9</span>
                                            </div>
                                            <p className="text-xs font-medium opacity-80 leading-relaxed">{conflict.description}</p>
                                            <div className="flex items-center gap-3 pt-1">
                                                <div className="flex items-center gap-1 opacity-60 text-[10px] font-bold uppercase">
                                                    <Clock size={10} /> <span>{conflict.count} Overlaps</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

