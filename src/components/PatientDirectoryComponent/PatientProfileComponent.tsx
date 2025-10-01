import { useNavigate, useLocation, useParams } from "react-router-dom";
import Header from "@/components/DashboardComponents/HeaderComponent";
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
} from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import { supabase } from "@/lib/supabaseClient";
import type { VariantProps } from "class-variance-authority";

type Patient = {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    email: string;
    phone_number: string;
    status: string;
    risk_level: "Low" | "Medium" | "High";
    appointment_type?: string;
    emergency_contact_name?: string;
    emergency_contact_relationship?: string;
    emergency_contact_phone?: string;
    allergies?: string[];
    pre_existing_conditions?: string[];
    mental_health_history?: string;
    family_medical_history?: string[];
};

export default function PatientProfileComponent() {
    const navigate = useNavigate();
    const location = useLocation();
    const [userRole, setUserRole] = useState<"obgyn" | "secretary" | null>(null);


    // Get patient ID from query params
    const { patientId } = useParams<{ patientId: string }>();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [riskLevel, setRiskLevel] = useState<"Low" | "Moderate" | "High">("Low");



    const getBackPath = () => {
        if (location.pathname.includes("/secretarydashboard/appointmentdirectory")) {
            return "/secretarydashboard/appointmentdirectory";
        }
        if (location.pathname.includes("/secretarydashboard/patientdirectory")) {
            return "/secretarydashboard/patientdirectory";
        }
        if (location.pathname.includes("/appointments")) {
            return "/appointments";
        }
        if (location.pathname.includes("/patientdirectory")) {
            return "/patientdirectory";
        }
        // fallback (default obgyn appointments)
        return "/appointments";
    };

    const backPath = getBackPath();

    useEffect(() => {
        const fetchPatient = async () => {
            console.log("Fetching patient with ID:", patientId);
            setLoading(true);


            if (!patientId) {
                console.error("❌ No patientId in URL!");
                setLoading(false);
                return;
            }


            console.log("✅ Patient ID from URL:", patientId);


            const { data: { user }, error: userError } = await supabase.auth.getUser();
            console.log("Auth result:", user, userError);

            if (userError || !user) {
                console.error("Auth error:", userError);
                setLoading(false);
                return;
            }

            let obgynId: string | null = null;

            // 🔹 First check if OBGYN
            const { data: obgyn,  } = await supabase
                .from("obgyn_users")
                .select("id")
                .eq("id", user.id)
                .maybeSingle();

            if (obgyn) {
                setUserRole("obgyn");
                obgynId = obgyn.id;
            } else {
                // 🔹 Otherwise check if Secretary
                const { data: secretary,   } = await supabase
                    .from("secretary_users")
                    .select("obgyn_id")
                    .eq("id", user.id)
                    .maybeSingle();

                if (secretary) {
                    setUserRole("secretary");
                    obgynId = secretary.obgyn_id;
                }
            }

            console.log("Resolved role:", userRole, "with obgynId:", obgynId);


            if (!obgynId) {
                console.error("User is not linked to an OBGYN.");
                setLoading(false);
                return;
            }

            const { data: patientData, error } = await supabase
                .from("patient_users")
                .select("*")
                .eq("id", patientId)
                .eq("obgyn_id", obgynId)
                .maybeSingle();

            console.log("Supabase patient lookup:", { patientData, error });

            if (error) {
                console.error("Patient fetch error:", error);
            } else {
                setPatient(patientData as Patient);
                if (patientData?.risk_level) {
                    setRiskLevel(patientData.risk_level as "Low" | "Moderate" | "High");
                }
            }

            setLoading(false);
        };

        if (patientId) {
            fetchPatient();
        } else {
            console.warn("No patientId in URL!");
            setLoading(false);
        }
    }, [patientId]);


    if (loading) {
        return (
            <div className="flex h-screen w-[1150px] items-center justify-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-red-600"></div>
                <p className="text-sm text-gray-500">Loading Details...</p>
            </div>
        );
    }



    if (!patient) {
        return (
            <div className="flex h-screen">
                <div className="flex flex-col flex-1 ml-[260px] bg-gray-50 ">
                    <header className="fixed top-0 left-[260px] right-0 h-10 bg-white shadow-sm z-10" />
                    <main className="fixed top-10 left-[260px] right-0 bottom-0 overflow-hidden mt-2">
                        <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">
                            <p className="text-gray-500">Patient not found.</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <div className="flex flex-col flex-1 ml-[260px] bg-gray-50 ">
                <header className="fixed top-0 left-[260px] right-0 h-10 bg-white shadow-sm z-10">
                    <Header />
                </header>

                <main className="fixed top-10 left-[260px] right-0 bottom-0 overflow-hidden mt-2">
                    <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">
                        {/* Patient Profile Card */}
                        <div className="flex mt-2">
                            <Card className="w-full bg-white rounded-lg shadow-md">
                                <CardHeader className="flex flex-col gap-2">
                                    <div className="flex flex-col p-1 w-full">
                                        <h1 className="text-[22px] font-semibold">
                                            Patient Profile
                                        </h1>
                                        <h2 className="text-[11px] text-gray-500">
                                            <Breadcrumb>
                                                <BreadcrumbList>
                                                    <BreadcrumbItem>
                                                        <BreadcrumbLink
                                                            className="hover:underline cursor-pointer"
                                                            onClick={() => navigate(backPath)}
                                                        >
                                                            {backPath.includes("appointment") ? "Appointments" : "Patient Directory"}
                                                        </BreadcrumbLink>
                                                    </BreadcrumbItem>
                                                    <BreadcrumbSeparator />
                                                    <BreadcrumbPage>Profile Details</BreadcrumbPage>
                                                </BreadcrumbList>
                                            </Breadcrumb>
                                        </h2>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 font-semibold text-[20px] ">
                                            {patient.first_name} {patient.last_name}
                                            <Badge
                                                className="w-[80px]"
                                                variant={patient.status as VariantProps<typeof badgeVariants>["variant"]}
                                            >
                                                {patient.status}
                                            </Badge>

                                        </CardTitle>
                                        <Button
                                            className="text-[#E46B64] hover:bg-gray-100 cursor-pointer text-sm px-4 py-2"
                                            onClick={() => navigate(`/patientdirectory/maternalinsight/${patient.id}`)}
                                        >
                                            View Maternal Insights &gt;
                                        </Button>
                                    </div>

                                    {/* Appointment Type */}
                                    {patient.appointment_type && (
                                        <div className="flex mt-4">
                                            <CheckCircleOutlineIcon className="text-[#E46B64]" fontSize="small" />
                                            <p className="text-[15px] text-[#E46B64] ml-1">{patient.appointment_type}</p>
                                        </div>
                                    )}

                                    {/* Age */}
                                    <div className="flex items-center gap-1">
                                        <PersonOutlineOutlinedIcon className="text-gray-500" fontSize="small" />
                                        <p className="text-[#616161] text-[15px] font-semibold">Age:</p>
                                        <p className="text-[15px] text-[#616161] font-semibold">{patient.age}</p>
                                    </div>

                                    {/* Risk Level */}
                                    {/* Risk Level */}
                                    <div className="flex items-center gap-1">
                                        <ReportGmailerrorredOutlinedIcon className="text-gray-500" fontSize="small" />
                                        <p className="text-[#616161] text-[15px] font-semibold">Risk Level:</p>

                                        {userRole === "obgyn" ? (
                                            <Select
                                                value={riskLevel}
                                                onValueChange={(value) => setRiskLevel(value as "Low" | "Moderate" | "High")}
                                            >
                                                <SelectTrigger className="p-0 border-none bg-transparent [&>svg]:hidden">
                                                    <Badge
                                                        className="flex font-semibold items-center gap-1 text-xs h-[24px] min-w-[90px] px-2 rounded-lg cursor-pointer"
                                                        variant={riskLevel}
                                                    >
                                                        {riskLevel}
                                                        <ChevronDown className="w-3 h-3" />
                                                    </Badge>
                                                </SelectTrigger>
                                                <SelectContent className="border-none">
                                                    <SelectItem value="Low">Low</SelectItem>
                                                    <SelectItem value="Moderate">Moderate</SelectItem>
                                                    <SelectItem value="High">High</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge
                                                className="flex font-semibold items-center gap-1 text-xs h-[24px] min-w-[90px] px-2 rounded-lg"
                                                variant={riskLevel}
                                            >
                                                {riskLevel}
                                            </Badge>
                                        )}
                                    </div>


                                    {/* Contact Details */}
                                    <div className="mt-10">
                                        <h2 className="font-semibold text-[20px]">Contact Details</h2>
                                        <div className="flex items-start gap-80 mt-3">
                                            <div>
                                                <p>Phone Number</p>
                                                <p>{patient.phone_number}</p>
                                            </div>
                                            <div>
                                                <p>Email Address</p>
                                                <p>{patient.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Contacts */}
                                    <div className="mt-10">
                                        <h2 className="text-[14px]">Emergency Contact</h2>
                                        <div className="border rounded-lg border-gray-300 flex items-start gap-10 mt-3 h-20 px-9 pt-2">
                                            <div>
                                                <p>Name</p>
                                                <p className="font-semibold">{patient.emergency_contact_name}</p>
                                            </div>
                                            <div>
                                                <p>Relationship</p>
                                                <p className="font-semibold">{patient.emergency_contact_relationship}</p>
                                            </div>
                                            <div>
                                                <p>Phone Number</p>
                                                <p className="font-semibold">{patient.emergency_contact_phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Medical History */}
                        <Card className="w-full bg-white rounded-lg shadow-md mt-6">
                            <CardHeader>
                                <CardTitle className="text-[20px]">Medical History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Allergies */}
                                <div className="mb-4">
                                    <h3 className="text-[16px] mb-2">Allergies</h3>
                                    {patient.allergies?.length ? (
                                        <div className="flex flex-wrap gap-2">
                                            {patient.allergies.map((item, idx) => (
                                                <Badge key={idx} variant="allergy">{item}</Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-[14px]">No allergies recorded.</p>
                                    )}
                                </div>

                                {/* Pre-existing Conditions */}
                                <div className="mb-4">
                                    <h3 className="text-[16px] mb-2">Pre-existing Conditions</h3>
                                    {patient.pre_existing_conditions?.length ? (
                                        <div className="flex flex-wrap gap-2">
                                            {patient.pre_existing_conditions.map((item, idx) => (
                                                <Badge key={idx} variant="conditions">{item}</Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-[14px]">No pre-existing conditions recorded.</p>
                                    )}
                                </div>

                                {/* Mental Health History */}
                                <div className="mb-4">
                                    <h3 className="text-[16px] mb-2">Mental Health History</h3>
                                    {patient.mental_health_history ? (
                                        <div className="border rounded-lg p-3">
                                            <p>{patient.mental_health_history}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-[14px]">No mental health history recorded.</p>
                                    )}
                                </div>

                                {/* Family Medical History */}
                                <div className="mb-4">
                                    <h3 className="text-[16px] mb-2">Family Medical History</h3>
                                    {patient.family_medical_history?.length ? (
                                        <div className="border rounded-lg p-3">
                                            {patient.family_medical_history.map((item, idx) => (
                                                <p key={idx}>{item}</p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-[14px]">No family medical history recorded.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
