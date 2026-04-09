import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { 
    PlayCircle, CheckSquare, Square, AlertCircle, 
    Loader2, Settings2, Database, Cpu, 
    Sparkles, CheckCircle2, FlaskConical, Target,
    BrainCircuit, Info
} from 'lucide-react';

const TimetableGenerate = () => {
    const [sections, setSections] = useState([]);
    const [selectedSections, setSelectedSections] = useState(new Set());
    const [maxGens, setMaxGens] = useState(300);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('sections/')
            .then(res => {
                setSections(res.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load sections.');
                setLoading(false);
            });
    }, []);

    const toggleSection = (id) => {
        const next = new Set(selectedSections);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedSections(next);
    };

    const toggleAll = () => {
        if (selectedSections.size === sections.length) {
            setSelectedSections(new Set());
        } else {
            setSelectedSections(new Set(sections.map(s => s.id)));
        }
    };

    const handleGenerate = async () => {
        if (selectedSections.size === 0) {
            setError('Please choose at least one academic section to proceed.');
            return;
        }
        
        setError('');
        setGenerating(true);
        
        try {
            const res = await api.post('timetables/generate/', {
                sections: Array.from(selectedSections),
                max_generations: maxGens
            });
            
            if (res.data.success) {
                navigate(`/timetables/${res.data.timetable_id}`);
            } else {
                setError(res.data.message || 'The algorithm failed to find a valid solution.');
                setGenerating(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'A neural error occurred during core execution.');
            setGenerating(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
             <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <BrainCircuit size={20} className="text-indigo-600" />
                </div>
            </div>
            <p className="mt-6 text-slate-400 font-black uppercase tracking-[3px] text-[10px]">Loading Core Modules...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black tracking-widest uppercase">
                        <Sparkles size={12} /> Optimization Engine
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Generate Schedule</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest max-w-xl leading-relaxed">
                        Select target sections and configure constraints. Our AI-driven genetic algorithm will compute thousands of permutations to find a conflict-free solution.
                    </p>
                </div>
                <div className="flex items-center gap-4 border border-slate-200 bg-white p-3 rounded-[2rem] shadow-sm">
                    <div className="flex flex-col items-end pr-4 border-r border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Loaded Sections</span>
                        <span className="text-lg font-black text-slate-800">{sections.length} Units</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Selected</span>
                        <span className="text-lg font-black text-indigo-600">{selectedSections.size} Units</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-[2rem] flex items-center gap-4 text-sm border-2 border-red-100 shadow-xl shadow-red-500/5 animate-in slide-in-from-top-2">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertCircle size={20} />
                    </div>
                    <p className="font-bold">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* 2. Selection Hub */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[3rem] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-slate-900 tracking-tight uppercase text-sm">Target Sections</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Academic units to schedule</p>
                            </div>
                            <button 
                                onClick={toggleAll} 
                                className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all tracking-widest uppercase"
                            >
                                {selectedSections.size === sections.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        
                        <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {sections.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                   <Database size={64} />
                                   <p className="font-black uppercase tracking-widest text-xs mt-4">Database Empty</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sections.map(s => {
                                        const isSelected = selectedSections.has(s.id);
                                        return (
                                            <div 
                                                key={s.id}
                                                onClick={() => !generating && toggleSection(s.id)}
                                                className={`
                                                    group p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 flex items-center gap-4
                                                    ${isSelected ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-600/20' : 'bg-white border-slate-100 text-slate-800 hover:border-indigo-300'}
                                                    ${generating ? 'opacity-50 cursor-not-allowed scale-[0.98]' : 'hover:scale-[1.02]'}
                                                `}
                                            >
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner
                                                    ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}
                                                `}>
                                                    {isSelected ? <CheckSquare size={24} /> : <Target size={24} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-black text-xs uppercase tracking-wider truncate mb-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                        Year {s.year_of_study} {s.name}
                                                    </div>
                                                    <div className={`text-[10px] font-bold uppercase tracking-tight truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                        {s.program_name} • {s.strength} Students
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Neural Configuration Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[3rem] p-8 text-white space-y-8 shadow-2xl shadow-indigo-900/10">
                        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                <Settings2 className="text-indigo-400" size={28} />
                            </div>
                            <div>
                                <h4 className="font-black text-lg leading-tight uppercase tracking-tight">Configuration</h4>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Algorithm Tuning</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generations</span>
                                    <span className="text-lg font-black text-indigo-400">{maxGens}</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="50" 
                                    max="1000" 
                                    step="50"
                                    value={maxGens} 
                                    onChange={(e) => setMaxGens(parseInt(e.target.value))}
                                    disabled={generating}
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                                    <span>Fast Results</span>
                                    <span>Deep Optimization</span>
                                </div>
                            </div>
                            
                            <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5 space-y-3">
                                <div className="flex items-center gap-2 text-indigo-400">
                                    <Info size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Engine Tip</span>
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                                    For large departments (&gt;10 sections), we recommend at least <span className="text-white">500 generations</span> to ensure optimal gap-squaring.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={selectedSections.size === 0 || generating}
                            className={`
                                w-full py-5 rounded-[2rem] font-black uppercase text-xs tracking-[3px] flex items-center justify-center gap-3 transition-all duration-500 shadow-xl
                                ${generating 
                                    ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20 active:scale-[0.98] border border-indigo-500'}
                            `}
                        >
                            {generating ? (
                                <><Loader2 size={18} className="animate-spin text-indigo-500" /> Computing Matrices...</>
                            ) : (
                                <><PlayCircle size={18} /> Run Algorithm</>
                            )}
                        </button>
                    </div>

                    <div className="bg-emerald-50 rounded-[3rem] p-8 border border-emerald-100 overflow-hidden relative group">
                        <CheckCircle2 size={120} className="absolute -bottom-10 -right-10 text-emerald-100 -rotate-12 transition-transform group-hover:scale-110" />
                        <div className="relative">
                            <h5 className="font-black text-emerald-900 text-sm uppercase tracking-tight">System Status</h5>
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-1">Resource Health: 100%</p>
                            <div className="mt-4 flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetableGenerate;
