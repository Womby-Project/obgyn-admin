// src/App.tsx
import { Routes, Route } from "react-router-dom"
import PageTitle from "@/components/PageTitle"

import Dashboard from "@/pages/OBGYN/OBGYNDashboardPage"
import AppointmentPage from "@/pages/OBGYN/OBGYNAppointmentPage"
import Inbox from "@/pages/OBGYN/OBGYNInboxPage"
import PatientDirectoryPage from "./pages/OBGYN/OBGYNPatientDirectoryPage"
import PatientProfilePage from "@/components/PatientDirectoryComponent/PatientProfileComponent"
import PatientMaternalInsight from "@/components/PatientDirectoryComponent/DirectoryInsightComponent"
import SecretaryManagement from "./pages/OBGYN/OBGYNManageSecretary"
import OBGYNSetting from "./pages/OBGYN/OBGYNSettings"
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
import SecretaryAppointmentDirectory from "@/pages/SECRETARY/SecretaryAppointmentDirectory"
import SecretarySettings from '@/pages/SECRETARY/SecretarySettingsLayout';
import SecretaryPatientDirectory from '@/pages/SECRETARY/SecretaryPatientDirectory'
import VideoCall from "@/pages/OBGYN/VideoCallpage";
import Articles from "@/pages/Article";
import ArticlePage from "@/pages/ArticlePage";

// 
export default function App() {
  return (
    <Routes>
      {/* test pages */}

      <Route path="/articles" element={<Articles />} />

      <Route path="/article/:id" element={<ArticlePage />} />

      {/* Public */}
      <Route
        path="/"
        element={
          <PageTitle title="Welcome back!">
            <LoginPage />
          </PageTitle>
        }
      />

      <Route path="/video-call/:roomId" element={<VideoCall />} />


      {/* Registration */}
      <Route element={<MultiStepLayout />}>
        <Route
          path="/basicinformation"
          element={
            <PageTitle title="Basic Information - Registration">
              <BasicInformation />
            </PageTitle>
          }
        />
        <Route
          path="/setpassword"
          element={
            <PageTitle title="Set Password - Registration">
              <SetPassword />
            </PageTitle>
          }
        />
        <Route
          path="/professionalinformation"
          element={
            <PageTitle title="Professional Information - Registration">
              <ProfessionalInformation />
            </PageTitle>
          }
        />
        <Route
          path="/setschedule"
          element={
            <PageTitle title="Set Schedule - Registration">
              <SetSchedulePage />
            </PageTitle>
          }
        />
        <Route
          path="/finalpage"
          element={
            <PageTitle title="Finish Registration">
              <CreationPage />
            </PageTitle>
          }
        />
      </Route>

      {/* Protected - OBGYN */}
      <Route element={<ProtectedLayout allowedRoles={["obgyn"]} />}>
        <Route element={<DashboardLayout />}>

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PageTitle title="Dashboard - OBGYN">
                <Dashboard />
              </PageTitle>
            }
          />

          {/* Inbox */}
          <Route
            path="/inbox"
            element={
              <PageTitle title="Inbox - OBGYN">
                <Inbox />
              </PageTitle>
            }
          />

          {/* Inbox Chat (patient-specific) */}
          <Route
            path="/inbox/:patientId"
            element={
              <PageTitle title="Inbox Chat - OBGYN">
                <Inbox />
              </PageTitle>
            }
          />

          {/* Appointments */}
          <Route path="/appointments">
            <Route
              index
              element={
                <PageTitle title="Appointments - OBGYN">
                  <AppointmentPage />
                </PageTitle>
              }
            />
            <Route
              path="patientprofile/:patientId"
              element={
                <PageTitle title="Patient Profile - OBGYN">
                  <PatientProfilePage />
                </PageTitle>
              }
            />
          </Route>

          {/* Patient Directory */}
          <Route path="/patientdirectory">
            <Route
              index
              element={
                <PageTitle title="Patient Directory - OBGYN">
                  <PatientDirectoryPage />
                </PageTitle>
              }
            />
            <Route
              path="maternalinsight/:patientId"
              element={
                <PageTitle title="Maternal Insight - OBGYN">
                  <PatientMaternalInsight />
                </PageTitle>
              }
            />

            <Route
              path="patientprofile/:patientId"
              element={
                <PageTitle title="Patient Profile - OBGYN">
                  <PatientProfilePage />
                </PageTitle>
              }
            />
          </Route>

          {/* Secretary Management */}
          <Route
            path="/secretarymanagement"
            element={
              <PageTitle title="Secretary Management - OBGYN">
                <SecretaryManagement />
              </PageTitle>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <PageTitle title="Settings - OBGYN">
                <OBGYNSetting />
              </PageTitle>
            }
          />
        </Route>
      </Route>



      {/* Protected - Secretary */}
      <Route element={<ProtectedLayout allowedRoles={["secretary"]} />}>
        <Route element={<DashboardLayout />}>

          {/* Dashboard */}
          <Route
            path="/secretarydashboard"
            element={
              <PageTitle title="Secretary Dashboard">
                <SecretaryDashboard />
              </PageTitle>
            }
          />

          {/* Appointment Directory */}
          <Route path="/secretarydashboard/appointmentdirectory">
            <Route
              index
              element={
                <PageTitle title="Appointment Directory - Secretary">
                  <SecretaryAppointmentDirectory />
                </PageTitle>
              }
            />
            <Route
              path="patientprofile/:patientId"
              element={
                <PageTitle title="Patient Profile - Secretary">
                  <PatientProfilePage />
                </PageTitle>
              }
            />
          </Route>

          {/* Patient Directory */}
          <Route path="/secretarydashboard/patientdirectory">
            <Route
              index
              element={
                <PageTitle title="Patient Directory - Secretary">
                  <SecretaryPatientDirectory />
                </PageTitle>
              }
            />
            <Route
              path="patientprofile/:patientId"
              element={
                <PageTitle title="Patient Profile - Secretary">
                  <PatientProfilePage />
                </PageTitle>
              }
            />
          </Route>

          {/* Settings */}
          <Route
            path="/secretarydashboard/settings"
            element={
              <PageTitle title="Settings - Secretary">
                <SecretarySettings />
              </PageTitle>
            }
          />

        </Route>
      </Route>



    </Routes>
  )
}
