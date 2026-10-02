import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';

import Login              from './pages/Login';
import Dashboard          from './pages/Dashboard';
import Teachers           from './pages/Teachers';
import Subjects           from './pages/Subjects';
import Classrooms         from './pages/Classrooms';
import Classes            from './pages/Classes';
import Divisions          from './pages/Divisions';
import Availability       from './pages/Availability';
import Requirements       from './pages/Requirements';
import TimetableGenerator from './pages/TimetableGenerator';
import GeneratedTimetable from './pages/GeneratedTimetable';
import ConflictReport     from './pages/ConflictReport';
import SavedTimetables    from './pages/SavedTimetables';
import Settings           from './pages/Settings';

function RequireAuth({ children }) {
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"   element={<Dashboard />} />
              <Route path="teachers"    element={<Teachers />} />
              <Route path="subjects"    element={<Subjects />} />
              <Route path="classrooms"  element={<Classrooms />} />
              <Route path="classes"     element={<Classes />} />
              <Route path="divisions"   element={<Divisions />} />
              <Route path="availability" element={<Availability />} />
              <Route path="requirements" element={<Requirements />} />
              <Route path="generate"    element={<TimetableGenerator />} />
              <Route path="timetable/:id" element={<GeneratedTimetable />} />
              <Route path="conflicts/:id" element={<ConflictReport />} />
              <Route path="saved"       element={<SavedTimetables />} />
              <Route path="settings"    element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
