
import GroupsIcon from '@mui/icons-material/Groups';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EmailIcon from '@mui/icons-material/Email';
import ScheduleTodayComponent from '@/components/SecretaryComponents/SecretaryScheduleComponent'
import AppointmentComponent from '@/components/SecretaryComponents/SecretaryAppointmentsComponent'
import PendingAppointmentsComponent from '@/components/SecretaryComponents/SecretaryPendingAppointments'
export default function SecretaryDashboardPage() {
    return (
        <div className="p-6">
            <div className="flex gap-9 mt-2 items-start">
                {/* Left Column */}
                <div className="flex-1">
                    <div className="grid grid-cols-3 gap-6">
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
                        <ScheduleTodayComponent />
                    </div>
                </div>

                {/* Right Column */}
                <div className="w-[368px] flex flex-col gap-6">
                  <PendingAppointmentsComponent />
                </div>
            </div>

            <div className="mt-12">
                Coming Soon
            </div>
        </div>
    )
}