import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
    Plus, Search, Trash2, Edit2, 
    Filter, BookMarked, Layers, User,
    X, Check, AlertCircle, Loader2
} from 'lucide-react';

const CourseOfferings = () => {
    const [offerings, setOfferings] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [faculty, setFaculty] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearch] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        subject: '',
        section: '',
        faculty: [],
        weekly_hours_override: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [offRes, subRes, secRes, facRes] = await Promise.all([
                api.get('course-offerings/'),
                api.get('subjects/'),
                api.get('sections/'),
                api.get('faculty/')
            ]);
            setOfferings(offRes.data);
            setSubjects(subRes.data);
            setSections(secRes.data);
            setFaculty(facRes.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                subject: item.subject,
                section: item.section,
                faculty: item.faculty || [],
                weekly_hours_override: item.weekly_hours_override || ''
            });
        } else {
            setEditingItem(null);
            setFormData({ subject: '', section: '', faculty: [], weekly_hours_override: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`course-offerings/${editingItem.id}/`, formData);
            } else {
                await api.post('course-offerings/', formData);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            alert('Operation failed. Check if this offering already exists.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this offering?')) return;
        try {
            await api.delete(`course-offerings/${id}/`);
            fetchData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const toggleFaculty = (id) => {
        const current = [...formData.faculty];
        if (current.includes(id)) {
            setFormData({ ...formData, faculty: current.filter(fid => fid !== id) });
        } else {
            setFormData({ ...formData, faculty: [...current, id] });
        }
    };

    const filtered = offerings.filter(o => 
        o.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.section_label?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Academic Assignments...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Course Offerings</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Manage Subject assignments to sections</p>
                </div>
                
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-sm hover:bg-indigo-700 transition-all"
                >
                    <Plus size={16} /> New Offering
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search offerings..."
                        value={searchTerm}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Subject</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Section</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Faculty</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Hrs/Week</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center">
                                            <BookMarked size={16} />
                                        </div>
                                        <span className="font-bold text-slate-700">{item.subject_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-600">{item.section_label}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {item.faculty_names?.map((f, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{f}</span>
                                        )) || 'None'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{item.weekly_hours_override || 'Default'}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleOpenModal(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                                {editingItem ? 'Edit Offering' : 'Create Offering'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                                <select 
                                    required
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Section</label>
                                <select 
                                    required
                                    value={formData.section}
                                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                >
                                    <option value="">Select Section</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Faculty (Multiple)</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                    {faculty.map(f => (
                                        <div 
                                            key={f.id} 
                                            onClick={() => toggleFaculty(f.id)}
                                            className={`px-3 py-2 rounded-md border text-[10px] font-bold cursor-pointer transition-all flex items-center justify-between
                                                ${formData.faculty.includes(f.id) ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}
                                            `}
                                        >
                                            <span className="truncate">{f.full_name}</span>
                                            {formData.faculty.includes(f.id) && <Check size={12} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-indigo-600">Weekly Hours Override (Optional)</label>
                                <input 
                                    type="number"
                                    placeholder="Leave blank for subject default"
                                    value={formData.weekly_hours_override}
                                    onChange={e => setFormData({ ...formData, weekly_hours_override: e.target.value })}
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

export default CourseOfferings;
