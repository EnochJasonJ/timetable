import React, { useState, useEffect } from 'react';
import api from '../api';
import { CalendarDays, PlusCircle, Trash2 } from 'lucide-react';

const AcademicYears = () => {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ label: '', is_active: false });

    useEffect(() => {
        fetchYears();
    }, []);

    const fetchYears = async () => {
        try {
            const response = await api.get('academic-years/');
            setYears(response.data);
        } catch (err) {
            setError('Failed to load academic years');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('academic-years/', formData);
            setFormData({ label: '', is_active: false });
            fetchYears();
        } catch (err) {
            setError('Failed to add academic year');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete academic year?')) return;
        await api.delete(`academic-years/${id}/`);
        setYears(years.filter(y => y.id !== id));
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mb-1">
                    <CalendarDays size={16} /><span>Settings</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Academic Years</h2>
                <p className="text-slate-500 text-sm">Define the academic terms for scheduling.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Add Academic Year</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-5 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Year Label</label>
                        <input 
                            name="label" 
                            value={formData.label} 
                            onChange={handleChange} 
                            placeholder="e.g. 2024-25" 
                            className="w-full p-2 border rounded-lg text-sm outline-none" 
                            required 
                        />
                    </div>
                    <div className="flex items-center gap-2 pb-3">
                        <input 
                            type="checkbox" 
                            name="is_active" 
                            id="is_active"
                            checked={formData.is_active} 
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="text-sm text-slate-700">Set as Active</label>
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white p-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                        <PlusCircle size={16} /> Add Year
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-5 py-3">Label</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3 text-right">Delete</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {years.map(y => (
                            <tr key={y.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3 font-semibold text-slate-800">{y.label}</td>
                                <td className="px-5 py-3">
                                    {y.is_active ? (
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
                                    ) : (
                                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Inactive</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <button onClick={() => handleDelete(y.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AcademicYears;
