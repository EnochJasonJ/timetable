import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, PlusCircle, Trash2 } from 'lucide-react';

const Faculty = () => {
    const [faculty, setFaculty] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ 
        faculty_id: '', first_name: '', last_name: '', initials: '', department: '', designation: 'ASST_PROF' 
    });

    useEffect(() => {
        const loadInitials = async () => {
            try {
                const [facRes, deptRes] = await Promise.all([
                    api.get('faculty/'),
                    api.get('departments/')
                ]);
                setFaculty(facRes.data);
                setDepartments(deptRes.data);
            } catch (err) {
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        loadInitials();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('faculty/', formData);
            setFormData({ faculty_id: '', first_name: '', last_name: '', initials: '', department: '', designation: 'ASST_PROF' });
            const fetchAgain = await api.get('faculty/');
            setFaculty(fetchAgain.data);
        } catch (err) {
            setError('Failed to add faculty');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete faculty?')) return;
        await api.delete(`faculty/${id}/`);
        setFaculty(faculty.filter(f => f.id !== id));
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mb-1">
                    <Users size={16} /><span>Faculty</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Faculty Members</h2>
            </div>
            {error && <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200"><h3 className="font-semibold text-slate-800">Add Faculty</h3></div>
                <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input name="faculty_id" value={formData.faculty_id} onChange={handleChange} placeholder="Faculty ID (e.g. CSE001)" className="p-2 border rounded-lg text-sm outline-none" required />
                    <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" className="p-2 border rounded-lg text-sm outline-none" required />
                    <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" className="p-2 border rounded-lg text-sm outline-none" />
                    <input name="initials" value={formData.initials} onChange={handleChange} placeholder="Initials (e.g. Dr. RK)" className="p-2 border rounded-lg text-sm outline-none" />
                    <select name="department" value={formData.department} onChange={handleChange} className="p-2 border rounded-lg text-sm outline-none" required>
                        <option value="">Select Department...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select name="designation" value={formData.designation} onChange={handleChange} className="p-2 border rounded-lg text-sm outline-none">
                        <option value="PROF">Professor</option>
                        <option value="ASSOC_PROF">Associate Professor</option>
                        <option value="ASST_PROF">Assistant Professor</option>
                        <option value="HOD">Head of Department</option>
                    </select>
                    <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 md:col-span-3"><PlusCircle size={16} /> Add Faculty</button>
                </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                        <tr><th className="px-5 py-3">ID</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Dept</th><th className="px-5 py-3 text-right">Delete</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {faculty.map(f => (
                            <tr key={f.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3"><span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-semibold">{f.faculty_id}</span></td>
                                <td className="px-5 py-3 font-semibold text-slate-800">{f.first_name} {f.last_name}</td>
                                <td className="px-5 py-3">{f.department_name}</td>
                                <td className="px-5 py-3 text-right"><button onClick={() => handleDelete(f.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default Faculty;
