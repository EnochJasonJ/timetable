import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Calendar, Wand2, ShieldCheck, LayoutGrid, User, Lock, AlertCircle, LogIn } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await login(username, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex w-full min-h-screen font-sans bg-slate-50 flex-col md:flex-row">
            {/* Left Branding Panel */}
            <div className="md:flex-1 relative bg-gradient-to-br from-indigo-700 via-indigo-500 to-violet-500 flex flex-col items-center justify-center p-12 overflow-hidden py-16">
                {/* Background Blobs for Visual Interest */}
                <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />

                <div className="relative z-10 text-center max-w-[380px]">
                    <div className="w-20 h-20 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
                        <Calendar size={36} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 leading-tight">
                        Timetable <br /><span className="text-white/80">Management System</span>
                    </h1>
                    <p className="text-sm border-white/60 text-indigo-100 leading-relaxed mb-10">
                        AI-powered academic scheduling for modern institutions. Save hours of manual planning.
                    </p>

                    <div className="hidden md:flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-4 bg-white/10 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
                                <Wand2 size={20} />
                            </div>
                            <div className="text-left">
                                <strong className="block text-sm font-semibold text-white">AI-Powered Generation</strong>
                                <span className="text-xs text-white/50">Conflict-free schedules in seconds</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="text-left">
                                <strong className="block text-sm font-semibold text-white">Role-Based Access</strong>
                                <span className="text-xs text-white/50">Admin, HOD, Faculty & Student views</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
                                <LayoutGrid size={20} />
                            </div>
                            <div className="text-left">
                                <strong className="block text-sm font-semibold text-white">Master Timetable</strong>
                                <span className="text-xs text-white/50">Campus-wide planning dashboard</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="w-full md:w-[480px] bg-white flex items-center justify-center p-10 md:p-14 border-t md:border-t-0 md:border-l border-slate-200">
                <div className="w-full max-w-[360px]">
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1">Welcome Back</h2>
                    <p className="text-sm text-slate-500 mb-8">Sign in to manage your institution's timetable.</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg text-red-500 text-sm font-medium p-3">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2" htmlFor="username">Username</label>
                            <div className="relative">
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="w-full py-3 pr-11 pl-4 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-slate-800 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                    required
                                />
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2" htmlFor="password">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full py-3 pr-11 pl-4 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-slate-800 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                    required
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-br from-indigo-500 to-violet-500 hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(99,102,241,0.4)] transition-all active:translate-y-0 text-white text-sm mt-3 font-bold rounded-xl disabled:opacity-70"
                        >
                            <LogIn size={18} />
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        Timetable Management System &copy; 2025 &mdash; Academic Scheduling Platform
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
