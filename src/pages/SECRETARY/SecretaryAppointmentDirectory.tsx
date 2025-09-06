import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import SearchIcon from "@mui/icons-material/Search";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Alert, AlertTitle } from "@/components/ui/alert";

import SwapVertIcon from "@mui/icons-material/SwapVert";
import { Badge, } from "@/components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";
import { Icon } from "@iconify/react";
import { supabase } from "@/lib/supabaseClient"; // adjust path
import RescheduleDialog from "../../components/modals/rescheduleModal";
import { Button } from "../../components/ui/button";
import FollowUpDialog from "@/components/modals/followupModal";
import { Toaster } from "../../components/ui/sonner";
import { useNavigate } from "react-router-dom";
import HowToRegIcon from "@mui/icons-material/HowToReg";


const itemsPerPage = 10;
const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

type AppointmentRow = {
    id: string;
    status: string;
    appointment_type: string | null;
    appointment_datetime: string;
    patient: {
        id: string;
        first_name: string;
        last_name: string;
        patient_type: string
        pregnancy_weeks: number | null;
    } | null;
    followups: {
        id: string;
        follow_up_datetime: string;
        reason: string | null;
    }[];   // 👈 include this
};

type AppointmentUIRow = {
    id: string;
    patientId: string | null;
    patient: string;
    weeksPregnant: number | string;
    date: string;
    time: string;
    type: string;
    status: string;
    dateTime: Date;
    patientType: string
};




