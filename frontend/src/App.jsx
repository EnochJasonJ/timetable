import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Faculty from './pages/Faculty';
import Rooms from './pages/Rooms';
import Subjects from './pages/Subjects';
import Sections from './pages/Sections';
import Timetables from './pages/Timetables';
import TimetableGenerate from './pages/TimetableGenerate';
import TimetableView from './pages/TimetableView';
import AcademicYears from './pages/AcademicYears';
import Layout from './components/Layout';


// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return <Layout>{children}</Layout>;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    {/* Protected Routes */}
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
                    <Route path="/faculty" element={<ProtectedRoute><Faculty /></ProtectedRoute>} />
                    <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
                    <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
                    <Route path="/sections" element={<ProtectedRoute><Sections /></ProtectedRoute>} />
                    <Route path="/timetables" element={<ProtectedRoute><Timetables /></ProtectedRoute>} />
                    <Route path="/timetables/generate" element={<ProtectedRoute><TimetableGenerate /></ProtectedRoute>} />
                    <Route path="/timetables/:id" element={<ProtectedRoute><TimetableView /></ProtectedRoute>} />
                    <Route path="/settings/academic-years" element={<ProtectedRoute><AcademicYears /></ProtectedRoute>} />
                    
                    <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
