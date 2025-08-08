// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import Dashboard from '@/pages/Dashboard';
import AppointmentPage from '@/pages/AppointmentPage';
import Inbox from '@/pages/InboxPage';
import NotesPage from './components/AppointmentComponents/NoteComponent';
import PatientDirectoryPage from './pages/PatientDirectoryPage';
import PatientProfilePage from  '@/components/PatientDirectoryComponent/PatientProfileComponent'
import PatientMaternalInsight from '@/components/PatientDirectoryComponent/DirectoryInsightComponent'
import SecretaryManagement from './pages/SecretayManagementPage';
import OBGYNSetting from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/inbox" element={<Inbox />} />

      {/* Appointment Directory Main */}
      <Route path="/appointments" element={<AppointmentPage />} />
      {/* Appointment Directory Sub Routeas */}
       <Route path="/appointments/notes" element={<NotesPage />} />

       {/* Patient Directory Main */}
       <Route path ="/patientdirectory" element={<PatientDirectoryPage />} />
       {/* Patient Directory Sub routes */}
       <Route path ="/patientdirectory/profile" element={<PatientProfilePage />}/>
        <Route path ="/patientdirectory/maternalinsight" element={<PatientMaternalInsight />}/>

      {/* Secretary Main */}
      <Route path = "/secretarymanagement" element={<SecretaryManagement />} />

      {/* OBGYN Settings Route */}
      <Route path ="/Settings" element={<OBGYNSetting />} />
        
    </Routes>
  );
}