export default function SecretaryAppointmentDirectory() {
    const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [sortOption, setSortOption] = useState("");
    const navigate = useNavigate();


    const [openReschedule, setOpenReschedule] = useState(false);
    const [openFollowUp, setOpenFollowUp] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentUIRow | null>(null);
    const [actionValue, setActionValue] = useState("");

    const fetchAppointments = async () => {
        setLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error("Error fetching user:", userError?.message);
            setLoading(false);
            return;
        }

        const { data: secUser, error: secError } = await supabase
            .from("secretary_users")
            .select("obgyn_id")
            .eq("id", user.id)
            .single();

        if (secError || !secUser) {
            console.warn("User is not a secretary or no obgyn_id found");
            setAppointments([]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from("appointments")
            .select(`
    id,
    appointment_datetime,
    status,
    appointment_type,
    patient:patient_users (
      id,
      first_name,
      last_name,
      pregnancy_weeks,
      patient_type
    ),
    followups:appointment_followups (
      id,
      follow_up_datetime,
      reason
    )
  `)
            .eq("obgyn_id", secUser.obgyn_id)
            .order("appointment_datetime", { ascending: false })
            .order("follow_up_datetime", { foreignTable: "appointment_followups", ascending: false }) // 👈 order followups
            .limit(1, { foreignTable: "appointment_followups" }); // 👈 only latest follow-up


        if (error) {
            console.error("❌ Error fetching appointments:", error.message);
        } else {
            console.log("✅ Appointments fetched:", data);
            setAppointments(data as unknown as AppointmentRow[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAppointments();

        const channel = supabase
            .channel("appointments-sync")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "appointment_followups" },
                (payload) => {
                    console.log("🔔 New follow-up created:", payload.new);
                    fetchAppointments(); // refresh secretary’s list
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "appointments" },
                (payload) => {
                    console.log("🔔 Appointment updated:", payload.new);
                    fetchAppointments(); // refresh secretary’s list
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    const updateAppointmentStatus = async (
        id: string,
        status: string,
        patientId?: string,
        appointmentDateTime?: Date
    ) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from("appointments")
            .update({ status })
            .eq("id", id);


        if (error) {
            console.error("Error updating appointment status:", error.message);
        } else {
            const dateStr = appointmentDateTime?.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });

            const timeStr = appointmentDateTime?.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            });
            await sendNotification({
                recipientId: patientId!,
                triggeredBy: user.id,
                type: "appointment_update",
                title: "Appointment Accepted",
                message: `Your appointment has been accepted by the secretary for ${dateStr} at ${timeStr}.`,
                relatedAppointmentId: id,
            });

            await fetchAppointments();
        }
    };

    // NOTIFICATION

    const sendNotification = async ({
        recipientId,
        triggeredBy,
        type,
        title,
        message,
        relatedAppointmentId,
        relatedFollowupId,
    }: {
        recipientId: string;
        triggeredBy: string;
        type: string;
        title: string;
        message: string;
        relatedAppointmentId?: string;
        relatedFollowupId?: string;
    }) => {
        try {
            // 1️⃣ Insert in-app notification into Supabase
            const { error } = await supabase.from('notifications').insert([
                {
                    recipient_id: recipientId,
                    recipient_role: 'Patient', // adjust if you want Secretary/OBGYN
                    triggered_by: triggeredBy,
                    type,
                    title,
                    message,
                    related_appointment_id: relatedAppointmentId,
                    related_followup_id: relatedFollowupId,
                },
            ]);

            if (error) {
                console.error('❌ Error inserting notification:', error.message);
                return;
            }

            console.log('✅ In-app notification inserted');

            // 2️⃣ Fetch the recipient's Expo push token
            const { data: userData, error: userError } = await supabase
                .from('patient_users')
                .select('push_token')
                .eq('id', recipientId)
                .single();

            if (userError || !userData?.push_token) {
                console.warn('⚠️ No push token found for user:', recipientId);
                return;
            }

            const pushToken = userData.push_token;

            // 3️⃣ Send push notification via Expo
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: pushToken,
                    title,
                    body: message,
                    sound: 'default',
                    data: { relatedAppointmentId, relatedFollowupId, type },
                }),
            });

            console.log('✅ Push notification sent to device');
        } catch (err) {
            console.error('❌ Error sending notification:', err);
        }
    };



    const mappedAppointments = useMemo<AppointmentUIRow[]>(() => {
        return appointments.map((a) => {
            const latestFollowup = a.followups?.[0];
            const latestDate = latestFollowup
                ? new Date(latestFollowup.follow_up_datetime)
                : new Date(a.appointment_datetime);

            return {
                id: a.id,
                patientId: a.patient?.id ?? null,
                patient: a.patient
                    ? `${a.patient.first_name} ${a.patient.last_name}`
                    : "Unknown Patient",
                weeksPregnant: a.patient?.pregnancy_weeks ?? "-",
                patientType: a.patient?.patient_type ?? "N/A",
                date: latestDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                }),
                time: latestDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                type: a.appointment_type ?? "-",
                status: a.status,
                dateTime: latestDate,
            };
        });
    }, [appointments]);







    // Filters + search
    const filteredAppointments = useMemo(() => {
        let filtered = [...mappedAppointments];
        if (search) {
            filtered = filtered.filter((a) =>
                a.patient.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (statusFilter) {
            filtered = filtered.filter(
                (a) => a.status.toLowerCase() === statusFilter.toLowerCase()
            );
        }
        if (typeFilter) {
            filtered = filtered.filter((a) =>
                a.type.toLowerCase().includes(typeFilter)
            );
        }
        if (sortOption === "Sort1") {
            filtered.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
        } else if (sortOption === "Sort2") {
            filtered.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
        }
        return filtered;
    }, [search, statusFilter, typeFilter, sortOption, mappedAppointments]);

    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
    const paginatedAppointments = filteredAppointments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const hasAppointments = filteredAppointments.length > 0;

    return (
        <div className="flex min-h-screen bg-white">
            <div className="flex flex-col flex-1 transition-all duration-300 bg-gray-50 shadow-md pb-5">
                <main className="mt-7 px-4 md:px-6">
                    <div className="bg-white rounded-md shadow-md mx-auto p-6">
                        <div className="flex flex-col gap-9 items-start w-full">
                            <div className="flex flex-col p-1 w-full">
                                <h1 className="text-[24px] font-lato font-semibold">
                                    Appointments
                                </h1>
                                <h2 className="text-[12px] font-lato text-gray-500">
                                    View all patient appointments
                                </h2>

                                {/* Filters */}
                                <div className="flex flex-wrap gap-4 mt-5 w-full justify-between">
                                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                        <div className="relative w-full sm:w-[300px]">
                                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fontSize="small" />
                                            <Input
                                                className="pl-10 border border-gray-300 w-full"
                                                placeholder="Search by name"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === "allstatus" ? "" : value)}>
                                            <SelectTrigger className="w-[120px] border border-gray-300">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="allstatus">All</SelectItem>
                                                <SelectItem value="accepted">Accepted</SelectItem>
                                                <SelectItem value="done">Done</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>


                                            </SelectContent>
                                        </Select>
                                        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value === "alltypes" ? "" : value)}>
                                            <SelectTrigger className="w-[140px] border border-gray-300">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="alltypes">All</SelectItem>
                                                <SelectItem value="monthly">Monthly Checkup</SelectItem>
                                                <SelectItem value="follow">Follow-up Checkup</SelectItem>
                                                <SelectItem value="consultation">Consultation</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Select value={sortOption} onValueChange={setSortOption}>
                                        <SelectTrigger className="w-full sm:w-[120px] border border-gray-300 px-2 flex justify-between">
                                            <SelectValue placeholder="Sort" />
                                            <SwapVertIcon className="text-gray-500" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sort1">Newest</SelectItem>
                                            <SelectItem value="Sort2">Oldest</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="w-full">
                                {loading ? (
                                    <div className="flex items-center  justify-center gap-2">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 "></div>
                                        <p className="text-sm text-gray-500">Loading appointments...</p>
                                    </div>
                                ) : hasAppointments ? (
                                    <>
                                        {/* Desktop Table */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="min-w-[160px]">Patient</TableHead>
                                                        <TableHead className="min-w-[180px]">Date & Time</TableHead>
                                                        <TableHead className="min-w-[140px]">Type</TableHead>
                                                        <TableHead className="min-w-[160px]">Appointment Status</TableHead>
                                                        <TableHead className="min-w-[100px] text-left">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className="font-lato text-[12px]">
                                                    {paginatedAppointments.map((appt) => (
                                                        <TableRow key={appt.id}>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <button
                                                                        onClick={() => appt.patientId && navigate(`/secretarydashboard/appointmentdirectory/patientprofile/${appt.patientId}`)}

                                                                        className=" cursor-pointer font-lato text-[15px] text-left text-[#1F2937] hover:underline hover:text-[#1F2937]">
                                                                        {appt.patient}
                                                                    </button>
                                                                    <span className="text-[12px] text-gray-600">{appt.patientType}, {appt.weeksPregnant} weeks </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[15px]">{appt.date}</span>
                                                                    <span className="text-[13px] text-muted-foreground">{appt.time}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{appt.type}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={appt.status.toLowerCase() as any}>
                                                                    {capitalize(appt.status)}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-left flex items-center gap-2">
                                                                {/* Accept button */}
                                                                <Button
                                                                    className="w-8 h-8 bg-[#22C55E] border border-[#1FB355] cursor-pointer"
                                                                    variant="ghost"
                                                                    onClick={() =>
                                                                        updateAppointmentStatus(
                                                                            appt.id,          // appointment id
                                                                            "Accepted",
                                                                            appt.patientId!,  // ✅ patient id
                                                                            appt.dateTime     // date object
                                                                        )
                                                                    }
                                                                    disabled={appt.status !== "Pending"}
                                                                >
                                                                    <Icon icon="mingcute:check-fill" className="text-white font-bold" />
                                                                </Button>



                                                                {/* Done button */}
                                                                {["Accepted", "Rescheduled", "Follow-up"].includes(appt.status) && (
                                                                    <Button
                                                                        className="w-8 h-8 bg-green-600 border border-green-500 cursor-pointer"
                                                                        variant="ghost"
                                                                        onClick={() =>
                                                                            updateAppointmentStatus(
                                                                                appt.id,
                                                                                "Done",
                                                                                appt.patientId!,
                                                                                appt.dateTime
                                                                            )
                                                                        }
                                                                    >
                                                                        <HowToRegIcon className="text-white" />
                                                                    </Button>
                                                                )}


                                                                {/* Decline button */}
                                                                {/* <Button
                                                                    className="w-8 h-8 bg-[#E46B64] border border-[#DE5C54]"
                                                                    variant="ghost"
                                                                    onClick={() => updateAppointmentStatus(appt.id, "Declined")}
                                                                    disabled={appt.status !== "Pending"} // only enabled if Pending
                                                                >
                                                                    <Icon icon="mingcute:close-fill" className="text-white font-bold" />
                                                                </Button> */}

                                                                {/* Action menu (resched/follow-up) */}
                                                                <Select

                                                                    value={actionValue}
                                                                    onValueChange={(value) => {
                                                                        setSelectedAppointment(appt);

                                                                        if (value === "resched") {
                                                                            setOpenReschedule(true);
                                                                        } else if (value === "follow") {
                                                                            setOpenFollowUp(true);
                                                                        }

                                                                        setActionValue(""); // reset menu after click
                                                                    }}
                                                                    disabled={appt.status === "Declined"}
                                                                >
                                                                    <SelectTrigger
                                                                        className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[#DBDEE2] 
        [&>svg.lucide-chevron-down]:hidden
        bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                                                                    >
                                                                        <Icon icon="uiw:more" className="w-5 h-5 text-gray-600" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="w-[230px] border border-gray-200 shadow-md rounded-lg mr-28">
                                                                        <SelectItem value="resched" className="pr-2 [&>span:first-child]:hidden">
                                                                            <div className="flex items-center gap-2 text-[#6B7280]">
                                                                                <Icon icon="pepicons-pop:rewind-time" className="w-5 h-5 text-gray-600" />
                                                                                <p className="text-[15px]">Reschedule</p>
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="follow" className="pr-2 [&>span:first-child]:hidden">
                                                                            <div className="flex items-center gap-2 text-[#6B7280] font-lato">
                                                                                <Icon icon="mdi:calendar" className="w-5 h-5 text-gray-600" />
                                                                                <p className="text-[15px]">Schedule for Follow-up</p>
                                                                            </div>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>


                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                    </>
                                ) : (
                                    <div className="flex justify-center items-center h-40 w-full">
                                        <Alert className="flex items-center gap-3 px-4 py-3 w-fit border border-gray-300">
                                            <Icon icon="tabler:face-id-error" className="w-5 h-5 " />
                                            <div>
                                                <AlertTitle className="text-sm font-medium">No appointments to display</AlertTitle>

                                            </div>
                                        </Alert>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {hasAppointments && !loading && (
                                <div className="w-full flex flex-col sm:flex-row items-center justify-between text-[#616161] mt-6">
                                    <p className="text-[12px] font-semibold text-muted-foreground whitespace-nowrap">
                                        Showing {paginatedAppointments.length + (currentPage - 1) * itemsPerPage} out of {filteredAppointments.length} appointments
                                    </p>
                                    <Pagination>
                                        <PaginationContent className="gap-1">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                    className={currentPage === 1 ? "opacity-50 pointer-events-none" : "text-[#E46B64]"}
                                                />
                                            </PaginationItem>
                                            {[...Array(totalPages)].map((_, i) => (
                                                <PaginationItem key={i}>
                                                    <PaginationLink
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        isActive={currentPage === i + 1}
                                                        className={currentPage === i + 1 ? "bg-[#E46B64] text-white" : "text-[#E46B64]"}
                                                    >
                                                        {i + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                    className={currentPage === totalPages ? "opacity-50 pointer-events-none" : "text-[#E46B64]"}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </div>
                    </div>
                </main>


            </div>
            <RescheduleDialog
                open={openReschedule}
                onClose={() => setOpenReschedule(false)}
                appointment={selectedAppointment ?? undefined}
                onConfirm={async (newDateTime) => {
                    if (!selectedAppointment) return;
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const { error } = await supabase
                        .from("appointments")
                        .update({
                            appointment_datetime: newDateTime,
                            status: "Rescheduled",
                        })
                        .eq("id", selectedAppointment.id);

                    if (error) {
                        console.error("Error rescheduling appointment:", error.message);
                    } else {
                        await sendNotification({
                            recipientId: selectedAppointment.patientId!,
                            triggeredBy: user.id,
                            type: "appointment_update",
                            title: "Appointment Rescheduled",
                            message: `Your appointment was rescheduled to ${new Date(newDateTime).toLocaleString()}.`,
                            relatedAppointmentId: selectedAppointment.id,
                        });

                        await fetchAppointments();
                        setOpenReschedule(false);
                    }
                }}

            />

            <FollowUpDialog
                open={openFollowUp}
                onClose={() => setOpenFollowUp(false)}
                appointment={selectedAppointment || undefined}
                onConfirm={() => {

                    fetchAppointments(); // refresh from DB
                }}
            />


            <Toaster />
        </div>
    );
}
