"use client";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/* ---------------- Types ---------------- */
type PatientLite = {
  first_name: string;
  last_name: string;
  pregnancy_weeks: number | null;
  postpartum_weeks: number | null;
  patient_type: string;
} | null;

type Appointment = {
  id: string;
  appointment_datetime: string;
  status: string;
  appointment_type: string;
  patient_users: PatientLite;
};

/* ---------------- UI consts ---------------- */
const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
  Confirmed: { bg: "bg-[#E6FCDC]", border: "border-[#BCFFAC]", text: "text-[#166534]" },
  Accepted:  { bg: "bg-[#E6FCDC]", border: "border-[#BCFFAC]", text: "text-[#166534]" },
  Pending:   { bg: "bg-[#FCFBDC]", border: "border-[#F0EEAE]", text: "text-[#92400E]" },
};

const getFormattedDate = () =>
  new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/* ---------------- Manila “today” helpers ---------------- */
const TZ = "Asia/Manila";

function manilaYMD(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { y: +m.year, m: +m.month, d: +m.day };
}

function manilaStartOfDayISO(d = new Date()) {
  const { y, m, d: day } = manilaYMD(d);
  const dt = new Date(Date.UTC(y, m - 1, day, 0, 0, 0));
  return dt.toISOString();
}

function manilaTomorrowStartISO(d = new Date()) {
  const { y, m, d: day } = manilaYMD(d);
  const dt = new Date(Date.UTC(y, m - 1, day + 1, 0, 0, 0));
  return dt.toISOString();
}

/* ---------------- Label formatters (no duplicates) ---------------- */
function cleanTypeLabel(raw?: string) {
  const t = (raw || "").trim();
  if (!t) return "N/A";
  const lc = t.toLowerCase();
  if (lc.includes("post partum") || lc.includes("post-partum") || lc.includes("postpartum")) {
    return "Postpartum";
  }
  if (lc.includes("pregnan")) return "Pregnant";
  return t; // e.g., "Gyne", "N/A", etc.
}

function formatPatientMeta(p: PatientLite, apptType: string) {
  if (!p) return `N/A • ${apptType}`;
  const typeLabel = cleanTypeLabel(p.patient_type);

  // Prefer pregnancy_weeks if present
  if (p.pregnancy_weeks != null) {
    const w = p.pregnancy_weeks;
    // Keep consistent: "Pregnant, 32 weeks • Prenatal Checkup"
    const left = typeLabel === "Pregnant" ? "Pregnant" : typeLabel;
    return `${left}, ${w} week${w !== 1 ? "s" : ""} • ${apptType}`;
  }

  // Else use postpartum_weeks if present
  if (p.postpartum_weeks != null) {
    const w = p.postpartum_weeks;
    // Avoid “postpartum” duplication: "Postpartum, 8 weeks • Postnatal Visit"
    const left = typeLabel === "Postpartum" ? "Postpartum" : typeLabel;
    return `${left}, ${w} week${w !== 1 ? "s" : ""} • ${apptType}`;
  }

  // Neither provided
  return `${typeLabel || "N/A"}, N/A • ${apptType}`;
}

/* ---------------- Component ---------------- */
export default function ScheduleComponent() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Confirm OB-GYN record for this user
      const { data: obgyn, error: obErr } = await supabase
        .from("obgyn_users")
        .select("id")
        .eq("id", user.id)
        .single();
      if (obErr || !obgyn) return;

      // Manila today range
      const gteISO = manilaStartOfDayISO();
      const ltISO  = manilaTomorrowStartISO();

      // INNER join patient to avoid array/null
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_datetime,
          status,
          appointment_type,
          patient_users!inner(
            first_name,
            last_name,
            pregnancy_weeks,
            postpartum_weeks,
            patient_type
          )
        `)
        .eq("obgyn_id", obgyn.id)
        .gte("appointment_datetime", gteISO)
        .lt("appointment_datetime", ltISO)
        .order("appointment_datetime", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        setAppointments([]);
        return;
      }

      // With !inner the embed is an object; normalize defensively
      const normalized = (data || []).map((appt: any) => ({
        ...appt,
        patient_users: Array.isArray(appt.patient_users)
          ? appt.patient_users[0] || null
          : appt.patient_users ?? null,
      })) as Appointment[];

      setAppointments(normalized);
    };

    fetchAppointments();
  }, []);

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
            const style = statusStyles[appt.status] || statusStyles.Pending;

            const time = new Date(appt.appointment_datetime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            const p = appt.patient_users;
            const patientMeta = formatPatientMeta(p, appt.appointment_type);

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
                        {p ? `${p.first_name} ${p.last_name}` : "Unknown"}
                      </CardTitle>
                      <CardDescription className="text-[12px] font-lato text-gray-600">
                        {patientMeta}
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
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-sm">No appointments today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
