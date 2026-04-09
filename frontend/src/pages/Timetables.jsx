import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
    Calendar, PlusCircle, Trash2, Eye, 
    Layers, Search, Filter, MoreHorizontal,
    ChevronRight, CalendarDays, CheckCircle2,
    ShieldCheck, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Timetables = () => {
    const [timetables, setTimetables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchTimetables();
    }, []);

    const fetchTimetables = async () => {
        try {
            const response = await api.get('timetables/');
            setTimetables(response.data);
        } catch (err) {
            setError('Failed to fetch the academic boards.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Permanent deletion will remove all grid entries. Confirm?')) return;
        try {
            await api.delete(`timetables/${id}/`);
            setTimetables(timetables.filter(t => t.id !== id));
        } catch (err) {
            setError('System failed to prune the requested resource.');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-md"></div>
            <p className="mt-4 text-slate-400 font-black uppercase tracking-[3px] text-[10px]">Syncing Boards...</p>
        </div>
    );

    const publishCount = timetables.filter(t => t.status === 'PUBLISHED').length;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* 1. Page Header with List Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black tracking-widest uppercase">
                        <CalendarDays size={12} /> Schedule Matrix
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Generated Boards</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest max-w-xl leading-relaxed">
                        Access and manage all academic schedules computed by the neural engine.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end pr-6 border-r border-slate-200">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Boards</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-slate-800">{timetables.length}</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">{publishCount} Live</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/timetables/generate')}
                        className="px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[2px] rounded-2xl flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                        <PlusCircle size={20} /> Generate New
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-[2rem] flex items-center gap-4 text-sm border border-red-100 shadow-sm">
                    <Info size={20} /> <p className="font-bold">{error}</p>
                </div>
            )}

            {/* 2. List Control Area */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filter by section, program or faculty..." 
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 shadow-sm transition-all text-sm font-medium"
                    />
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    {['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'].map((f) => (
                        <button key={f} className={`px-4 py-2 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all ${f === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Grid representation matching Dashboard style */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {timetables.length === 0 ? (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] opacity-40">
                         <Layers size={64} className="mb-4" />
                         <p className="font-black uppercase tracking-[3px] text-xs">No active boards found</p>
                    </div>
                ) : (
                    timetables.map(t => (
                        <div key={t.id} className="group relative bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-500">
                             <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6 shadow-inner">
                                    {t.section_label?.charAt(0)}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[2px] border
                                    ${t.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                      t.status === 'ARCHIVED'  ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                      'bg-amber-50 text-amber-600 border-amber-100'}
                                `}>
                                    {t.status}
                                </div>
                             </div>

                             <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{t.section_label}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{t.program_name} • {t.department_name}</p>
                                </div>

                                <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Sync Date</span>
                                        <span className="text-xs font-bold text-slate-600 mt-0.5">{new Date(t.generated_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex flex-col border-l border-slate-100 pl-6">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Integrity</span>
                                        <span className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center gap-1"><ShieldCheck size={12} /> 100%</span>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center gap-3">
                                    <button 
                                        onClick={() => navigate(`/timetables/${t.id}`)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                                    >
                                        <Eye size={16} /> Open Board
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(t.id)}
                                        className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all active:scale-95 border border-slate-100"
                                        title="Prune Matrix"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                             </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* 4. Footer CTA Board */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
                <div className="relative z-10 space-y-4 max-w-xl text-center md:text-left">
                    <h2 className="text-3xl font-black tracking-tight leading-tight">Can't find the board you need?</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[2px] leading-relaxed">
                        Re-run our optimization core with different constraints to find matching results for your academic session.
                    </p>
                </div>
                <div className="relative z-10">
                    <button 
                         onClick={() => navigate('/timetables/generate')}
                        className="group py-5 px-10 bg-indigo-600 rounded-[2rem] font-black uppercase text-xs tracking-[3px] flex items-center gap-3 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] hover:scale-[1.05] transition-all active:scale-[0.98]"
                    >
                        Trigger Neural Run <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Timetables;
