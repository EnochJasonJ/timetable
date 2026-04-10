import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
    Users as UsersIcon, Shield, Trash2, Edit2, 
    UserPlus, Mail, Building, Layers,
    X, Check, AlertCircle, Loader2, ChevronRight
} from 'lucide-react';

const ROLES = [
    { code: 'SUPER_ADMIN', name: 'Super Admin', color: 'bg-red-50 text-red-600 border-red-100' },
    { code: 'TIMETABLE_ADMIN', name: 'Timetable Admin', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { code: 'HOD', name: 'H.O.D', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { code: 'FACULTY', name: 'Faculty Member', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { code: 'STUDENT', name: 'Student', color: 'bg-slate-50 text-slate-500 border-slate-100' },
];

const Users = () => {
    const [profiles, setProfiles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        role: 'STUDENT',
        department: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profRes, deptRes] = await Promise.all([
                api.get('user-profiles/'),
                api.get('departments/')
            ]);
            setProfiles(profRes.data);
            setDepartments(deptRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item) => {
        setEditingItem(item);
        setFormData({
            role: item.role,
            department: item.department || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`user-profiles/${editingItem.id}/`, formData);
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            alert('Operation failed.');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Auditing User Registry...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Users & Roles</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Manage user permissions and departmental associations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(profile => {
                    const roleConfig = ROLES.find(r => r.code === profile.role) || ROLES[4];
                    return (
                        <div key={profile.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                            <div className="p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-lg uppercase shadow-inner">
                                        {profile.username?.charAt(0)}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${roleConfig.color}`}>
                                        {roleConfig.name}
                                    </span>
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="font-extrabold text-slate-900 tracking-tight truncate">{profile.first_name} {profile.last_name}</h3>
                                    <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 lowercase">
                                        <Mail size={12} className="opacity-60" /> {profile.username}@college.edu
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg">
                                            <Building size={14} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-[150px]">
                                            {profile.department_name || 'No Department'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => handleOpenModal(profile)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-lg"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">Manage User Permissions</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-slate-400 border border-slate-200 uppercase">
                                    {editingItem?.username?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-extrabold text-slate-900">{editingItem?.first_name} {editingItem?.last_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingItem?.username}</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Level (Role)</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.code}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: role.code })}
                                            className={`px-4 py-3 rounded-xl border text-left transition-all flex items-center justify-between
                                                ${formData.role === role.code ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Shield size={16} className={formData.role === role.code ? 'text-white' : 'text-slate-400'} />
                                                <span className="text-xs font-bold uppercase tracking-widest">{role.name}</span>
                                            </div>
                                            {formData.role === role.code && <Check size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Departmental Anchor</label>
                                <select 
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                >
                                    <option value="">No Department / Admin</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 shadow-xl transition-all">Update Access</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
