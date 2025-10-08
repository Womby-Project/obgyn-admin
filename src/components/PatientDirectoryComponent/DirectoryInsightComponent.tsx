import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import DirectionsWalkOutlinedIcon from "@mui/icons-material/DirectionsWalkOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MoodIcon, SymptomsIcon } from "@/components/DashboardComponents/InsightIcons";
import { Icon } from "@iconify/react";
import InsightsIcon from "@mui/icons-material/Insights";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { VariantProps } from "class-variance-authority";

type MaternalInsight = {
  mostCommonMood: { mood: string; duration: number };
  negativeMoodDays: number;
  mostFrequentSymptoms: { symptom: string; days: number }[];
  severeSymptoms: string;
  activities: string[];
  activityFrequency: number;
  priorityAlerts: { type: string; description: string }[];
  keyInsights: string[];
  recommendations: string[];
};

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  risk_level: string | null;
  patient_type: string | null;
  pregnancy_weeks: number | null;
  maternalInsight: MaternalInsight;
  trimester: string;
  doctors_note?: string | null;
};

// ------------------- Helpers -------------------

function formatWeeks(weeks?: number | null): string {
  if (!weeks || weeks <= 0) return "Unknown weeks";
  return `${weeks} week${weeks === 1 ? "" : "s"}`;
}

function getTrimester(weeks?: number | null): string {
  if (!weeks || weeks <= 0) return "Unknown trimester";
  if (weeks <= 13) return "First trimester";
  if (weeks <= 27) return "Second trimester";
  return "Third trimester";
}

