import React, { useState, useEffect } from 'react';
import api from '../api';
import { Building2, PlusCircle, Trash2, Award } from 'lucide-react';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ code: '', name: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.get('departments/');
            setDepartments(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('departments/', formData);
            setFormData({ code: '', name: '' });
            fetchDepartments();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to add department');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        try {
            await api.delete(`departments/${id}/`);
            fetchDepartments();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete department');
        }
    };

    if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mb-1">
                    <Building2 size={16} />
                    <span>Departments</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Departments & Programs</h2>
                <p className="text-slate-500 text-sm">Manage academic departments and their associated programs.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Form */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800">Add Department</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Department Code</label>
                            <input 
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                placeholder="e.g. CSE"
                                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:bg-white outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Department Name</label>
                            <input 
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. Computer Science"
                                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:bg-white outline-none"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70"
                        >
                            <PlusCircle size={16} />
                            Add Department
                        </button>
                    </form>
                </div>

                {/* Quick Info */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800">Overview</h3>
                    </div>
                    <div className="p-5">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col mb-4">
                            <span className="text-3xl font-bold text-slate-800">{departments.length}</span>
                            <span className="text-sm font-medium text-slate-500">Total Departments</span>
                        </div>
                        {/* Note: In a complete implementation, linking to a unified Programs view or tab is useful. */}
                        <div className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium cursor-pointer hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors border border-indigo-100">
                            <Award size={16} /> Manage Programs (Currently API Only)
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Code</th>
                                <th className="px-5 py-3 font-semibold">Department Name</th>
                                <th className="px-5 py-3 font-semibold text-right">Remove</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {departments.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-5 py-10 text-center">
                                        <div className="inline-flex flex-col items-center justify-center text-slate-400">
                                            <Building2 size={32} className="mb-2 opacity-50" />
                                            <p className="font-medium text-slate-500">No Departments</p>
                                            <p className="text-xs">Add your first department above.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                departments.map(dept => (
                                    <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-semibold text-xs border border-indigo-100">
                                                {dept.code}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-slate-800">{dept.name}</td>
                                        <td className="px-5 py-3 text-right">
                                            <button 
                                                onClick={() => handleDelete(dept.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Delete Department"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Departments;
