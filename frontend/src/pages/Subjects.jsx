import React, { useState, useEffect } from 'react';
import api from '../api';
import { BookOpen, PlusCircle, Trash2 } from 'lucide-react';

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ 
        code: '', name: '', short_name: '', subject_type: 'THEORY', credits: 3, weekly_hours: 4, max_students: 60, lab_duration_slots: 1
    });

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await api.get('subjects/');
                setSubjects(response.data);
            } catch (err) {
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('subjects/', formData);
            setFormData({ code: '', name: '', short_name: '', subject_type: 'THEORY', credits: 3, weekly_hours: 4, max_students: 60, lab_duration_slots: 1 });
            const response = await api.get('subjects/');
            setSubjects(response.data);
        } catch (err) {
            setError('Failed to add subject');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete subject?')) return;
        await api.delete(`subjects/${id}/`);
        setSubjects(subjects.filter(s => s.id !== id));
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-purple-600 font-medium text-sm mb-1">
                    <BookOpen size={16} /><span>Subjects</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Academic Subjects</h2>
            </div>
            {error && <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200"><h3 className="font-semibold text-slate-800">Add Subject</h3></div>
                <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input name="code" value={formData.code} onChange={handleChange} placeholder="CS101" className="p-2 border rounded-lg text-sm" required />
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Intro to CS" className="p-2 border rounded-lg text-sm md:col-span-2" required />
                    <input name="short_name" value={formData.short_name} onChange={handleChange} placeholder="ICS" className="p-2 border rounded-lg text-sm" required />
                    
                    <select name="subject_type" value={formData.subject_type} onChange={handleChange} className="p-2 border rounded-lg text-sm">
                        <option value="THEORY">Theory</option><option value="LAB">Laboratory</option><option value="ELECTIVE">Elective</option>
                    </select>
                    <input type="number" name="credits" value={formData.credits} onChange={handleChange} placeholder="Credits" className="p-2 border rounded-lg text-sm" title="Credits" required />
                    <input type="number" name="weekly_hours" value={formData.weekly_hours} onChange={handleChange} placeholder="Weekly Hours" className="p-2 border rounded-lg text-sm" title="Weekly Hours" required />
                    
                    <button type="submit" className="bg-purple-600 text-white p-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center justify-center gap-2"><PlusCircle size={16} /> Add Subject</button>
                </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                        <tr><th className="px-5 py-3">Code</th><th className="px-5 py-3">Subject Name</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Hours</th><th className="px-5 py-3 text-right">Delete</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {subjects.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3 font-bold text-slate-800">{s.code}</td>
                                <td className="px-5 py-3">{s.name} <span className="text-xs text-slate-400">({s.short_name})</span></td>
                                <td className="px-5 py-3"><span className={`px-2 py-1 rounded text-xs ${s.subject_type === 'LAB' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{s.subject_type}</span></td>
                                <td className="px-5 py-3">{s.weekly_hours} hrs/wk</td>
                                <td className="px-5 py-3 text-right"><button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default Subjects;
