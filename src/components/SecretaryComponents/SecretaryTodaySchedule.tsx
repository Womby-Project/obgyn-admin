import { useEffect, useState } from "react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient"; // adjust path
import { useNavigate } from "react-router-dom";


type Appointment = {
  id: string;
  appointment_datetime: string;
  status: string;
  appointment_type: string;
  patient_users: {
    first_name: string;
    last_name: string;
     pregnancy_weeks: number | null;
    patient_type: string;
  } | null;
};

export default function SecretarySchedule() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  // live clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // fetch today's appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_datetime,
          appointment_type,
          status,
          patient_users!appointments_patient_id_fkey(
            first_name,
            last_name,
            pregnancy_weeks,
            patient_type
          )
        `
        )
        .gte("appointment_datetime", startOfDay.toISOString())
        .lte("appointment_datetime", endOfDay.toISOString())
        .order("appointment_datetime", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
      } else {
        setAppointments(data as unknown as Appointment[]);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 h-[370px] max-w-[850px] overflow-hidden ">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Today&apos;s Schedule
          </h2>
          <p className="text-xs text-gray-500">
            {now.toLocaleString("en-US", {
             
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric"
            
            })}
          </p>
        </div>
        <button 
        onClick= {() => navigate("/secretarydashboard/appointmentdirectory")}
        className="text-sm text-[#E46B64] font-medium hover:underline cursor-pointer">
          View All
        </button>
      </div>

      {/* Appointment Cards */}
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-10 text-sm">
            No appointments today.
          </p>
        ) : (
          appointments.map((appt) => {
            const date = new Date(appt.appointment_datetime);
            const time = date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card
                key={appt.id}
                className="p-3 transition cursor-pointer hover:shadow-md hover:bg-[#f4f4f4]"
                style={{
                  backgroundColor: "#FBFBFB",
                  borderColor: "#EEEEEE",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <CardHeader className="flex items-center justify-between">
                  {/* Left: Details */}
                  <div>
                    <CardTitle className="text-[17px] font-lato text-gray-800">
                      {appt.patient_users?.first_name}{" "}
                      {appt.patient_users?.last_name}
                    </CardTitle>
                    <CardDescription className="text-[12px] font-lato text-gray-600">
                      {(() => {
                        const weeks = appt.patient_users?.pregnancy_weeks;
                        const patientType = appt.patient_users?.patient_type ?? "N/A";
                        if (weeks == null)
                          return `${patientType} • ${appt.appointment_type}`;
                        return `${patientType}, ${weeks} week${
                          weeks !== 1 ? "s" : ""
                        } • ${appt.appointment_type}`;
                      })()}
                    </CardDescription>
                  </div>

                  {/* Right: Time */}
                  <CardAction className="flex flex-col justify-center items-end gap-1">
                    <p className="text-[18px] font-lato text-gray-800">{time}</p>
                  </CardAction>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
