import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

type PatientMini = {
  first_name: string;
  last_name: string;
  pregnancy_weeks: number | null;
  postpartum_weeks: number | null;
} | null;

type Appointment = {
  id: string;
  appointment_datetime: string; // timestamptz
  status: string;               // appointment_status_enum in DB
  appointment_type: string;     // NOT NULL in schema
  patient: PatientMini;         // joined patient
};

export default function PendingAppointmentsPanel() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("appointments")
          .select(`
            id,
            appointment_datetime,
            status,
            appointment_type,
            patient:patient_users (
              first_name,
              last_name,
              pregnancy_weeks,
              postpartum_weeks
            )
          `)
          .eq("status", "Pending")
          .order("appointment_datetime", { ascending: true });

        if (error) {
          console.error("Error fetching pending appointments:", error);
          setAppointments([]);
        } else {
          setAppointments((data ?? []) as unknown as Appointment[]);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const formatPhase = (
    pregnancyWeeks?: number | null,
    postpartumWeeks?: number | null
  ) => {
    if (typeof pregnancyWeeks === "number") {
      const w = Math.max(0, pregnancyWeeks);
      return `Pregnancy • ${w} week${w === 1 ? "" : "s"}`;
    }
    if (typeof postpartumWeeks === "number") {
      const w = Math.max(0, postpartumWeeks);
      return `Postpartum • ${w} week${w === 1 ? "" : "s"}`;
    }
    return "N/A";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 h-[530px] max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-[20px] font-lato font-semibold">Pending Appointments</h2>
        <span
          onClick={() => navigate("/secretarydashboard/appointmentdirectory")}
          className="text-sm text-red-400 cursor-pointer"
        >
          View All
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 mt-4 w-full overflow-y-auto pr-1 rounded-lg max-h-[430px]">
        {loading ? (
          <p className="text-gray-500 text-center text-sm">Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500 text-center text-sm">No pending appointments.</p>
        ) : (
          appointments.map((appt) => (
            <Card
              key={appt.id}
              className="!py-3 bg-[#FFFCF2] border border-[#FACC15]/30"
            >
              <CardHeader className="flex flex-col items-start">
                <CardTitle className="text-[16px] font-semibold text-black">
                  {appt.patient
                    ? `${appt.patient.first_name} ${appt.patient.last_name}`
                    : "Unknown"}
                </CardTitle>

                <CardDescription className="mt-1 text-sm">
                  {new Date(appt.appointment_datetime).toLocaleString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </CardDescription>

                <div className="text-xs text-gray-700 mt-1">
                  {formatPhase(
                    appt.patient?.pregnancy_weeks ?? null,
                    appt.patient?.postpartum_weeks ?? null
                  )}{" "}
                  • {appt.appointment_type}
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
  