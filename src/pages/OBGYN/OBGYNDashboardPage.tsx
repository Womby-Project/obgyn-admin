import GroupsIcon from '@mui/icons-material/Groups';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EmailIcon from '@mui/icons-material/Email';
import MaternalInsight from '@/components/DashboardComponents/MaternalInsightComponents';
import ScheduleCompoment from '@/components/DashboardComponents/TodaysComponent';
import PendingAppointmentsComponent from '@/components/DashboardComponents/PendingAppointmentsComponent';
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from 'react';


export default function Dashboard() {

  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0); // keep 

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ Total Patients (linked to logged-in OBGYN)
      const { count: patientCount } = await supabase
        .from("patient_users")
        .select("*", { count: "exact", head: true })
        .eq("obgyn_id", user.id); // filter by current obgyn

      if (patientCount !== null) {
        setTotalPatients(patientCount);
      }

      // ✅ Upcoming Appointments (linked to logged-in OBGYN)
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, appointment_datetime")
        .eq("obgyn_id", user.id) // filter by current obgyn
        .gte("appointment_datetime", new Date().toISOString())
        .order("appointment_datetime", { ascending: true })
        .limit(5);

      if (appointments) {
        setUpcomingAppointments(appointments.length);
      }

      // ✅ Unread Messages (for this obgyn or secretary in the future)
      setUnreadMessages(0);
    };

    fetchStats();
  }, []);




  return (
    <div className="p-4">
      <div className="flex gap-9 mt-2 items-start">
        {/* Left Column */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Patients */}
            <div className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-semibold text-[15px]">Total Number of Patients</h3>
                <div className="bg-[#7C3AED1A] p-2 rounded-md">
                  <GroupsIcon style={{ color: '#7C3AED', fontSize: 30 }} />
                </div>
              </div>
              <p className="text-gray-800 text-xl font-bold">{totalPatients}</p>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-semibold text-[15px]">Upcoming Appointments</h3>
                <div className="bg-[#06B6D41A] p-2 rounded-md">
                  <EventAvailableIcon style={{ color: '#06B6D4', fontSize: 30 }} />
                </div>
              </div>
              <p className="text-gray-800 text-xl font-bold">{upcomingAppointments}</p>
            </div>

            {/* Unread Messages */}
            <div className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-semibold text-[15px]">
                  Unread <br /> Messages
                </h3>
                <div className="bg-[#DC26261A] p-2 rounded-md">
                  <EmailIcon style={{ color: '#DC2626', fontSize: 30 }} />
                </div>
              </div>
              <p className="text-gray-800 text-xl font-bold">{unreadMessages}</p>
            </div>
          </div>


          <div className="mt-6 ">
            <ScheduleCompoment />
          </div>
        </div>

        {/* Right Column */}
        <div className="w-[368px] flex flex-col gap-6 ">
          <MaternalInsight />
        </div>
      </div>

      <div className="mt-6 ">
        <PendingAppointmentsComponent />
      </div>
    </div>
  );
}
