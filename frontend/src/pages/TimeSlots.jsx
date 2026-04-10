import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
    Plus, Clock, Trash2, Edit2, 
    Calendar, X, Check, Loader2,
    Sun, Moon, Coffee, Utensils
} from 'lucide-react';

const DAYS = [
    { code: 'MON', name: 'Monday' },
    { code: 'TUE', name: 'Tuesday' },
    { code: 'WED', name: 'Wednesday' },
    { code: 'THU', name: 'Thursday' },
    { code: 'FRI', name: 'Friday' },
    { code: 'SAT', name: 'Saturday' },
];

const SLOT_TYPES = [
    { code: 'REGULAR', name: 'Regular Class', icon: Clock },
    { code: 'BREAK', name: 'Break', icon: Coffee },
    { code: 'LUNCH', name: 'Lunch', icon: Utensils },
];

const TimeSlots = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        slot_number: 1,
        day: 'MON',
        start_time: '08:00',
        end_time: '09:00',
        slot_type: 'REGULAR',
        label: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('timeslots/');
            setSlots(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                slot_number: item.slot_number,
                day: item.day,
                start_time: item.start_time.slice(0, 5),
                end_time: item.end_time.slice(0, 5),
                slot_type: item.slot_type,
                label: item.label || ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                slot_number: slots.length + 1,
                day: 'MON',
                start_time: '08:00',
                end_time: '09:00',
                slot_type: 'REGULAR',
                label: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`timeslots/${editingItem.id}/`, formData);
            } else {
                await api.post('timeslots/', formData);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            alert('Operation failed. Possible overlapping slot or duplicate number.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this slot?')) return;
        try {
            await api.delete(`timeslots/${id}/`);
            fetchData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const groupedSlots = {};
    DAYS.forEach(d => {
        groupedSlots[d.code] = slots.filter(s => s.day === d.code).sort((a, b) => a.slot_number - b.slot_number);
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuring Temporal Grids...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Time Slots</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Define institution-wide scheduling periods</p>
                </div>
                
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-sm hover:bg-indigo-700 transition-all"
                >
                    <Plus size={16} /> Add Slot
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {DAYS.map(day => (
                    <div key={day.code} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">{day.name}</h3>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">{groupedSlots[day.code].length} Periods</span>
                        </div>
                        <div className="p-4 space-y-3 flex-1">
                            {groupedSlots[day.code].length === 0 ? (
                                <div className="py-10 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No slots defined</div>
                            ) : (
                                groupedSlots[day.code].map(slot => {
                                    const TypeIcon = SLOT_TYPES.find(t => t.code === slot.slot_type)?.icon || Clock;
                                    return (
                                        <div key={slot.id} className="group flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                                                ${slot.slot_type === 'REGULAR' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}
                                            `}>
                                                <TypeIcon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">P{slot.slot_number}</span>
                                                    <span className="font-extrabold text-xs text-slate-700">{slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}</span>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{slot.label || slot.slot_type}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(slot)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit2 size={12} /></button>
                                                <button onClick={() => handleDelete(slot.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                                {editingItem ? 'Edit Time Slot' : 'Create Time Slot'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Day</label>
                                    <select 
                                        required
                                        value={formData.day}
                                        onChange={e => setFormData({ ...formData, day: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-700"
                                    >
                                        {DAYS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Slot Number</label>
                                    <input 
                                        type="number" required
                                        value={formData.slot_number}
                                        onChange={e => setFormData({ ...formData, slot_number: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                                    <input 
                                        type="time" required
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                                    <input 
                                        type="time" required
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Slot Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {SLOT_TYPES.map(type => (
                                        <button
                                            key={type.code}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, slot_type: type.code })}
                                            className={`py-2 rounded-lg border text-[9px] font-bold uppercase transition-all flex flex-col items-center gap-1
                                                ${formData.slot_type === type.code ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}
                                            `}
                                        >
                                            <type.icon size={14} />
                                            {type.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Label (Optional)</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Morning Session, Prayer Break"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-indigo-700 shadow-md transition-all">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlots;
