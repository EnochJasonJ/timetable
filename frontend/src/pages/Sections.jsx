import React, { useState, useEffect } from 'react';
import api from '../api';
import { Layers, PlusCircle, Trash2 } from 'lucide-react';

const Sections = () => {
    const [sections, setSections] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ 
        name: '', year_of_study: 1, semester: 1, department: '', program: '', academic_year: 1, strength: 60
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [secRes, deptRes, progRes, yrRes] = await Promise.all([
                    api.get('sections/'),
                    api.get('departments/'),
                    api.get('programs/'),
                    api.get('academic-years/').catch(() => ({ data: [] })) // Fallback if endpoint not added
                ]);
                setSections(secRes.data);
                setDepartments(deptRes.data);
                setPrograms(progRes.data);
                
                // If academic years API doesn't exist, we assume ID 1 in the dummy data 
                // In production, we'd add an AcademicYear API view
            } catch (err) {
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('sections/', formData);
            setFormData({ name: '', year_of_study: 1, semester: 1, department: '', program: '', academic_year: 1, strength: 60 });
            const response = await api.get('sections/');
            setSections(response.data);
        } catch (err) {
            setError('Failed to add section');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete section?')) return;
        await api.delete(`sections/${id}/`);
        setSections(sections.filter(s => s.id !== id));
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-fuchsia-600 font-medium text-sm mb-1">
                    <Layers size={16} /><span>Sections</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Class Sections</h2>
            </div>
            {error && <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200"><h3 className="font-semibold text-slate-800">Add Section</h3></div>
                <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Section (A/B/C)" className="p-2 border rounded-lg text-sm" required />
                    <input type="number" name="year_of_study" value={formData.year_of_study} onChange={handleChange} placeholder="Year (1-4)" className="p-2 border rounded-lg text-sm" required />
                    <input type="number" name="semester" value={formData.semester} onChange={handleChange} placeholder="Semester" className="p-2 border rounded-lg text-sm" required />
                    <input type="number" name="strength" value={formData.strength} onChange={handleChange} placeholder="Students" className="p-2 border rounded-lg text-sm" required />
                    
                    <select name="department" value={formData.department} onChange={handleChange} className="p-2 border rounded-lg text-sm" required>
                        <option value="">Dept...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                    </select>
                    <select name="program" value={formData.program} onChange={handleChange} className="p-2 border rounded-lg text-sm md:col-span-2" required>
                        <option value="">Program...</option>
                        {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    
                    <button type="submit" className="bg-fuchsia-600 text-white p-2 rounded-lg text-sm font-medium hover:bg-fuchsia-700 flex items-center justify-center gap-2"><PlusCircle size={16} /> Add</button>
                </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                        <tr><th className="px-5 py-3">Label</th><th className="px-5 py-3">Dept</th><th className="px-5 py-3">Students</th><th className="px-5 py-3 text-right">Delete</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sections.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3 font-bold text-slate-800">Year {s.year_of_study} {s.program_name} - {s.name}</td>
                                <td className="px-5 py-3">{s.department_name}</td>
                                <td className="px-5 py-3">{s.strength} allowed</td>
                                <td className="px-5 py-3 text-right"><button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default Sections;
