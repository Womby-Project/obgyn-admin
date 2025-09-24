"use client"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
    Card,
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

type Appointment = {
    id: string
    appointment_datetime: string
    status: string
    appointment_type: string
    patient_users: {
        first_name: string
        last_name: string
        pregnancy_weeks: number | null
        patient_type: string
    } | null
}

const statusStyles = {
    Confirmed: {
        bg: "bg-[#E6FCDC]",
        border: "border-[#BCFFAC]",
        text: "text-[#166534]",
    },
    Pending: {
        bg: "bg-[#FCFBDC]",
        border: "border-[#F0EEAE]",
        text: "text-[#92400E]",
    },
}

const getFormattedDate = () => {
    const today = new Date()
    return today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

export default function ScheduleComponent() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        const fetchAppointments = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: obgyn } = await supabase
                .from("obgyn_users")
                .select("id")
                .eq("id", user.id)
                .single()
            if (!obgyn) return

            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(today.getDate() + 1)

            const { data, error } = await supabase
                .from("appointments")
                .select(`
                    id,
                    appointment_datetime,
                    status,
                    appointment_type,
                    patient_users!appointments_patient_id_fkey(
                        first_name,
                        last_name,
                        pregnancy_weeks,
                        patient_type
                    )
                `)
                .eq("obgyn_id", obgyn.id)
                .gte("appointment_datetime", today.toISOString())
                .lt("appointment_datetime", tomorrow.toISOString())
                .order("appointment_datetime", { ascending: true })

            if (error) {
                console.error("Error fetching appointments:", error)
            } else {
                const normalized = (data || []).map((appt: any) => ({
                    ...appt,
                    patient_users: Array.isArray(appt.patient_users)
                        ? appt.patient_users[0] || null
                        : appt.patient_users,
                }))
                setAppointments(normalized)
            }
        }

        fetchAppointments()
    }, [])

    return (
       <div className="bg-white rounded-xl shadow-sm p-6 w-full h-auto min-h-[370px] overflow-hidden transition-all duration-300 flex flex-col ">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-800">Appointments</h2>
                    <p className="text-gray-400 text-[12px]">{getFormattedDate()}</p>
                </div>
                <button
                    onClick={() => navigate("/appointments")}
                    className="text-sm text-[#E46B64] font-medium hover:underline cursor-pointer"
                >
                    View All
                </button>
            </div>

            {/* Appointment Cards */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {appointments.length > 0 ? (
                    appointments.map((appt) => {
                        const style = statusStyles[appt.status as keyof typeof statusStyles] || statusStyles.Pending
                        const time = new Date(appt.appointment_datetime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })

                        return (
                            <Card
                                key={appt.id}
                                className="p-3 transition cursor-pointer hover:shadow-md hover:bg-[#f9f9f9]"
                                style={{
                                    backgroundColor: "#FBFBFB",
                                    borderColor: "#EEEEEE",
                                    borderWidth: "1px",
                                    borderStyle: "solid",
                                }}
                            >
                                <CardHeader className="flex items-center justify-between">
                                    {/* Left: Patient details */}
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <CardTitle className="text-[17px] font-lato text-gray-800">
                                                {appt.patient_users
                                                    ? `${appt.patient_users.first_name} ${appt.patient_users.last_name}`
                                                    : "Unknown"}
                                            </CardTitle>
                                            <CardDescription className="text-[12px] font-lato text-gray-600">
                                                {(() => {
                                                    const weeks = appt.patient_users?.pregnancy_weeks
                                                    const patientType = appt.patient_users?.patient_type ?? "N/A"

                                                    if (weeks == null) return `${patientType}, N/A • ${appt.appointment_type}`
                                                    return `${patientType}, ${weeks} week${weeks !== 1 ? "s" : ""} • ${appt.appointment_type}`
                                                })()}
                                            </CardDescription>
                                        </div>
                                    </div>

                                    {/* Right: Time and Status */}
                                    <CardAction className="flex flex-col justify-center items-end gap-1">
                                        <p className="text-[18px] font-lato text-gray-800">{time}</p>
                                        <div
                                            className={`rounded-full border px-3 h-[21px] flex justify-center items-center ${style.bg} ${style.border}`}
                                        >
                                            <p className={`text-[12px] font-medium ${style.text}`}>{appt.status}</p>
                                        </div>
                                    </CardAction>
                                </CardHeader>
                            </Card>
                        )
                    })
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500 text-sm">No appointments today.</p>
                    </div>
                )}
            </div>
        </div>
    )

}
