import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
    Calendar, Users, DoorOpen, Layers, 
    Filter, Download, Printer, ChevronRight,
    Search, LayoutGrid, List
} from 'lucide-react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const MasterTimetable = () => {
    const [viewType, setViewType] = useState('section'); // section, faculty, room
    const [entries, setEntries] = useState([]);
    const [slots, setSlots] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [rooms, setRooms] = useState([]);
    
    const [filterDept, setFilterDept] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterSection, setFilterSection] = useState('');
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [entRes, slotRes, deptRes, secRes, facRes, roomRes] = await Promise.all([
                    api.get('timetables/master/', { 
                        params: { 
                            department: filterDept, 
                            year: filterYear,
                            section: filterSection
                        } 
                    }),
                    api.get('timeslots/'),
                    api.get('departments/'),
                    api.get('sections/'),
                    api.get('faculty/'),
                    api.get('rooms/')
                ]);

                setEntries(entRes.data);
                
                // Process slots
                const uniqueSlotsMap = new Map();
                for (const slot of slotRes.data) {
                    if (!uniqueSlotsMap.has(slot.slot_number)) {
                        uniqueSlotsMap.set(slot.slot_number, slot);
                    }
                }
                setSlots(Array.from(uniqueSlotsMap.values()).sort((a,b) => a.slot_number - b.slot_number));
                
                setDepartments(deptRes.data);
                setSections(secRes.data);
                setFaculty(facRes.data);
                setRooms(roomRes.data);
            } catch (err) {
                console.error("Failed to fetch master data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filterDept, filterYear, filterSection]);

    const buildGrid = (relevantEntries) => {
        const grid = {};
        relevantEntries.forEach(entry => {
            const day = entry.time_slot.day;
            const slotNum = entry.time_slot.slot_number;
            if (!grid[day]) grid[day] = {};
            grid[day][slotNum] = { ...entry, is_continuation: false };
            if (entry.duration_slots > 1) {
                for (let i = 1; i < entry.duration_slots; i++) {
                    if (!grid[day][slotNum + i]) {
                        grid[day][slotNum + i] = { ...entry, is_continuation: true };
                    }
                }
            }
        });
        return grid;
    };

    const renderGrid = (gridData, title, subtitle) => (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-10 last:mb-0">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">{title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse min-w-[1000px] table-fixed">
                    <thead>
                        <tr className="bg-white text-slate-400 border-b border-slate-100">
                            <th className="p-4 border-r border-slate-100 w-24 text-[9px] font-bold uppercase tracking-widest">Day</th>
                            {slots.map(s => (
                                <th key={s.id} className="p-4 border-r border-slate-100 last:border-0 font-bold">
                                    <div className="text-[8px] tracking-widest uppercase text-slate-400 mb-0.5">P{s.slot_number}</div>
                                    <div className="text-[11px] font-extrabold text-slate-700 tracking-tight">{s.start_time.slice(0,5)}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {DAYS.map(dayCode => (
                            <tr key={dayCode} className="bg-white">
                                <td className="p-4 border-r border-slate-100 font-bold text-slate-400 uppercase text-[9px] tracking-widest bg-slate-50/30">
                                    {dayCode}
                                </td>
                                {slots.map(s => {
                                    const cell = gridData[dayCode]?.[s.slot_number];
                                    if (['BREAK', 'LUNCH'].includes(s.slot_type)) {
                                        return <td key={s.id} className="p-1 border-r border-slate-100 bg-slate-50/50"></td>;
                                    }
                                    if (!cell) return <td key={s.id} className="p-1 border-r border-slate-100"></td>;
                                    if (cell.is_continuation) return null;
                                    
                                    const isLab = cell.subject_type === 'LAB';
                                    return (
                                        <td key={s.id} className="p-1 border-r border-slate-100" colSpan={cell.duration_slots}>
                                            <div className={`p-2 rounded border text-[10px] h-full flex flex-col justify-center ${isLab ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}>
                                                <span className="font-extrabold truncate">{cell.subject_name}</span>
                                                <div className="flex items-center justify-between mt-1 opacity-60 font-bold text-[8px]">
                                                    <span>{viewType === 'section' ? (cell.faculty_name || 'TBA') : cell.section_label}</span>
                                                    <span>{cell.room_name || 'H'}</span>
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const getGroupedData = () => {
        if (viewType === 'section') {
            const activeSections = sections.filter(s => entries.some(e => e.timetable_section_id === s.id || e.section === s.id));
            return activeSections.map(s => ({
                id: s.id,
                title: s.label,
                subtitle: `${s.program_name} • Year ${s.year_of_study}`,
                grid: buildGrid(entries.filter(e => e.section === s.id))
            }));
        } else if (viewType === 'faculty') {
            const activeFaculty = faculty.filter(f => entries.some(e => e.faculty === f.id));
            return activeFaculty.map(f => ({
                id: f.id,
                title: f.full_name,
                subtitle: f.department_name || 'General Faculty',
                grid: buildGrid(entries.filter(e => e.faculty === f.id))
            }));
        } else {
            const activeRooms = rooms.filter(r => entries.some(e => e.room === r.id));
            return activeRooms.map(r => ({
                id: r.id,
                title: `Room ${r.number}`,
                subtitle: r.room_type || 'Classroom',
                grid: buildGrid(entries.filter(e => e.room === r.id))
            }));
        }
    };

    const groupedData = getGroupedData();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Master Timetable</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Consolidated Institutional Schedule</p>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    {[
                        { id: 'section', label: 'By Section', icon: Layers },
                        { id: 'faculty', label: 'By Faculty', icon: Users },
                        { id: 'room', label: 'By Room', icon: DoorOpen }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setViewType(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                                ${viewType === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}
                            `}
                        >
                            <t.icon size={14} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <Filter size={14} className="text-slate-400" />
                    <select 
                        value={filterDept} 
                        onChange={e => { setFilterDept(e.target.value); setFilterSection(''); }}
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <Calendar size={14} className="text-slate-400" />
                    <select 
                        value={filterYear} 
                        onChange={e => { setFilterYear(e.target.value); setFilterSection(''); }}
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                    >
                        <option value="">All Years</option>
                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <Layers size={14} className="text-slate-400" />
                    <select 
                        value={filterSection} 
                        onChange={e => setFilterSection(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                    >
                        <option value="">All Sections</option>
                        {sections
                            .filter(s => (!filterDept || s.department === parseInt(filterDept)) && (!filterYear || s.year_of_study === parseInt(filterYear)))
                            .map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 shadow-sm transition-all">
                        <Download size={16} />
                    </button>
                    <button className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 shadow-sm transition-all">
                        <Printer size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-inner">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregating matrix data...</p>
                </div>
            ) : groupedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <Search size={48} className="text-slate-200 mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No active timetables found</p>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {groupedData.map(group => renderGrid(group.grid, group.title, group.subtitle))}
                </div>
            )}
        </div>
    );
};

export default MasterTimetable;
