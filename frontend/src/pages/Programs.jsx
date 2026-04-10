import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
    Plus, Search, Trash2, Edit2, 
    GraduationCap, Building2, Layers,
    X, Check, AlertCircle, Loader2
} from 'lucide-react';

const Programs = () => {
    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        department: '',
        duration_years: 4
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [progRes, deptRes] = await Promise.all([
                api.get('programs/'),
                api.get('departments/')
            ]);
            setPrograms(progRes.data);
            setDepartments(deptRes.data);
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
                name: item.name,
                code: item.code,
                department: item.department,
                duration_years: item.duration_years
            });
        } else {
            setEditingItem(null);
            setFormData({ name: '', code: '', department: '', duration_years: 4 });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`programs/${editingItem.id}/`, formData);
            } else {
                await api.post('programs/', formData);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            alert('Operation failed. Check if code is unique.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this program? This may affect associated sections.')) return;
        try {
            await api.delete(`programs/${id}/`);
            fetchData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const filtered = programs.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mapping Academic Curriculum...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Academic Programs</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Degree tracks and curriculum structures</p>
                </div>
                
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-sm hover:bg-indigo-700 transition-all"
                >
                    <Plus size={16} /> Add Program
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search programs..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Program Info</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Department</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Duration</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center">
                                            <GraduationCap size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700">{item.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.code}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                                        {item.department_name || 'General'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{item.duration_years} Years</td>
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
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                                {editingItem ? 'Edit Program' : 'New Program'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Program Name</label>
                                <input 
                                    type="text" required
                                    placeholder="e.g. Computer Science & Engineering"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Program Code</label>
                                    <input 
                                        type="text" required
                                        placeholder="e.g. CSE"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duration (Yrs)</label>
                                    <input 
                                        type="number" required
                                        value={formData.duration_years}
                                        onChange={e => setFormData({ ...formData, duration_years: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Anchor Department</label>
                                <select 
                                    required
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-indigo-700 shadow-md transition-all">Save Program</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Programs;
