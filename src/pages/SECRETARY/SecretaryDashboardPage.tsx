
import GroupsIcon from '@mui/icons-material/Groups';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EmailIcon from '@mui/icons-material/Email';
import ScheduleTodayComponent from '@/components/SecretaryComponents/SecretaryTodaySchedule'
import PendingAppointmentsComponent from '@/components/SecretaryComponents/SecretaryPendingAppointments'
import BottomComponent from '@/components/SecretaryComponents/BottomAppointment';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';


export default function SecretaryDashboardPage() {
    const [patientTotal, setPatientTotal] = useState<number>(0);
    const [totalAcceptedAppointment, setTotalAcceptedAppointment] = useState<number>(0);
    const [totalPendingAppointment, setTotalPendingAppointment] = useState<number>(0);

    useEffect(() => {
        const fetchStats = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return


            // Secretary record
            const { data: secretary } = await supabase
                .from("secretary_users")
                .select("id, obgyn_id")
                .eq("id", user.id)
                .single()

            if (!secretary) return



            const { count: patientCount } = await supabase
                .from("patient_users")
                .select("*", { count: "exact", head: true })
                .eq("obgyn_id", secretary.obgyn_id)

            setPatientTotal(patientCount ?? 0)


            // ✅ 3. Upcoming (accepted) appointments
            const { count: acceptedAppointments } = await supabase
                .from("appointments")
                .select("*", { count: "exact", head: true })
                .eq("obgyn_id", secretary.obgyn_id)
                .eq("status", "Accepted")
                .gte("appointment_datetime", new Date().toISOString())

            setTotalAcceptedAppointment(acceptedAppointments ?? 0)


            // ✅ 4. Pending appointments
            const { count: pendingAppointments } = await supabase
                .from("appointments")
                .select("*", { count: "exact", head: true })
                .eq("obgyn_id", secretary.obgyn_id)
                .eq("status", "Pending")

            setTotalPendingAppointment(pendingAppointments ?? 0)
        }
        fetchStats()
    }, [])
    return (
        <div className="p-4">
            <div className="flex gap-9 mt-2 items-start">
                {/* Left Column */}
                <div className="flex-1">
                    <div className="grid grid-cols-3 gap-10">
                        {/* Total Patients */}
                        <div className="w-[250px] bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 font-semibold text-[15px]">Total Number of Patients</h3>
                                <div className="bg-[#7C3AED1A] p-2 rounded-md">
                                    <GroupsIcon style={{ color: '#7C3AED', fontSize: 30 }} />
                                </div>
                            </div>
                            <p className="text-gray-800 text-xl font-bold">{patientTotal}</p>
                        </div>

                        {/* Upcoming Appointments */}
                        <div className="w-[250px] bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 font-semibold text-[15px]">Accepted Appointments</h3>
                                <div className="bg-[#06B6D41A] p-2 rounded-md">
                                    <EventAvailableIcon style={{ color: '#06B6D4', fontSize: 30 }} />
                                </div>
                            </div>
                            <p className="text-gray-800 text-xl font-bold">{totalAcceptedAppointment}</p>
                        </div>

                        {/* Unread Messages */}
                        <div className="w-[250px] bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 font-semibold text-[15px]">Pending Appointments</h3>
                                <div className="bg-[#DC26261A] p-2 rounded-md">
                                    <EmailIcon style={{ color: '#DC2626', fontSize: 30 }} />
                                </div>
                            </div>
                            <p className="text-gray-800 text-xl font-bold">{totalPendingAppointment}</p>
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

            <div className="mt-6">
                <BottomComponent />
            </div>
        </div>
    )
}