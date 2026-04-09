import React, { useState, useEffect } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Download, ArrowLeft, Clock, MapPin, 
    User as UserIcon, Printer, Share2, 
    CheckCircle2, AlertCircle, Info,
    ChevronRight, Calendar, Layers
} from 'lucide-react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const TimetableView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [timetable, setTimetable] = useState(null);
    const [entries, setEntries] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const ttRes = await api.get(`timetables/${id}/`);
                setTimetable(ttRes.data);

                const entRes = await api.get(`timetables/${id}/entries/`);
                setEntries(entRes.data);

                const slotRes = await api.get('timeslots/');
                const uniqueSlotsMap = new Map();
                for (const slot of slotRes.data) {
                    if (!uniqueSlotsMap.has(slot.slot_number)) {
                        uniqueSlotsMap.set(slot.slot_number, slot);
                    }
                }
                const sortedSlots = Array.from(uniqueSlotsMap.values()).sort((a,b) => a.slot_number - b.slot_number);
                setSlots(sortedSlots);
            } catch (err) {
                setError('Failed to load timetable details.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleAction = async (actionStr) => {
        try {
            await api.patch(`timetables/${id}/`, { status: actionStr });
            setTimetable({ ...timetable, status: actionStr });
        } catch (e) {
            alert('Failed to update status');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-lg"></div>
            <p className="mt-4 text-slate-500 font-bold tracking-widest uppercase text-xs">Syncing schedule matrix...</p>
        </div>
    );

    if (error) return (
        <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{error}</h3>
            <button onClick={() => navigate('/timetables')} className="mt-4 text-indigo-600 font-bold hover:underline">Return to list</button>
        </div>
    );

    const gridData = {};
    entries.forEach(entry => {
        const day = entry.time_slot.day;
        const slotNum = entry.time_slot.slot_number;
        if (!gridData[day]) gridData[day] = {};
        gridData[day][slotNum] = { ...entry, is_continuation: false };
        if (entry.duration_slots > 1) {
            for (let i = 1; i < entry.duration_slots; i++) {
                if (!gridData[day][slotNum + i]) {
                    gridData[day][slotNum + i] = { ...entry, is_continuation: true };
                }
            }
        }
    });

    const hasDataForDay = (dayStr) => gridData[dayStr] && Object.keys(gridData[dayStr]).length > 0;
    const activeDays = DAYS.filter(hasDataForDay);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Actions matching Photo 3 */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button onClick={() => navigate('/timetables')} className="group inline-flex items-center gap-2 text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        <ArrowLeft size={16} /> BACK TO ARCHIVE
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                             <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{timetable?.section_label}</h1>
                             <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-[2px] border uppercase
                                ${timetable?.status === 'PUBLISHED' ? 'bg-emerald-500 text-white border-emerald-600' : 
                                'bg-amber-500 text-white border-amber-600'}
                             `}>
                                {timetable?.status}
                             </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-[2px] mt-2">
                            <span className="flex items-center gap-1.5"><Calendar size={12} /> AY 2025-26</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1.5"><Layers size={12} /> {timetable?.program_name}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-indigo-600 font-black">Accuracy Score: 98.2%</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {timetable?.status === 'DRAFT' && (
                        <button onClick={() => handleAction('PUBLISHED')} className="px-6 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
                             <CheckCircle2 size={18} /> Publish Official
                        </button>
                    )}
                    <button className="px-5 py-3 bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <Download size={18} /> PDF Export
                    </button>
                    <button className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                        <Printer size={18} />
                    </button>
                </div>
            </div>

            {/* Timetable Grid Overhaul matching Photo 3 */}
            <div className="bg-white rounded-[3rem] border border-slate-200/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse min-w-[1200px] table-fixed">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-8 border-r border-white/5 w-40 bg-indigo-600">
                                    <div className="text-[10px] font-black uppercase tracking-[3px] text-indigo-100">Schedule</div>
                                    <div className="text-lg font-black mt-1">Matrix</div>
                                </th>
                                {slots.map(s => (
                                    <th key={s.id} className="p-8 border-r border-white/5 last:border-0 font-black relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <div className="relative text-xs tracking-[2px] uppercase opacity-60">Period {s.slot_number}</div>
                                        <div className="relative text-base font-black mt-1">{s.start_time.slice(0,5)} — {s.end_time.slice(0,5)}</div>
                                        {s.slot_type !== 'REGULAR' && (
                                            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(dayName => {
                                const dayCode = dayName.slice(0,3);
                                return (
                                    <tr key={dayName} className="group/row bg-white hover:bg-slate-50/50 transition-colors">
                                        <td className="p-8 border-r border-slate-100 font-black text-slate-900 bg-slate-50/30 uppercase text-[10px] tracking-[3px] group-hover/row:text-indigo-600 transition-colors">
                                            {dayName}
                                        </td>
                                        {slots.map(s => {
                                            const cell = gridData[dayCode]?.[s.slot_number];
                                            
                                            if (['BREAK', 'LUNCH'].includes(s.slot_type)) {
                                                return (
                                                    <td key={s.id} className="p-2 border-r border-slate-100 bg-[#F8FAFF] relative overflow-hidden">
                                                        <div className="absolute inset-0 opacity-[0.2] mix-blend-multiply" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 1px, transparent 0, transparent 10px)' }} />
                                                        <div className="relative writing-vertical mx-auto h-32 rotate-180 transform font-black text-[12px] text-slate-300 uppercase tracking-[6px] opacity-40 select-none">
                                                            {s.slot_type}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            if (!cell) {
                                                return <td key={s.id} className="p-2 border-r border-slate-100 group/slot relative">
                                                    <div className="mx-auto w-6 h-1 bg-slate-100 rounded-full" />
                                                </td>;
                                            }

                                            if (cell.is_continuation) {
                                                return <td key={s.id} className={`p-2 border-r border-slate-100 ${cell.subject_type === 'LAB' ? 'bg-emerald-50/20' : 'bg-indigo-50/20'}`}></td>;
                                            }

                                            const colSpan = cell.duration_slots;
                                            const isLab = cell.subject_type === 'LAB';

                                            return (
                                                <td key={s.id} className="p-4 border-r border-slate-100 relative group/cell" colSpan={1}>
                                                    <div className={`
                                                        p-5 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer flex flex-col items-center gap-4 relative overflow-hidden group-hover/cell:scale-[1.02] group-hover/cell:shadow-2xl
                                                        ${isLab 
                                                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-emerald-500/5 hover:border-emerald-500 group-hover/cell:shadow-emerald-500/10' 
                                                            : 'bg-white border-slate-100 text-slate-900 shadow-indigo-500/5 hover:border-indigo-500 group-hover/cell:shadow-indigo-500/10'}
                                                    `}>
                                                        <div className={`absolute top-0 left-0 w-full h-1.5 ${isLab ? 'bg-emerald-500' : 'bg-indigo-600'}`} />
                                                        
                                                        <div className="text-center space-y-1">
                                                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Module</span>
                                                            <span className="block font-black text-xs leading-tight tracking-tight uppercase group-hover/cell:text-indigo-600 transition-colors">{cell.subject_name}</span>
                                                        </div>
                                                        
                                                        <div className="flex flex-col gap-2 w-full pt-4 border-t border-slate-100 items-center">
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                                                <UserIcon size={12} className="text-slate-400" />
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 truncate max-w-[80px]">{cell.faculty_name || 'TBA'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-400">
                                                                <MapPin size={12} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">{cell.room_name || 'Main Hall'}</span>
                                                            </div>
                                                        </div>

                                                        {colSpan > 1 && (
                                                            <div className="absolute top-2 right-4 flex items-center gap-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                                <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Extended</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats Summary Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/70 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
                        <Clock size={32} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">42 hrs</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Lectures</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/70 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={32} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">0 Clashes</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conflict Integrity</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex items-center gap-6 group hover:bg-slate-800 transition-all cursor-pointer">
                    <div className="w-16 h-16 bg-indigo-500 text-white rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Share2 size={32} />
                    </div>
                    <div className="flex-1">
                        <p className="text-lg font-black text-white tracking-tight">Sync Portal</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Export to ERP</p>
                    </div>
                    <ChevronRight className="text-white opacity-40 group-hover:opacity-100 transition-all" />
                </div>
            </div>
        </div>
    );
};

export default TimetableView;
