// components/MaternlInsightPanel.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { SymptomsIcon, MoodIcon } from "./InsightIcons";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** ---------- Types ---------- */
type PatientLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  status?: string | null;
  obgyn_id?: string | null;
};

type WeeklyInsightRow = {
  id: string;
  patient_id: string;
  week_start: string | null;
  week_end: string | null;
  summary: string | null;
  risk_level: "low" | "moderate" | "high" | null;
  // jsonb: expected array of { type: "Mood Alert"|"Symptom Alert", description: string }
  priority_alerts: any | null;
  created_at: string | null;
  updated_at: string | null;
  patient: PatientLite | null;
};

type UIInsight = {
  id: string;
  type: "symptom" | "mood";
  name: string;
  description: string;
  timestamp: Date;
  patientId: string;
};

/** ---------- UI helpers ---------- */
const getColor = (type: "symptom" | "mood") => {
  if (type === "symptom") {
    return { background: "#FEF2F2", border: "rgba(252, 165, 165, 0.5)" }; // light red
  }
  return { background: "#FFF0DD", border: "rgba(253, 186, 116, 0.4)" }; // light orange
};

const getIcon = (type: "symptom" | "mood") => {
  if (type === "symptom") return <SymptomsIcon className="w-7 h-7" />;
  if (type === "mood") return <MoodIcon className="w-7 h-7" />;
  return null;
};

const getTitle = (type: "symptom" | "mood", name: string) =>
  `${type === "symptom" ? "Symptom Alert" : "Mood Alert"} – ${name}`;

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} sec${diff !== 1 ? "s" : ""} ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)
    return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? "s" : ""
      } ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? "s" : ""
    } ago`;
}

function normalizeAlertType(rawType: string | undefined): "symptom" | "mood" {
  const t = (rawType || "").toLowerCase();
  if (t.includes("mood")) return "mood";
  return "symptom";
}

function patientFullName(p?: PatientLite | null) {
  if (!p) return "[no access to patient record]";
  const f = (p.first_name || "").trim();
  const l = (p.last_name || "").trim();
  const full = `${f} ${l}`.trim();
  return full || "[missing name]";
}


const TZ = "Asia/Manila";

function manilaDateISO(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const m = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${m.year}-${m.month}-${m.day}`; // YYYY-MM-DD
}

function manilaMondayISO(d: Date = new Date()) {
  // Get weekday in Manila: Sun..Sat
  const wdStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(d); // "Mon", "Tue", ...
  const map: Record<string, number> = {
    Sun: 6, Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5,
  };
  const delta = map[wdStr] ?? 0; // days to subtract to reach Monday
  const monday = new Date(d.getTime() - delta * 24 * 60 * 60 * 1000);
  return manilaDateISO(monday); // YYYY-MM-DD for Manila Monday
}




/** ---------- Component ---------- */
export default function MaternlInsightPanel() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<UIInsight[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      // 1) Current OB-GYN
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        if (!cancelled) {
          setError("Failed to read current user.");
          setLoading(false);
        }
        return;
      }
      const obgynId = authData.user?.id;
      if (!obgynId) {
        if (!cancelled) {
          setError("You must be signed in as an OB-GYN to view insights.");
          setLoading(false);
        }
        return;
      }

      // 2) Fetch ONLY ai_weekly_insights, INNER join patient_users
      // Force INNER so rows without visible patient are dropped.
      // Then filter by patient.obgyn_id + Active status
      const weeklySelect =
        `id,patient_id,week_start,week_end,summary,risk_level,priority_alerts,created_at,updated_at,` +
        `patient:patient_users!inner(id,first_name,last_name,status,obgyn_id)`;

      const mondayISO = manilaMondayISO();

      const { data: weeklyRows, error: weeklyErr } = await supabase
        .from("ai_weekly_insights")
        .select(weeklySelect)
        .eq("patient.obgyn_id", obgynId)
        .eq("patient.status", "Active")
        .eq("week_start", mondayISO)
        .order("week_start", { ascending: false })
        .limit(100);

      if (weeklyErr) {
        if (!cancelled) {
          setError(weeklyErr.message || "Could not fetch weekly insights.");
          setLoading(false);
        }
        return;
      }

      // 3) Transform weekly rows → UI items (from priority_alerts; add generic only if needed)
      const uiFromWeekly: UIInsight[] =
        (weeklyRows as unknown as WeeklyInsightRow[] | null)?.flatMap((row) => {
          const name = patientFullName(row.patient);
          const ts =
            row.week_end ||
            row.updated_at ||
            row.created_at ||
            new Date().toISOString();

          const pa: any[] = Array.isArray(row.priority_alerts)
            ? row.priority_alerts
            : [];

          const itemsFromPa = pa.map((a, idx): UIInsight => ({
            id: `${row.id}-w-${idx}`,
            type: normalizeAlertType(a?.type),
            name,
            description: a?.description || "Priority change detected",
            timestamp: new Date(ts),
            patientId: row.patient_id,
          }));

          // Optional: If no explicit alerts but high risk, still show one line
          if (!itemsFromPa.length && row.risk_level === "high") {
            return [
              {
                id: `${row.id}-w-high`,
                type: "symptom",
                name,
                description:
                  "High-risk week detected. Review symptoms and follow-up.",
                timestamp: new Date(ts),
                patientId: row.patient_id,
              },
            ];
          }

          return itemsFromPa;
        }) ?? [];

      // Sort by recency
      const merged = [...uiFromWeekly].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      if (!cancelled) {
        setInsights(merged);
        setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex flex-col gap-3 mt-4 w-full h-[430px] overflow-y-hidden pr-1 rounded-lg">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg h-[84px] bg-gray-100 border border-gray-200"
            />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-[430px]">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      );
    }

    if (!insights.length) {
      return (
        <div className="flex items-center justify-center h-[430px]">
          <p className="text-sm text-gray-500">No priority alerts this week.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 mt-4 w-full h-[430px] overflow-y-auto pr-1 rounded-lg">
        {insights.map((item) => {
          const { background, border } = getColor(item.type);
          return (
            <Card
              key={item.id}
              className="!py-3 cursor-pointer"
              style={{
                backgroundColor: background,
                borderColor: border,
                borderWidth: "1px",
                borderStyle: "solid",
              }}
            // Hook this to your patient details route if desired:
            // onClick={() => router.push(`/dashboard/patients/${item.patientId}`)}
            >
              <CardHeader className="flex items-start gap-3">
                {/* Icon */}
                <div className="pt-1">{getIcon(item.type)}</div>

                {/* Text */}
                <div className="flex-1">
                  <CardTitle className="text-[16px] font-semibold text-black">
                    {getTitle(item.type, item.name)}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {item.description}
                  </CardDescription>
                  <div className="text-xs text-gray-500 mt-1">
                    {timeAgo(item.timestamp)}
                  </div>
                </div>

                {/* Arrow icon */}
                <CardAction>
                  <ArrowOutwardIcon fontSize="small" />
                </CardAction>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    );
  }, [loading, error, insights]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 h-[530px]">
      {/* Header */}
      <div className="flex flex-col items-start border-b-1 border-gray-100 pb-2 w-full left-0">
        <h2 className="text-[20px] font-lato font-semibold">Maternal Insights</h2>
        <h3 className="text-[15px] font-lato font-semibold text-gray-400">
          Alerts this week
        </h3>
      </div>

      {/* Content */}
      {content}
    </div>
  );
}