function capitalize(str?: string | null): string {
  if (!str) return "Unknown";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Map risk → badge variant */
const riskToVariant = (
  raw?: string | null
): VariantProps<typeof badgeVariants>["variant"] => {
  const s = (raw ?? "").toString().trim().toLowerCase();
  switch (s) {
    case "low":
      return "success" as any;
    case "medium":
    case "moderate":
      return "warning" as any;
    case "high":
      return "destructive" as any;
    default:
      return "secondary";
  }
};

// ------------------------------------------------

export default function MaternalInsightsComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams<{ patientId: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // Doctor’s Note state
  const [doctorsNote, setDoctorsNote] = useState<string>("");
  const [shareWithPatient, setShareWithPatient] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMsg, setSaveMsg] = useState<string>("");

  // (Optional) show which weekly window we're displaying
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [weekEnd, setWeekEnd] = useState<string | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const patientName = searchParams.get("name");

  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);

      if (!patientId) {
        setLoading(false);
        return;
      }

      // 1) Get patient basic info + doctor’s note
      const { data: patientData, error: patientError } = await supabase
        .from("patient_users")
        .select("id, first_name, last_name, risk_level, patient_type, pregnancy_weeks, doctors_note")
        .eq("id", patientId)
        .single();

      if (patientError || !patientData) {
        console.error("Error fetching patient:", patientError);
        setLoading(false);
        return;
      }

      // 2) Get latest WEEKLY insights (NOTE: switched from ai_insights → ai_weekly_insights)
      const { data: weekly, error: weeklyErr } = await supabase
        .from("ai_weekly_insights")
        .select(
          "week_start, week_end, most_common_mood, negative_mood_days, most_frequent_symptoms, severe_symptoms, activities, activity_frequency, priority_alerts, key_insights, recommendations"
        )
        .eq("patient_id", patientId)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (weeklyErr) {
        console.error("Error fetching weekly insights:", weeklyErr);
      }

      // Safe defaults if there's no weekly insight yet
      const safeAi = weekly ?? {
        week_start: null,
        week_end: null,
        most_common_mood: { mood: "Neutral", duration: 0 },
        negative_mood_days: 0,
        most_frequent_symptoms: [],
        severe_symptoms: "None",
        activities: [],
        activity_frequency: 0,
        priority_alerts: [],
        key_insights: [],
        recommendations: [],
      };

      setWeekStart(safeAi.week_start);
      setWeekEnd(safeAi.week_end);

      const mappedPatient: Patient = {
        id: patientData.id,
        first_name: patientData.first_name ?? "",
        last_name: patientData.last_name ?? "",
        risk_level: patientData.risk_level ?? null, // kept from patient_users (weekly job updates this)
        patient_type: patientData.patient_type ?? null,
        pregnancy_weeks: patientData.pregnancy_weeks ?? null,
        trimester: getTrimester(patientData.pregnancy_weeks),
        doctors_note: patientData.doctors_note ?? "",
        maternalInsight: {
          mostCommonMood: {
            mood: safeAi.most_common_mood?.mood || "Neutral",
            duration: safeAi.most_common_mood?.duration || 0,
          },
          negativeMoodDays: safeAi.negative_mood_days || 0,
          mostFrequentSymptoms: safeAi.most_frequent_symptoms || [],
          severeSymptoms: safeAi.severe_symptoms || "None",
          activities: safeAi.activities || [],
          activityFrequency: safeAi.activity_frequency || 0,
          priorityAlerts: safeAi.priority_alerts || [],
          keyInsights: safeAi.key_insights || [],
          recommendations: safeAi.recommendations || [],
        },
      };

      setPatient(mappedPatient);
      setDoctorsNote(mappedPatient.doctors_note || "");
      setLoading(false);
    };

    fetchPatientData();
  }, [patientId]);

  /** Insert into public.notifications when sharing is checked */
  const notifyPatient = async (pid: string) => {
    const { data: u } = await supabase.auth.getUser();
    const triggered_by = u?.user?.id ?? null;

    const title = "New Doctor’s Note";
    const message = `Your obstetrician added a new note for you:\n\n"${doctorsNote.trim() || "No details provided."}"`;

    const { error } = await supabase.from("notifications").insert({
      recipient_id: pid,
      recipient_role: "Patient",
      triggered_by,
      type: "system",
      title,
      message,
      is_read: false,
    });

    if (error) console.error("Notification insert failed:", error);
  };

  const handleSaveNote = async () => {
    if (!patientId) return;
    setSaving(true);
    setSaveMsg("");

    const { error: updateError } = await supabase
      .from("patient_users")
      .update({
        doctors_note: doctorsNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", patientId);

    if (updateError) {
      console.error(updateError);
      setSaving(false);
      setSaveMsg("Failed to save the note. Please try again.");
      return;
    }

    if (shareWithPatient) {
      await notifyPatient(patientId);
    }

    setSaving(false);
    setSaveMsg(shareWithPatient ? "Note saved and shared with the patient." : "Note saved (not shared).");
  };

  const getAlertColors = (type: string) => {
    if (type === "Mood Alert") {
      return { bg: "#FFF0DD", border: "#FFE5C4", textColor: "text-yellow-600" };
    } else {
      return { bg: "#FEF2F2", border: "#FFE2DD", textColor: "text-red-600" };
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading insights...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-screen flex-col md:flex-row">
        <div className="flex flex-col flex-1 md:ml-[260px] bg-gray-50">
          <header className="fixed top-0 left-0 md:left-[260px] right-0 h-10 bg-white shadow-sm z-10"></header>
          <main className="fixed top-10 left-0 md:left-[260px] right-0 bottom-0 overflow-hidden mt-2">
            <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">
              <p className="text-gray-500">Patient not found.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col md:flex-row w-full">
      <div className="flex flex-col flex-1 md:ml-[260px] bg-gray-50 w-full">
        <header className="fixed top-0 left-0 md:left-[260px] right-0 h-10 bg-white shadow-sm z-10"></header>

        <main className="fixed top-10 left-0 md:left-[260px] right-0 bottom-0 overflow-hidden mt-2">
          <div className="h-full w-full overflow-y-auto scrollbar-hide p-4 md:p-6">
            <Card className="w-full bg-white rounded-lg shadow-md">
              <CardHeader>
                <CardTitle className="text-lg md:text-[22px] font-lato font-semibold">
                  Maternal Insights
                </CardTitle>
                <div className="mt-1">
                  <Breadcrumb>
                    <BreadcrumbList className="text-sm md:text-base flex flex-wrap gap-1">
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          className="hover:underline cursor-pointer"
                          onClick={() => navigate("/patientdirectory")}
                        >
                          Patient Directory
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          className="hover:underline cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/patientdirectory/profile?name=${encodeURIComponent(patientName || "")}`
                            )
                          }
                        >
                          Patient Profile
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbPage>Maternal Insights</BreadcrumbPage>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
                {/* Optional: show which week this insight covers */}
                {weekStart && weekEnd && (
                  <CardDescription className="mt-2 text-sm text-gray-600">
                    Insight window: {new Date(weekStart).toLocaleDateString()} –{" "}
                    {new Date(weekEnd).toLocaleDateString()}
                  </CardDescription>
                )}
              </CardHeader>

              <div className="ml-3 p-3">
                <div className="flex items-center gap-3">
                  <p className="text-[20px] font-semibold ">
                    {patient.first_name} {patient.last_name}
                  </p>

                  <Badge variant={riskToVariant(patient.risk_level)}>
                    {capitalize(patient.risk_level)}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <Icon icon="pajamas:status-closed" className="text-[#616161]" />
                  <p className="font-lato text-[15px] text-[#616161]">
                    {patient.patient_type ?? "Unknown type"},{" "}
                    {formatWeeks(patient.pregnancy_weeks)} ({getTrimester(patient.pregnancy_weeks)})
                  </p>
                </div>
              </div>

              <CardContent>
                {/* Top grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ml-2 w-full mt-[-20px]">
                  {/* Mood card */}
                  <Card className="border border-gray-200 w-full min-h-[260px] bg-gray rounded-lg mt-5 flex flex-col justify-between">
                    <div className="flex justify-between items-center ml-2">
                      <CardTitle className="ml-3 text-[18px] font-lato font-semibold">Mood</CardTitle>

                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="mr-5 cursor-help">
                            <InsertEmoticonIcon
                              fontSize="medium"
                              className="text-[#F4B400] hover:text-[#d8a200] transition-transform duration-200 hover:scale-110"
                            />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="top"
                          align="end"
                          className="text-[12px] font-medium rounded-md shadow-md bg-white border border-gray-200 p-3 w-[240px] text-gray-700 leading-snug"
                        >
                          This section shows the patient’s most frequent mood patterns and highlights
                          negative emotional trends.
                        </HoverCardContent>
                      </HoverCard>
                    </div>

                    <p className="text-[16px] ml-5 mt-[-30px]">Most Common Mood:</p>
                    <div className="ml-5 mt-[-40px] flex items-center gap-2">
                      <Badge variant="moodAnxious" className="rounded-lg text-[14px]">
                        {patient.maternalInsight.mostCommonMood.mood}
                      </Badge>
                      <span className="text-[12px] text-gray-600">
                        {patient.maternalInsight.mostCommonMood.duration} days
                      </span>
                    </div>

                    <p className="text-[16px] ml-5 mt-[-25px]">Days with negative moods:</p>
                    <div className="flex justify-between items-center ml-2 ">
                      <span className="text-[30px] ml-5 font-bold text-[#EF4444] mt-[-35px]">
                        {patient.maternalInsight.negativeMoodDays}
                      </span>
                      <span className="text-[12px] mr-10">out of 7 days</span>
                    </div>

                    <Progress
                      value={(patient.maternalInsight.negativeMoodDays / 7) * 100}
                      className="ml-3 h-2 bg-gray-200 rounded-full mt-[-40px] [&>div]:bg-[#EF4444] w-[90%]"
                    />
                  </Card>

                  {/* Symptoms card */}
                  <Card className="border border-gray-200 w-full min-h-[260px] bg-gray rounded-lg mt-5 flex flex-col justify-between">
                    <div className="flex justify-between items-center ml-2">
                      <CardTitle className="ml-3 text-[18px] font-lato font-semibold">
                        Symptoms
                      </CardTitle>

                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="mr-5 cursor-help">
                            <SearchOutlinedIcon
                              fontSize="medium"
                              className="text-[#3B82F6] hover:text-[#2563EB] transition-transform duration-200 hover:scale-110"
                            />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="top"
                          align="end"
                          className="text-[12px] font-medium rounded-md shadow-md bg-white border border-gray-200 p-3 w-[240px] text-gray-700 leading-snug"
                        >
                          This section highlights the most frequently reported physical symptoms and
                          flags any severe issues.
                        </HoverCardContent>
                      </HoverCard>
                    </div>

                    <p className="text-[16px] ml-5 mt-[-30px]">
                      Most Frequent Symptom
                      {patient.maternalInsight.mostFrequentSymptoms.length > 1 ? "s" : ""}:
                    </p>

                    {patient.maternalInsight.mostFrequentSymptoms.length > 1 ? (
                      <ul className="ml-8 mt-[-45px] list-disc text-[16px] font-lato text-gray-900">
                        {patient.maternalInsight.mostFrequentSymptoms.map((item, index) => (
                          <li key={index}>
                            {item.symptom} <span className="text-gray-600">({item.days} days)</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="ml-5  mt-[-30px] text-[14px] text-gray-900">
                        {patient.maternalInsight.mostFrequentSymptoms[0]?.symptom ?? "None"}{" "}
                        <span className="text-gray-900 ">
                          ({patient.maternalInsight.mostFrequentSymptoms[0]?.days ?? 0} days)
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col  ">
                      <span className="text-[16px] ml-5 ">Severe Symptoms:</span>
                      <span className="gap-2">
                        <ReportProblemOutlinedIcon fontSize="small" className="text-red-800 ml-5" />
                        {patient.maternalInsight.severeSymptoms}
                      </span>
                    </div>
                  </Card>

                  {/* Physical Activities */}
                  <Card className="border border-gray-200 w-full min-h-[260px] bg-gray rounded-lg mt-5 flex flex-col justify-between">
                    <div className="flex justify-between items-center ml-2">
                      <CardTitle className="ml-3 text-[18px] font-lato font-semibold">
                        Physical Activities
                      </CardTitle>

                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="mr-5 cursor-help">
                            <DirectionsWalkOutlinedIcon
                              fontSize="medium"
                              className="text-[#10B981] hover:text-[#059669] transition-transform duration-200 hover:scale-110"
                            />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="top"
                          align="end"
                          className="text-[12px] font-medium rounded-md shadow-md bg-white border border-gray-200 p-3 w-[240px] text-gray-700 leading-snug"
                        >
                          This section reflects the patient’s weekly physical activities and
                          highlights any sedentary trends.
                        </HoverCardContent>
                      </HoverCard>
                    </div>

                    <p className="text-[16px] ml-5 mt-[-30px]">
                      Logged Activit
                      {patient.maternalInsight.activities.length > 1 ? "ies" : "y"}:
                    </p>

                    {patient.maternalInsight.activities.length > 1 ? (
                      <ul className="ml-8 mt-[-40px] list-disc text-[14px] text-gray-900">
                        {patient.maternalInsight.activities.map((activity, index) => (
                          <li key={index}>{activity}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="ml-5 mt-[-10px] text-[14px] text-gray-900">
                        {patient.maternalInsight.activities[0] || "No activities logged"}
                      </div>
                    )}

                    <p className="text-[16px] ml-5 mt-[-30px]">Weekly Frequency:</p>
                    <div className="flex justify-between items-center ml-2 mt-[-30px]">
                      <span className="text-[30px] ml-5 font-bold text-gray-900">
                        {patient.maternalInsight.activityFrequency}
                      </span>
                      <span className="text-[12px] mr-10">days active</span>
                    </div>

                    <Progress
                      value={(patient.maternalInsight.activityFrequency / 7) * 100}
                      className="ml-3 h-2 bg-gray-200 rounded-full  mt-[-40px] [&>div]:bg-[#22C55E] w-[90%]"
                    />
                  </Card>
                </div>

                {/* Alerts + Insights + Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mt-6 px-2 w-full">
                  {/* Priority Alerts */}
                  <Card className="lg:col-span-2 border border-gray-200 w-full bg-gray rounded-lg p-4 h-[400px] flex flex-col gap-4">
                    <div className="flex items-center gap-2 ml-2 mt-3">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="cursor-help">
                            <Icon
                              icon="mdi:chat-alert"
                              className="text-[#C03636] w-6 h-6 hover:text-red-700 transition-transform duration-200 hover:scale-110"
                            />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="top"
                          align="start"
                          className="text-[12px] font-medium rounded-md shadow-md bg-white border border-gray-200 p-3 w-[240px] text-gray-700 leading-snug"
                        >
                          Priority alerts notify you of concerning mood or symptom changes that may
                          require urgent attention.
                        </HoverCardContent>
                      </HoverCard>

                      <CardTitle className="text-[20px] text-[#C03636] font-lato font-semibold">
                        Priority Alerts
                      </CardTitle>
                    </div>

                    <div className="flex flex-col gap-3">
                      {patient.maternalInsight.priorityAlerts?.length > 0 ? (
                        patient.maternalInsight.priorityAlerts.slice(0, 3).map((alert, index) => {
                          const { bg, border } = getAlertColors(alert.type);
                          return (
                            <Card
                              key={index}
                              className="p-3 rounded-lg h-[94px]"
                              style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                            >
                              <CardHeader className="flex items-start gap-3 p-0">
                                <div className="pt-1">
                                  {alert.type === "Mood Alert" ? (
                                    <MoodIcon className="w-6 h-6" />
                                  ) : (
                                    <SymptomsIcon className="w-6 h-6" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-[16px] font-semibold text-black">
                                    {alert.type}
                                  </CardTitle>
                                  <CardDescription className="text-[15px] mt-1 text-gray-700">
                                    {alert.description}
                                  </CardDescription>
                                </div>
                              </CardHeader>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center h-[320px]">
                          <p className="text-sm text-gray-500">No priority alerts found.</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Insights + AI */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <Card className="border border-gray-200 w-full bg-gray rounded-lg flex flex-col p-4">
                      <div className="flex items-center mb-2">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="cursor-help">
                              <InsightsIcon
                                fontSize="medium"
                                className="text-[#E2AF11] hover:text-yellow-600 transition-transform duration-200 hover:scale-110"
                              />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="top"
                            align="start"
                            className="text-[12px] font-medium rounded-md shadow-md bg-white border border-gray-200 p-3 w-[240px] text-gray-700 leading-snug"
                          >
                            These are analytical summaries of the patient's behavioral and physical
                            trends over time.
                          </HoverCardContent>
                        </HoverCard>

                        <CardTitle className="ml-3 text-[20px] text-[#E2AF11] font-lato font-semibold">
                          Key Insights
                        </CardTitle>
                      </div>

                      {patient.maternalInsight.keyInsights?.length > 0 ? (
                        <ul className="space-y-2">
                          {patient.maternalInsight.keyInsights.map((insight, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-2 h-2 bg-black rounded-full mt-[6px] mr-2 flex-shrink-0" />
                              <p className="text-[15px] text-gray-700 leading-snug break-words">
                                {insight}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No insights available</p>
                      )}
                    </Card>

                    <Card className="border border-gray-200 w-full bg-gray rounded-lg flex flex-col p-4">
                      <div className="flex items-center mb-2">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="cursor-help">
                              <Icon
                                icon="ri:chat-ai-fill"
                                className="text-[#4CAF50] w-5 h-5 md:w-6 md:h-6 hover:text-green-600 transition-transform duration-200 hover:scale-110"
                              />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="top"
                            align="start"
                            className="text-[12px] font-medium rounded-md shadow-md bg-white border border-gray-200 p-3 w-[240px] text-gray-700 leading-snug"
                          >
                            Smart suggestions generated by AI based on the patient's trends, symptoms,
                            and activity data.
                          </HoverCardContent>
                        </HoverCard>

                        <CardTitle className="ml-3 text-[20px] text-[#4CAF50] font-lato font-semibold">
                          AI Recommendations
                        </CardTitle>
                      </div>

                      {patient.maternalInsight.recommendations?.length > 0 ? (
                        <ul className="space-y-2">
                          {patient.maternalInsight.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-black rounded-full mt-[7px] mr-2 flex-shrink-0" />
                              <p className="text-[15px] text-gray-700 leading-snug break-words">
                                {rec}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No recommendations available</p>
                      )}
                    </Card>
                  </div>
                </div>

                {/* ---------------- Doctor's Note ---------------- */}
                <div className="grid grid-cols-1 gap-4 mt-6 px-2 w-full">
                  <Card className="border border-gray-200 w-full bg-gray rounded-lg flex flex-col p-4">
                    <div className="flex items-center ">
                      <Icon icon="ph:note-fill" className="w-6 h-6" style={{ color: "#E46B64" }} />
                      <CardTitle className="ml-3 text-[20px] font-lato font-semibold" style={{ color: "#E46B64" }}>
                        Doctor’s Note
                      </CardTitle>
                    </div>

                    <CardDescription className="text-[16px] text-gray-600">
                      Set personalized notes or actionable guidance for the patient based on consultation sessions and AI-generated insights.
                    </CardDescription>

                    <textarea
                      className=" w-full min-h[140px] rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] p-3 text-[14px] text-gray-800"
                      placeholder="Enter your personalized notes about the patient here."
                      value={doctorsNote}
                      onChange={(e) => setDoctorsNote(e.target.value)}
                    />

                    <div className=" flex items-start gap-2">
                      <input
                        id="shareWithPatient"
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-[#3B82F6] cursor-pointer"
                        checked={shareWithPatient}
                        onChange={(e) => setShareWithPatient(e.target.checked)}
                      />
                      <label htmlFor="shareWithPatient" className="text-[14px] text-gray-700">
                        Share insights with the patient. This allows them to be notified of key health updates and suggested actions based on their recent journal data.
                      </label>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={handleSaveNote}
                        disabled={saving}
                        className="inline-flex items-center gap-2 cursor-pointer rounded-md px-4 p text-white transition-colors disabled:opacity-70 h-10 w-27"
                        style={{ backgroundColor: "#E46B64" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E46B64")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E46B64")}
                      >
                        <Icon icon="mynaui:send" className="w-5 h-5" />
                        {saving ? "Saving..." : "Save"}
                      </button>

                      {saveMsg && <span className="text-[13px] text-gray-600">{saveMsg}</span>}
                    </div>
                  </Card>
                </div>
                {/* -------------- End Doctor's Note -------------- */}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
