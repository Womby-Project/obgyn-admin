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
    CardDescription
} from "@/components/ui/card";
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import DirectionsWalkOutlinedIcon from '@mui/icons-material/DirectionsWalkOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MoodIcon, SymptomsIcon } from "@/components/DashboardComponents/InsightIcons";
import { Icon } from "@iconify/react";
import InsightsIcon from '@mui/icons-material/Insights';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
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
    last_name: string
    risk_level: string;
    patient_type: string;
    pregnancy_weeks: number;
    maternalInsight: MaternalInsight;
    trimester: string
};

// HELPERS MGA KOSA

// helpers (outside the component or at least outside useEffect)
function formatWeeks(weeks?: number): string {
  if (!weeks || weeks <= 0) return "Unknown weeks";
  return `${weeks} week${weeks === 1 ? "" : "s"}`;
}

function getTrimester(weeks?: number): string {
  if (!weeks || weeks <= 0) return "Unknown trimester";
  if (weeks <= 13) return "First trimester";
  if (weeks <= 27) return "Second trimester";
  return "Third trimester";
}

export default function MaternalInsightsComponent() {
    const navigate = useNavigate();
    const location = useLocation();
    const { patientId } = useParams<{ patientId: string }>();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);

    const searchParams = new URLSearchParams(location.search);
    const patientName = searchParams.get("name");


    

    useEffect(() => {
        const fetchPatientData = async () => {
            setLoading(true);

            if (!patientId) {
                setLoading(false);
                return;
            }

            // Get patient basic info
            const { data: patientData, error: patientError } = await supabase
                .from("patient_users")
                .select("id, first_name,last_name, risk_level, patient_type, pregnancy_weeks")
                .eq("id", patientId)
                .single();

            if (patientError || !patientData) {
                console.error("Error fetching patient:", patientError);
                setLoading(false);
                return;
            }

            // Get latest AI insights
            const { data: aiData, error: aiError } = await supabase
                .from("ai_insights")
                .select("*")
                .eq("patient_id", patientId)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (aiError || !aiData) {
                console.error("Error fetching AI insights:", aiError);
                setLoading(false);
                return;
            }



            const mappedPatient: Patient = {
                id: patientData.id,
                first_name: patientData.first_name,
                last_name: patientData.last_name,
                risk_level: patientData.risk_level,
                patient_type: patientData.patient_type,
                pregnancy_weeks: patientData.pregnancy_weeks,
                trimester: getTrimester(patientData.pregnancy_weeks),
                maternalInsight: {
                    mostCommonMood: {
                        mood: aiData.most_common_mood?.mood || "Neutral",
                        duration: aiData.most_common_mood?.duration || 0,
                    },
                    negativeMoodDays: aiData.negative_mood_days || 0,
                    mostFrequentSymptoms: aiData.most_frequent_symptoms || [],
                    severeSymptoms: aiData.severe_symptoms || "None",
                    activities: aiData.activities || [],
                    activityFrequency: aiData.activity_frequency || 0,
                    priorityAlerts: aiData.priority_alerts || [],
                    keyInsights: aiData.key_insights || [],
                    recommendations: aiData.recommendations || [],
                }
            };

            setPatient(mappedPatient);
            setLoading(false);
        };

        fetchPatientData();
    }, [patientId]);

    const getAlertColors = (type: string) => {
        if (type === "Mood Alert") {
            return { bg: "#FFF0DD", border: "#FFE5C4", textColor: "text-yellow-600" };
        } else {
            return { bg: "#FEF2F2", border: "#FFE2DD", textColor: "text-red-600" };
        }
    };

    function capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const normalizeStatusVariant = (status: string) =>
        (status.charAt(0).toUpperCase() + status.slice(1)) as VariantProps<typeof badgeVariants>["variant"];

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
                    <header className="fixed top-0 left-0 md:left-[260px] right-0 h-10 bg-white shadow-sm z-10">
                    </header>
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
                <header className="fixed top-0 left-0 md:left-[260px] right-0 h-10 bg-white shadow-sm z-10">

                </header>

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
                                                    onClick={() => navigate(`/patientdirectory/profile?name=${encodeURIComponent(patientName || "")}`)}
                                                >
                                                    Patient Profile
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator />
                                            <BreadcrumbPage>Maternal Insights</BreadcrumbPage>
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                </div>
                            </CardHeader>

                            <div className="ml-3 p-3">
                                <div className="flex items-center  gap-3
                                ">

                                    <p className="text-[20px] font-semibold ">{patient.first_name}{patient.last_name}</p>
                                    <Badge
                                        className=""
                                        variant={normalizeStatusVariant(patient.risk_level)}>
                                        {capitalize(patient.risk_level)}
                                    </Badge>

                                </div>

                                <div className="flex items-center gap-1">
                                    <Icon icon="pajamas:status-closed" className="text-[#616161]" />
                                    <p className="font-lato text-[15px] text-[#616161]">
                                        {patient.patient_type}, {formatWeeks(patient.pregnancy_weeks)} ({getTrimester(patient.pregnancy_weeks)})
                                    </p>

                                </div>



                            </div>

                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ml-2 w-full mt-[-20px]">
                                    {/* Mood card */}
                                    <Card className="border border-gray-200 w-full min-h-[260px] bg-gray rounded-lg mt-5 flex flex-col justify-between">
                                        <div className="flex justify-between items-center ml-2">
                                            <CardTitle className="ml-3 text-[18px] font-lato font-semibold">
                                                Mood
                                            </CardTitle>

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
                                                    This section shows the patient’s most frequent mood patterns and highlights negative emotional trends.
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
                                                    This section highlights the most frequently reported physical symptoms and flags any severe issues.
                                                </HoverCardContent>
                                            </HoverCard>
                                        </div>


                                        <p className="text-[16px] ml-5 mt-[-30px]">
                                            Most Frequent Symptom{patient.maternalInsight.mostFrequentSymptoms.length > 1 ? "s" : ""}:
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
                                                {patient.maternalInsight.mostFrequentSymptoms[0]?.symptom}{" "}
                                                <span className="text-gray-900 ">
                                                    ({patient.maternalInsight.mostFrequentSymptoms[0]?.days} days)
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
                                                    This section reflects the patient’s weekly physical activities and highlights any sedentary trends.
                                                </HoverCardContent>
                                            </HoverCard>
                                        </div>


                                        <p className="text-[16px] ml-5 mt-[-30px]">
                                            Logged Activit{patient.maternalInsight.activities.length > 1 ? "ies" : "y"}:
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
                                                    Priority alerts notify you of concerning mood or symptom changes that may require urgent attention.
                                                </HoverCardContent>
                                            </HoverCard>

                                            <CardTitle className="text-[20px] text-[#C03636] font-lato font-semibold">
                                                Priority Alerts
                                            </CardTitle>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {patient.maternalInsight.priorityAlerts.slice(0, 3).map((alert, index) => {
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
                                            })}
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
                                                        These are analytical summaries of the patient's behavioral and physical trends over time.
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
                                                        Smart suggestions generated by AI based on the patient's trends, symptoms, and activity data.
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
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
