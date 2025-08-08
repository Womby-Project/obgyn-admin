import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/DashboardComponents/SidebarComponent";
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
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { dummyPatients } from "@/lib/dummyDataPatient";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';

export default function PatientProfileComponent() {
    const navigate = useNavigate();
    const location = useLocation();

    // Get patient name from query params
    const searchParams = new URLSearchParams(location.search);
    const patientName = searchParams.get("name");

    // Find patient in dummy data
    const patient = dummyPatients.find(p => p.name === patientName) || null;

    // If patient not found, show fallback
    if (!patient) {
        return (
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex flex-col flex-1 ml-[260px] bg-gray-50 ">
                    <header className="fixed top-0 left-[260px] right-0 h-10 bg-white shadow-sm z-10">
                        <Header />
                    </header>
                    <main className="fixed top-10 left-[260px] right-0 bottom-0 overflow-hidden mt-2">
                        <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">
                            <p className="text-gray-500">Patient not found.</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const [riskLevel, setRiskLevel] = useState<"Low" | "Medium" | "High">(patient.risk);

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex flex-col flex-1 ml-[260px] bg-gray-50 ">
                <header className="fixed top-0 left-[260px] right-0 h-10 bg-white shadow-sm z-10">
                    <Header />
                </header>

                <main className="fixed top-10 left-[260px] right-0 bottom-0 overflow-hidden mt-2">
                    <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">

                        {/* First Card Section (Title + Breadcrumb moved inside) */}
                        <div className="flex mt-2">
                            <Card className="w-full bg-white rounded-lg shadow-md">
                                <CardHeader className="flex flex-col gap-2">
                                    {/* Title and Subtitle inside Card */}
                                    <div className="flex flex-col p-1 w-full">
                                        <h1 className="text-[22px] font-lato font-semibold">
                                            Patient Profile
                                        </h1>
                                        {/* Breadcrumb */}
                                        <h2 className="text-[11px] font-lato text-gray-500">
                                            <Breadcrumb>
                                                <BreadcrumbList>
                                                    <BreadcrumbItem>
                                                        <BreadcrumbLink
                                                            className="hover:underline cursor-pointer"
                                                            onClick={() => navigate("/patientdirectory")}
                                                        >
                                                            Patient Directory
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
                                            {patient.name}
                                            <Badge className="w-[80px]" variant={patient.status}>{patient.status}</Badge>
                                        </CardTitle>
                                        <Button
                                            className="text-[#E46B64] hover:bg-gray-100 cursor-pointer text-sm px-4 py-2"
                                            onClick={() => navigate(`/patientdirectory/maternalinsight?name=${encodeURIComponent(patient.name)}`)}
                                        >
                                            View Maternal Insights &gt;
                                        </Button>

                                    </div>

                                    {/* Appointment Type */}
                                    <div className="flex mt-4">
                                        <CheckCircleOutlineIcon className="text-[#E46B64]" fontSize="small" />
                                        <p className="text-[15px] text-[#E46B64] font-lato  ml-1 mb-1">{patient.appointmentType} </p>
                                    </div>

                                    {/* Age */}
                                    <div className="flex items-center gap-1">
                                        <PersonOutlineOutlinedIcon className="text-gray-500 font-semibold" fontSize="small" />
                                        <p className="text-[#616161] text-[15px] font-semibold">Age:</p>
                                        <p className="text-[15px] text-[#616161] font-semibold">{patient.age}</p>
                                    </div>

                                    {/* Risk Level */}
                                    <div className="flex items-center gap-1">
                                        <ReportGmailerrorredOutlinedIcon className="text-gray-500" fontSize="small" />
                                        <p className="text-[#616161] text-[15px] font-semibold">Risk Level:</p>
                                        <Select
                                            value={riskLevel}
                                            onValueChange={(value) => setRiskLevel(value as "Low" | "Medium" | "High")}
                                        >
                                            <SelectTrigger className="p-0 border-none bg-transparent [&>svg]:hidden">
                                                <Badge
                                                    className="flex font-semibold items-center justify-between gap-1 text-xs h-[24px] min-w-[90px] px-2 py-0.5 rounded-lg text-center cursor-pointer"
                                                    variant={riskLevel}
                                                >
                                                    {riskLevel}
                                                    <ChevronDown className="w-3 h-3" />
                                                </Badge>
                                            </SelectTrigger>
                                            <SelectContent className="border-none">
                                                <SelectItem value="Low">Low</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Contact Details */}
                                    <div className="items-center justify-between mt-10">
                                        <h2 className="font-semibold text-[20px]">Contact Details</h2>

                                        <div className="flex items-start gap-80 mt-3">
                                            <div className="text-[16px] font-lato ">
                                                <p>Phone Number</p>
                                                <p className="text-[24]">{patient.phone}</p>
                                            </div>

                                            <div className="text-[16px] font-lato ">
                                                <p>Email Address</p>
                                                <p className="text-[24]">{patient.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Contacts */}
                                    <div className="justify-between items-center mt-10">
                                        <h2 className="text-[14px]">Emergency Contact</h2>

                                        <div className="border rounded-lg border-gray-300 flex items-start gap-50 mt-3 h-20 px-9 pt-2">
                                            <div className="flex flex-col items-start text-[14px] font-lato">
                                                <p className="font-[14px]">Name</p>
                                                <p className="justify-content items-center text-[16px] font-semibold">{patient.emergencyContact.name}</p>
                                            </div>

                                            <div className="flex flex-col items-start text-[14px] font-lato">
                                                <p className="font-[14px]">Relationship</p>
                                                <p className="justify-content items-center text-[16px] font-semibold">{patient.emergencyContact.relationship}</p>
                                            </div>

                                            <div className="flex flex-col items-start text-[14px] font-lato">
                                                <p className="font-[14px]">Phone Number</p>
                                                <p className="justify-content items-center text-[16px] font-semibold">{patient.emergencyContact.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Medical History */}
                        <Card className="w-full bg-white rounded-lg shadow-md mt-6">
                            <CardHeader>
                                <CardTitle className="text-[20px] ">Medical History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Allergies */}
                                <div className="mb-4">
                                    <h3 className="font text-[16px] mb-2">Allergies</h3>
                                    {patient.medicalHistory.allergies && patient.medicalHistory.allergies.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {patient.medicalHistory.allergies.map((item, index) => (
                                                <Badge className="w-[91px] h-[28px] text-[#222227] text-[16px]" key={index} variant="allergy">
                                                    {item}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-[14px]">No allergies recorded.</p>
                                    )}
                                </div>

                                {/* Pre-existing Conditions */}
                                <div className="mb-4">
                                    <h3 className="font text-[16px] mb-2">Pre-existing Conditions</h3>
                                    {patient.medicalHistory.preExistingConditions && patient.medicalHistory.preExistingConditions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {patient.medicalHistory.preExistingConditions.map((item, index) => (
                                                <Badge className="text-[#222227] text-[15px]" key={index} variant="conditions">
                                                    {item}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-[14px]">No pre-existing conditions recorded.</p>
                                    )}
                                </div>

                                {/* Mental Health History */}
                                <div className="mb-4">
                                    <h3 className=" text-[16px] mb-2">Mental Health History</h3>
                                    {patient.medicalHistory.mentalHealthHistory ? (
                                        <div className="w-full border border-gray-300 rounded-lg p-3 bg-white">
                                            <p className="text-[#222227] text-[16px]">{patient.medicalHistory.mentalHealthHistory}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-[14px]">No mental health history recorded.</p>
                                    )}
                                </div>

                                {/* Family Medical History */}
                                <div className="mb-4">
                                    <h3 className=" text-[16px] mb-2">Family Medical History</h3>
                                    {patient.medicalHistory.familyMedicalHistory && patient.medicalHistory.familyMedicalHistory.length > 0 ? (
                                        <div className="w-full border border-gray-300 rounded-lg p-3 bg-white">
                                            <div className="space-y-1">
                                                {patient.medicalHistory.familyMedicalHistory.map((item, index) => (
                                                    <p key={index} className="text-[#222227] text-[16px]">
                                                        {item}
                                                    </p>
                                                ))}
                                            </div>
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
