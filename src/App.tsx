// src/App.tsx
import { Routes, Route } from "react-router-dom"
 // ✅ correct (shadcn/ui)
  // 👈 import this

import Dashboard from "@/pages/OBGYN/Dashboard"
import AppointmentPage from "@/pages/OBGYN/AppointmentPage"
import Inbox from "@/pages/OBGYN/InboxPage"
import NotesPage from "./components/AppointmentComponents/NoteComponent"
import PatientDirectoryPage from "./pages/OBGYN/PatientDirectoryPage"
import PatientProfilePage from "@/components/PatientDirectoryComponent/PatientProfileComponent"
import PatientMaternalInsight from "@/components/PatientDirectoryComponent/DirectoryInsightComponent"
import SecretaryManagement from "./pages/OBGYN/SecretayManagementPage"
import OBGYNSetting from "./pages/SettingsPage"
import LoginPage from "./pages/LoginPage"
import BasicInformation from "@/components/RegistrationComponents/BasicInformationComponent"
import SetPassword from "@/components/RegistrationComponents/SecurityPasswordComponents"
import ProfessionalInformation from "@/components/RegistrationComponents/ProfessionalInformation"
import MultiStepLayout from "./components/RegistrationComponents/RegisterLayout"
import SetSchedulePage from "@/components/RegistrationComponents/AvailabilityRegistrationComponent"
import CreationPage from "@/components/RegistrationComponents/FinishRegisterComponent"
import ProtectedLayout from "@/layouts/ProtectedRoutesLayout"
import DashboardLayout from "./layouts/DashboardLayout"
import SecretaryDashboard from "@/pages/SECRETARY/SecretaryDashboardPage"
import SecretaryAppointmentDirectory from "@/components/SecretaryComponents/SecretaryAppointmentDirectory"

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Registration */}
        <Route element={<MultiStepLayout />}>
          <Route path="/basicinformation" element={<BasicInformation />} />
          <Route path="/setpassword" element={<SetPassword />} />
          <Route path="/professionalinformation" element={<ProfessionalInformation />} />
          <Route path="/setschedule" element={<SetSchedulePage />} />
          <Route path="/finalpage" element={<CreationPage />} />
        </Route>

        <Route element={<ProtectedLayout allowedRoles={["obgyn"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/appointments" element={<AppointmentPage />} />
            <Route path="/appointments/notes" element={<NotesPage />} />
            <Route path="/patientdirectory" element={<PatientDirectoryPage />} />
            <Route path="/patientdirectory/profile" element={<PatientProfilePage />} />
            <Route path="/patientdirectory/maternalinsight" element={<PatientMaternalInsight />} />
            <Route path="/secretarymanagement" element={<SecretaryManagement />} />
            <Route path="/settings" element={<OBGYNSetting />} />
          </Route>
        </Route>

        {/* Protected - Secretary Pages */}
        <Route element={<ProtectedLayout allowedRoles={["secretary"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/secretarydashboard" element={<SecretaryDashboard />} />
            <Route path="/secretarydashboard/appointmentdirectory" element={<SecretaryAppointmentDirectory />} />
          </Route>
        </Route>
      </Routes>

      {/* 👇 Mount Toaster once at root */}
   
    </>
  )
}
