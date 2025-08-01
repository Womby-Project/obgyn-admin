import Sidebar from '@/components/DashboardComponents/SidebarComponent';
import Header from '@/components/DashboardComponents/HeaderComponent';
import GroupsIcon from '@mui/icons-material/Groups';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EmailIcon from '@mui/icons-material/Email';
import Calendar from '@/components/DashboardComponents/MaternalInsightComponents';
import ScheduleCompoment from '@/components/DashboardComponents/ScheduleComponent';
import PendingAppointmentsComponent from '@/components/DashboardComponents/PendingAppointmentsComponent';

export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1 ml-[260px] bg-gray-50">
        <header className="fixed top-0 left-[260px] right-0 h-6 bg-white shadow-sm z-10">
          <Header />
        </header>

        <main className="fixed top-10 left-[260px] right-0 bottom-0 overflow-hidden bg-gray-50">
          <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">
            <div className="flex gap-9 mt-2 items-start">
              {/* Left Column */}
              <div className="flex-1">
                <div className="flex flex-wrap gap-6">
                  {/* Total Patients */}
                  <div className="w-[250px] bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-500 font-semibold text-[15px]">Total Number of Patients</h3>
                      <div className="bg-[#7C3AED1A] p-2 rounded-md">
                        <GroupsIcon style={{ color: '#7C3AED', fontSize: 30 }} />
                      </div>
                    </div>
                    <p className="text-gray-800 text-xl font-bold">128</p>
                  </div>

                  {/* Upcoming Appointments */}
                  <div className="w-[250px] bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-500 font-semibold text-[15px]">Upcoming Appointments</h3>
                      <div className="bg-[#06B6D41A] p-2 rounded-md">
                        <EventAvailableIcon style={{ color: '#06B6D4', fontSize: 30 }} />
                      </div>
                    </div>
                    <p className="text-gray-800 text-xl font-bold">4</p>
                  </div>

                  {/* Unread Messages */}
                  <div className="w-[250px] bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-500 font-semibold text-[15px]">Unread <br /> Messages</h3>
                      <div className="bg-[#DC26261A] p-2 rounded-md">
                        <EmailIcon style={{ color: '#DC2626', fontSize: 30 }} />
                      </div>
                    </div>
                    <p className="text-gray-800 text-xl font-bold">9</p>
                  </div>
                </div>

                <div className="mt-6">
                  <ScheduleCompoment />
                </div>
              </div>

              {/* Right Column */}
              <div className="w-[368px] flex flex-col gap-6">
                <Calendar />
              </div>
            </div>

            <div className="mt-12">
              <PendingAppointmentsComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
