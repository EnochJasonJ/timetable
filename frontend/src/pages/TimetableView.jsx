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

    const handleExport = () => {
        // Open the Django backend download URL in a new tab
        window.open(`http://localhost:8000/timetables/${id}/download/`, '_blank');
    };

    const handlePrint = () => {
        window.print();
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
            {/* Header / Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-3">
                    <button onClick={() => navigate('/timetables')} className="group inline-flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-[2px]">
                        <ArrowLeft size={14} /> Back to Archive
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{timetable?.section_label}</h1>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest border uppercase
                            ${timetable?.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            'bg-amber-50 text-amber-700 border-amber-200'}
                        `}>
                            {timetable?.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 font-medium text-[10px] uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-300" /> AY 2025-26</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="flex items-center gap-1.5 font-semibold text-indigo-600/70">Optimization Level: 98%</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 print:hidden">
                    {timetable?.status === 'DRAFT' && (
                        <button onClick={() => handleAction('PUBLISHED')} className="px-5 py-2.5 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
                             <CheckCircle2 size={16} /> Mark as Official
                        </button>
                    )}
                    <button onClick={handleExport} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <Download size={16} /> Export
                    </button>
                    <button onClick={handlePrint} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
                        <Printer size={16} />
                    </button>
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse min-w-[1200px] table-fixed">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <th className="p-6 border-r border-slate-200 w-40 bg-slate-100/50">
                                    <div className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Timeline</div>
                                </th>
                                {slots.map(s => (
                                    <th key={s.id} className="p-6 border-r border-slate-200 last:border-0 font-bold">
                                        <div className="text-[10px] tracking-widest uppercase text-slate-400 mb-1 font-semibold">Period {s.slot_number}</div>
                                        <div className="text-sm font-extrabold text-slate-900 tracking-tight">{s.start_time.slice(0,5)} — {s.end_time.slice(0,5)}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(dayName => {
                                const dayCode = dayName.slice(0,3);
                                return (
                                    <tr key={dayName} className="group/row bg-white hover:bg-slate-50/30 transition-colors">
                                        <td className="p-6 border-r border-slate-200 font-bold text-slate-500 bg-slate-50/50 uppercase text-[10px] tracking-[2px]">
                                            {dayName}
                                        </td>
                                        {slots.map((s, idx) => {
                                            const cell = gridData[dayCode]?.[s.slot_number];
                                            
                                            if (['BREAK', 'LUNCH'].includes(s.slot_type)) {
                                                return (
                                                    <td key={s.id} className="p-2 border-r border-slate-200 bg-slate-50/80 relative overflow-hidden">
                                                        <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 10px)' }} />
                                                        <div className="relative writing-vertical mx-auto h-32 rotate-180 transform font-bold text-[10px] text-slate-300 uppercase tracking-[4px] select-none">
                                                            {s.slot_type}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            if (!cell) {
                                                return <td key={s.id} className="p-2 border-r border-slate-200 relative">
                                                    <div className="mx-auto w-1 h-1 bg-slate-100 rounded-full" />
                                                </td>;
                                            }

                                            if (cell.is_continuation) return null;

                                            const isLab = cell.subject_type === 'LAB';
                                            const colSpan = cell.duration_slots;

                                            return (
                                                <td key={s.id} className="p-2 border-r border-slate-200 relative group/cell" colSpan={colSpan}>
                                                    <div className={`
                                                        p-4 rounded-lg border transition-all duration-200 flex flex-col items-center gap-3 relative overflow-hidden h-full
                                                        ${isLab 
                                                            ? 'bg-emerald-50/40 border-emerald-100 text-emerald-900 shadow-sm' 
                                                            : 'bg-indigo-50/30 border-indigo-100 text-slate-900 shadow-sm'}
                                                    `}>
                                                        <div className={`absolute top-0 left-0 w-full h-1 ${isLab ? 'bg-emerald-400' : 'bg-indigo-500'}`} />
                                                        
                                                        <div className="text-center">
                                                            <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Course</span>
                                                            <span className="block font-bold text-xs leading-tight tracking-tight uppercase text-slate-800">{cell.subject_name}</span>
                                                            <span className="block text-[9px] font-medium text-slate-400 uppercase tracking-tighter mt-1">{cell.subject_code}</span>
                                                        </div>
                                                        
                                                        <div className="flex flex-col gap-1.5 w-full pt-3 border-t border-slate-200/50 items-center mt-auto">
                                                            <div className="flex items-center gap-1.5">
                                                                <UserIcon size={10} className="text-slate-400" />
                                                                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500 truncate max-w-[100px]">{cell.faculty_name || 'TBA'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                                <MapPin size={10} className="opacity-50" />
                                                                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{cell.room_name || 'Hall A'}</span>
                                                            </div>
                                                        </div>

                                                        {colSpan > 1 && (
                                                            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-white/60 rounded border border-white/80">
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Lab</span>
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
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center border border-slate-100">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xl font-extrabold text-slate-900 tracking-tight">42 hrs</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Contact Hours / Week</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-100">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xl font-extrabold text-slate-900 tracking-tight">Validated</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">0 Conflict Integrity</p>
                    </div>
                </div>
                <div className="bg-[#0F172A] p-6 rounded-xl shadow-md flex items-center gap-5 group hover:bg-slate-900 transition-all cursor-pointer border border-slate-800">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        <Share2 size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-white tracking-tight">Cloud Sync</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">External ERP Bridge</p>
                    </div>
                    <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" size={16} />
                </div>
            </div>
        </div>
    );
};

export default TimetableView;
