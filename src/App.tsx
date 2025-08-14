// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import Dashboard from '@/pages/Dashboard';
import AppointmentPage from '@/pages/AppointmentPage';
import Inbox from '@/pages/InboxPage';
import NotesPage from './components/AppointmentComponents/NoteComponent';
import PatientDirectoryPage from './pages/PatientDirectoryPage';
import PatientProfilePage from '@/components/PatientDirectoryComponent/PatientProfileComponent'
import PatientMaternalInsight from '@/components/PatientDirectoryComponent/DirectoryInsightComponent'
import SecretaryManagement from './pages/SecretayManagementPage';
import OBGYNSetting from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import BasicInformation from '@/components/RegistrationComponents/BasicInformationComponent'
import SetPassword from '@/components/RegistrationComponents/SecurityPasswordComponents'
import ProfessionalInformation from '@/components/RegistrationComponents/ProfessionalInformation'
import MultiStepLayout from './components/RegistrationComponents/RegisterLayout';
import SetSchedulePage from '@/components/RegistrationComponents/AvailabilityRegistrationComponent'
import CreationPage from '@/components/RegistrationComponents/FinishRegisterComponent'

export default function App() {
  return (
    <Routes>

      {/* Login Registration Path */}
      <Route path="/" element={<LoginPage />} />
      {/* Registration steps share one layout */}
      <Route element={<MultiStepLayout />}>
        <Route path="/basicinformation" element={<BasicInformation />} />
        <Route path="/setpassword" element={<SetPassword />} />
        <Route path="/professionalinformation" element={<ProfessionalInformation />} />
        <Route path="/setschedule" element={<SetSchedulePage />} />
        <Route path="/finalpage" element={<CreationPage />} />
      </Route>




      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/inbox" element={<Inbox />} />

      {/* Appointment Directory Main */}
      <Route path="/appointments" element={<AppointmentPage />} />
      {/* Appointment Directory Sub Routeas */}
      <Route path="/appointments/notes" element={<NotesPage />} />

      {/* Patient Directory Main */}
      <Route path="/patientdirectory" element={<PatientDirectoryPage />} />
      {/* Patient Directory Sub routes */}
      <Route path="/patientdirectory/profile" element={<PatientProfilePage />} />
      <Route path="/patientdirectory/maternalinsight" element={<PatientMaternalInsight />} />

      {/* Secretary Main */}
      <Route path="/secretarymanagement" element={<SecretaryManagement />} />

      {/* OBGYN Settings Route */}
      <Route path="/Settings" element={<OBGYNSetting />} />

    </Routes>
  );
}
