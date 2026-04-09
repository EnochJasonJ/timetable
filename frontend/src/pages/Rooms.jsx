import React, { useState, useEffect } from 'react';
import api from '../api';
import { DoorOpen, PlusCircle, Trash2 } from 'lucide-react';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ 
        number: '', name: '', building: '', seating_capacity: 60, room_type: 'CLASSROOM' 
    });

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await api.get('rooms/');
                setRooms(response.data);
            } catch (err) {
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('rooms/', formData);
            setFormData({ number: '', name: '', building: '', seating_capacity: 60, room_type: 'CLASSROOM' });
            const response = await api.get('rooms/');
            setRooms(response.data);
        } catch (err) {
            setError('Failed to add room');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete room?')) return;
        await api.delete(`rooms/${id}/`);
        setRooms(rooms.filter(r => r.id !== id));
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-pink-600 font-medium text-sm mb-1">
                    <DoorOpen size={16} /><span>Rooms</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Campus Rooms & Labs</h2>
            </div>
            {error && <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200"><h3 className="font-semibold text-slate-800">Add Room</h3></div>
                <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input name="number" value={formData.number} onChange={handleChange} placeholder="Room Num (A101)" className="p-2 border rounded-lg text-sm outline-none" required />
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Friendly Name" className="p-2 border rounded-lg text-sm outline-none" />
                    <input name="building" value={formData.building} onChange={handleChange} placeholder="Building" className="p-2 border rounded-lg text-sm outline-none" />
                    <input type="number" name="seating_capacity" value={formData.seating_capacity} onChange={handleChange} placeholder="Capacity" className="p-2 border rounded-lg text-sm outline-none" required />
                    <select name="room_type" value={formData.room_type} onChange={handleChange} className="p-2 border rounded-lg text-sm outline-none md:col-span-2">
                        <option value="CLASSROOM">Classroom</option>
                        <option value="LAB">Laboratory</option>
                        <option value="SEMINAR">Seminar Hall</option>
                        <option value="AUDITORIUM">Auditorium</option>
                    </select>
                    <button type="submit" className="bg-pink-600 text-white p-2 rounded-lg text-sm font-medium hover:bg-pink-700 flex items-center justify-center gap-2 md:col-span-2"><PlusCircle size={16} /> Add Room</button>
                </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                        <tr><th className="px-5 py-3">Number</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Capacity</th><th className="px-5 py-3 text-right">Delete</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rooms.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3 font-bold text-slate-800">{r.number} <span className="text-xs font-normal text-slate-400 block">{r.name}</span></td>
                                <td className="px-5 py-3"><span className="bg-white border rounded px-2 py-0.5 text-xs">{r.room_type}</span></td>
                                <td className="px-5 py-3">{r.seating_capacity} limits</td>
                                <td className="px-5 py-3 text-right"><button onClick={() => handleDelete(r.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default Rooms;
