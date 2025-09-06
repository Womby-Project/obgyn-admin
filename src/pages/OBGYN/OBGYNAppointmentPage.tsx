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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PopcornIcon } from "lucide-react";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { HoverCard } from "@radix-ui/react-hover-card";
import type { VariantProps } from "class-variance-authority";
import { supabase } from "@/lib/supabaseClient";
import RescheduleDialog from "@/components/modals/rescheduleModal"
import FollowUpDialog from '@/components/modals/followupModal'
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { useNavigate } from "react-router-dom";
import { id } from "date-fns/locale";


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
    pregnancy_weeks: number | null;
    patient_type: string
  } | null;
  appointment_followups: {
    id: string;
    follow_up_datetime: string;
    notes?: string | null;
  }[];
};



type AppointmentUIRow = {
  id: string;
  patientId: string | null;
  patient: string;
  weeksPregnant: number | string;
  date: string;   // formatted for display
  time: string;   // formatted for display
  type: string;
  status: string;
  dateTime: Date; // real Date object for sorting
  patientType: string
};


export default function AppointmentPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortOption, setSortOption] = useState("");
  const navigate = useNavigate();
  const [actionValue, setActionValue] = useState("");
  const [openReschedule, setOpenReschedule] = useState(false);
  const [openFollowUp, setOpenFollowUp] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentUIRow | null>(null);






  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error fetching user:", userError?.message);
        setLoading(false);
        return;
      }

      let obgynId: string | null = null;

      try {
        const { data: secUser } = await supabase
          .from("secretary_users")
          .select("obgyn_id")
          .eq("id", user.id)
          .maybeSingle();

        if (secUser?.obgyn_id) {
          obgynId = secUser.obgyn_id;
        } else {
          const { data: obgynUser } = await supabase
            .from("obgyn_users")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (obgynUser) obgynId = obgynUser.id;
        }

        if (!obgynId) {
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
    appointment_followups ( id, follow_up_datetime )
  `)
          .eq("obgyn_id", obgynId)
          .order("appointment_datetime", { ascending: false });



        if (error) console.error("Error fetching appointments:", error.message);
        else setAppointments(data as unknown as AppointmentRow[]);
      } catch (err) {
        console.error("Unexpected error:", err);
      }

      setLoading(false);
    };


    fetchAppointments();

    const channel = supabase
      .channel("appointments-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointment_followups" },
        (payload) => {
          console.log("🔔 New follow-up:", payload.new);
          fetchAppointments();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointments" },
        (payload) => {
          console.log("🔔 Appointment updated:", payload.new);
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);






  const mappedAppointments = useMemo<AppointmentUIRow[]>(() => {
    return appointments.map((a) => {
      // if follow-ups exist, get the latest one
      let latestDate = new Date(a.appointment_datetime);
      let type = a.appointment_type ?? "-";

      if (a.appointment_followups && a.appointment_followups.length > 0) {
        const sorted = [...a.appointment_followups].sort(
          (f1, f2) => new Date(f2.follow_up_datetime).getTime() - new Date(f1.follow_up_datetime).getTime()
        );
        latestDate = new Date(sorted[0].follow_up_datetime);

        // ✅ override type if follow-up exists
        type = "Follow-up Checkup";
      }

      return {
        id: a.id,
        patientId: a.patient?.id ?? null,
        patient: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : "Unknown Patient",
        patientType: a.patient?.patient_type ?? "-",
        weeksPregnant: a.patient?.pregnancy_weeks ?? "-",
        date: latestDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        time: latestDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        type,                                 // 👈 will show Follow-up Checkup
        status: a.status,                     // 👈 keep original status
        dateTime: latestDate,
      };
    });
  }, [appointments]);


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



  // ✅ Apply filters + search
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
      filtered.sort(
        (a, b) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      );
    } else if (sortOption === "Sort2") {
      filtered.sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      );
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
      <div className="flex flex-col flex-1  transition-all duration-300 bg-gray-50 shadow-md pb-5 ">
        <main className="mt-7 px-4 md:px-6   ">
          <Toaster position="top-right" richColors />
          <div className="bg-white rounded-md shadow-md mx-auto p-6">
            <div className="flex flex-col gap-9 items-start w-full">
              <div className="flex flex-col p-1 w-full">
                <h1 className="text-[24px] font-lato font-semibold">
                  Appointments
                </h1>
                <h2 className="text-[12px] font-lato text-gray-500">
                  View all patients appointments
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
                        <SelectItem value="rescheduled">Reschedule</SelectItem>

                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value === "alltypes" ? "" : value)}>
                      <SelectTrigger className="w-[140px] border border-gray-300">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alltypes">All</SelectItem>
                        <SelectItem value="standard">Standard Consultation</SelectItem>
                        <SelectItem value="extended">Extended Care Consultation</SelectItem>

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
                                    onClick={() => appt.patientId && navigate(`/appointments/patientprofile/${appt.patientId}`)}

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
                                <Badge variant={appt.status.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}>
                                  {capitalize(appt.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-left">
                                <div className="flex gap-2">
                                  {(() => {
                                    const s = appt.status.toLowerCase();
                                    const isAccepted = s === "accepted";
                                    const isRescheduled = s === "rescheduled";
                                    const isDone = s === "done";

                                    const callDisabled = !isAccepted;

                                    return (
                                      <>
                                        {/* Call Button */}
                                        <HoverCard>
                                          <HoverCardTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              disabled={callDisabled}
                                              className={`w-8 h-8 p-0 ${isAccepted
                                                ? "bg-[#65B43B] hover:shadow-md"
                                                : isDone
                                                  ? "bg-gray-400 cursor-default"
                                                  : "bg-gray-300 cursor-not-allowed"
                                                }`}
                                            >
                                              <Icon
                                                icon="material-symbols:call"
                                                className={`w-5 h-5 ${isAccepted || isDone ? "text-white" : "text-gray-700"
                                                  }`}
                                              />
                                            </Button>
                                          </HoverCardTrigger>
                                          <HoverCardContent className="text-xs p-2 w-max bg-white border border-gray-200 shadow-md rounded-md">
                                            {isAccepted ? "Call" : isDone ? "Call (inactive)" : "Call (disabled)"}
                                          </HoverCardContent>
                                        </HoverCard>

                                        {/* ✅ Done Button (only if Accepted or Rescheduled) */}
                                        {(isAccepted || isRescheduled) && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 bg-green-600 border border-green-500 cursor-pointer"
                                            onClick={async () => {
                                              try {
                                                toast.info("Marking as done...");

                                                // Update UI immediately
                                                setAppointments((prev) =>
                                                  prev.map((a) =>
                                                    a.id === appt.id ? { ...a, status: "Done" } : a
                                                  )
                                                );

                                                // Persist to database
                                                const { error } = await supabase
                                                  .from("appointments")
                                                  .update({ status: "Done" })
                                                  .eq("id", appt.id);

                                                if (error) throw error;

                                                // Send notification
                                                const { data: { user } } = await supabase.auth.getUser();
                                                if (appt.patientId && user) {
                                                  await sendNotification({
                                                    recipientId: appt.patientId,
                                                    triggeredBy: user.id,
                                                    type: "appointment_done",
                                                    title: "Appointment Completed",
                                                    message: "Your appointment has been marked as done ✅.",
                                                    relatedAppointmentId: appt.id,
                                                  });
                                                }

                                                toast.success("Appointment marked as Done ✅");
                                              } catch (err) {
                                                console.error(err);
                                                toast.error("Failed to mark as Done ❌");
                                              }
                                            }}
                                          >
                                            <Icon icon="mdi:check-bold" className="w-5 h-5 text-white" />
                                          </Button>
                                        )}

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

                                            setActionValue("");
                                          }}
                                          disabled={appt.status.toLowerCase() === "declined"}
                                        >
                                          <SelectTrigger
                                            className={`w-8 h-8 flex items-center cursor-pointer justify-center rounded-lg border border-[#DBDEE2] 
              [&>svg.lucide-chevron-down]:hidden
              bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                                      </>
                                    );
                                  })()}
                                </div>
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

        <RescheduleDialog
          open={openReschedule}
          onClose={() => {
            setOpenReschedule(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment ?? undefined}
          onConfirm={async (newDate) => {
            try {
              if (!newDate) {
                toast.warning("Check your inputs ⚠️");
                return;
              }

              toast.info("Rescheduling appointment...");

              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === selectedAppointment?.id
                    ? { ...a, appointment_datetime: newDate.toISOString(), status: "Rescheduled" }
                    : a
                )
              );

              await new Promise((r) => setTimeout(r, 1000));

              // ✅ send notification here
              const { data: { user } } = await supabase.auth.getUser();
              if (selectedAppointment?.patientId && user) {
                await sendNotification({
                  recipientId: selectedAppointment.patientId,
                  triggeredBy: user.id,
                  type: "appointment_update",
                  title: "Appointment Rescheduled",
                  message: `Your appointment was rescheduled to ${newDate.toLocaleString()}.`,
                  relatedAppointmentId: selectedAppointment.id,
                });
              }

              toast.success("Appointment successfully rescheduled");
            } catch (err) {
              toast.error("Something went wrong ❌");
              console.error(err);
            }
          }}
        />




        <FollowUpDialog
          open={openFollowUp}
          onClose={() => {
            setOpenFollowUp(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment ?? undefined}
          onConfirm={async (newFollowUp) => {
            try {
              if (!newFollowUp) {
                toast.warning("Check your inputs ⚠️");
                return;
              }

              toast.info("Scheduling follow-up...");

              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === newFollowUp.appointment_id
                    ? {
                      ...a,
                      appointment_type: "Follow-up Checkup",
                      appointment_datetime: newFollowUp.follow_up_datetime,
                    }
                    : a
                )
              );

              await new Promise((r) => setTimeout(r, 1000));

              // ✅ send notification here
              const { data: { user } } = await supabase.auth.getUser();
              if (selectedAppointment?.patientId && user) {
                await sendNotification({
                  recipientId: selectedAppointment.patientId,
                  triggeredBy: user.id,
                  type: "appointment_followup",
                  title: "Follow-up Scheduled",
                  message: `You have a follow-up scheduled on ${new Date(
                    newFollowUp.follow_up_datetime
                  ).toLocaleString()}.`,
                  relatedAppointmentId: selectedAppointment.id,
                  relatedFollowupId: newFollowUp.id,
                });
              }

              toast.success("Follow-up successfully scheduled 🗓️");
            } catch (err) {
              toast.error("Something went wrong ❌");
              console.error(err);
            }
          }}
        />




      </div>
    </div>
  );
}
