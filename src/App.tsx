// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import Dashboard from '@/pages/Dashboard';
import AppointmentPage from '@/pages/AppointmentPage';
import Inbox from '@/pages/InboxPage';
import NotesPage from './components/AppointmentComponents/NoteComponent';
import PatientDirectoryPage from './pages/PatientDirectoryPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/appointments" element={<AppointmentPage />} />
       <Route path="/appointments/notes" element={<NotesPage />} />
       <Route path ="/patientdirectory" element={<PatientDirectoryPage />} />
    </Routes>
  );
}
