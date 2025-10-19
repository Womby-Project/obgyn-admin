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
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Icon } from "@iconify/react";
import { supabase } from "@/lib/supabaseClient";
import RescheduleDialog from "../../components/modals/rescheduleModal";
import { Button } from "../../components/ui/button";
import FollowUpDialog from "@/components/modals/followupModal";
import { Toaster } from "../../components/ui/sonner";
import { useNavigate } from "react-router-dom";

/** ---- IMPORTANT: keep this shape in-sync with both modals ---- */
export type AppointmentUIRow = {
  id: string;
  patientId: string | null;
  patient: string;
  /** number for weeks or "-" when unknown */
  weeksPregnant: number | string;
  date: string;
  time: string;
  type: string;
  status: string;
  dateTime: Date;
  patientType: string;
};

const itemsPerPage = 10;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type PatientLite = {
  id: string;
  first_name: string;
  last_name: string;
  patient_type: string | null;
  pregnancy_weeks: number | null;
  postpartum_weeks: number | null;
  birth_date: string | null;
};

type AppointmentRow = {
  id: string;
  status: string;
  appointment_type: string | null;
  appointment_datetime: string;
  patient: PatientLite | null;
  followups: { id: string; follow_up_datetime: string; reason: string | null }[];
};

function weeksBetween(fromISO: string) {
  const from = new Date(fromISO);
  const ms = Date.now() - from.getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
}

function computeWeeksValue(p: PatientLite | null): number | string {
  if (!p) return "-";
  const t = (p.patient_type || "").toLowerCase();

  if (t.includes("postpartum")) {
    let w =
      typeof p.postpartum_weeks === "number" ? p.postpartum_weeks : null;
    if ((w === null || w === undefined) && p.birth_date) {
      const derived = weeksBetween(p.birth_date);
      if (typeof derived === "number") w = derived;
    }
    return typeof w === "number" ? w : "-";
  }

  if (typeof p.pregnancy_weeks === "number") return p.pregnancy_weeks;
  return "-";
}

export default function SecretaryAppointmentDirectory() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [openReschedule, setOpenReschedule] = useState(false);
  const [openFollowUp, setOpenFollowUp] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentUIRow | undefined>(undefined);
  const [actionValue, setActionValue] = useState("");
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const { data: secUser } = await supabase
      .from("secretary_users")
      .select("obgyn_id")
      .eq("id", user.id)
      .single();

    if (!secUser?.obgyn_id) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_datetime,
        status,
        appointment_type,
        patient:patient_users (
          id,
          first_name,
          last_name,
          pregnancy_weeks,
          postpartum_weeks,
          birth_date,
          patient_type
        ),
        followups:appointment_followups (
          id,
          follow_up_datetime,
          reason
        )
      `
      )
      .eq("obgyn_id", secUser.obgyn_id)
      .order("appointment_datetime", { ascending: true });

    if (error) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const normalized = (data ?? []).map((a: any) => {
      const followups = (a.followups ?? [])
        .slice()
        .sort(
          (x: any, y: any) =>
            new Date(y.follow_up_datetime).getTime() -
            new Date(x.follow_up_datetime).getTime()
        );
      return { ...a, followups };
    });

    const statusPriority: Record<string, number> = {
      pending: 0,
      accepted: 1,
      rescheduled: 2,
      "follow-up": 3,
      done: 4,
      declined: 5,
    };

    normalized.sort((a: any, b: any) => {
      const sa = statusPriority[(a.status ?? "").toLowerCase()] ?? 99;
      const sb = statusPriority[(b.status ?? "").toLowerCase()] ?? 99;
      if (sa !== sb) return sa - sb;
      return (
        new Date(a.appointment_datetime).getTime() -
        new Date(b.appointment_datetime).getTime()
      );
    });

    setAppointments(normalized as AppointmentRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel("appointments-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointment_followups" },
        fetchAppointments
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointments" },
        fetchAppointments
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      const { error } = await supabase.from("notifications").insert([
        {
          recipient_id: recipientId,
          recipient_role: "Patient",
          triggered_by: triggeredBy,
          type,
          title,
          message,
          related_appointment_id: relatedAppointmentId,
          related_followup_id: relatedFollowupId,
        },
      ]);
      if (error) return;

      const { data: userData } = await supabase
        .from("patient_users")
        .select("push_token")
        .eq("id", recipientId)
        .single();

      const pushToken = userData?.push_token;
      if (!pushToken) return;

      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: pushToken,
          title,
          body: message,
          sound: "default",
          data: { relatedAppointmentId, relatedFollowupId, type },
        }),
      });
    } catch {}
  };

  const updateAppointmentStatus = async (
    id: string,
    status: string,
    patientId?: string,
    appointmentDateTime?: Date
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (!error && patientId) {
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
        recipientId: patientId,
        triggeredBy: user.id,
        type: "appointment_update",
        title: status === "Done" ? "Appointment Completed" : "Appointment Accepted",
        message:
          status === "Done"
            ? "Your appointment has been marked as done."
            : `Your appointment has been accepted for ${dateStr} at ${timeStr}.`,
        relatedAppointmentId: id,
      });

      await fetchAppointments();
    }
  };

  const mappedAppointments = useMemo<AppointmentUIRow[]>(() => {
    return appointments.map((a) => {
      const latestFollowup = a.followups?.[0];
      const latestDate = latestFollowup
        ? new Date(latestFollowup.follow_up_datetime)
        : new Date(a.appointment_datetime);

      const weeksPregnant = computeWeeksValue(a.patient);

      return {
        id: a.id,
        patientId: a.patient?.id ?? null,
        patient: a.patient
          ? `${a.patient.first_name} ${a.patient.last_name}`
          : "Unknown Patient",
        weeksPregnant,
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

                <div className="flex flex-wrap gap-4 mt-5 w-full justify-between">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                      <SearchIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        fontSize="small"
                      />
                      <Input
                        className="pl-10 border border-gray-300 w-full"
                        placeholder="Search by name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>

                    <Select
                      value={statusFilter}
                      onValueChange={(v) => setStatusFilter(v === "allstatus" ? "" : v)}
                    >
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

                    <Select
                      value={typeFilter}
                      onValueChange={(v) => setTypeFilter(v === "alltypes" ? "" : v)}
                    >
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

              <div className="w-full">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 " />
                    <p className="text-sm text-gray-500">Loading appointments...</p>
                  </div>
                ) : hasAppointments ? (
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[160px]">Patient</TableHead>
                          <TableHead className="min-w-[180px]">Date & Time</TableHead>
                          <TableHead className="min-w-[140px]">Type</TableHead>
                          <TableHead className="min-w-[160px]">
                            Appointment Status
                          </TableHead>
                          <TableHead className="min-w-[100px] text-left">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="font-lato text-[12px]">
                        {paginatedAppointments.map((appt) => (
                          <TableRow key={appt.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <button
                                  onClick={() =>
                                    appt.patientId &&
                                    navigate(
                                      `/secretarydashboard/appointmentdirectory/patientprofile/${appt.patientId}`
                                    )
                                  }
                                  className="cursor-pointer font-lato text-[15px] text-left text-[#1F2937] hover:underline"
                                >
                                  {appt.patient}
                                </button>
                                <span className="text-[12px] text-gray-600">
                                  {appt.patientType},{" "}
                                  {appt.weeksPregnant === "-"
                                    ? "-"
                                    : `${appt.weeksPregnant} weeks`}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-[15px]">{appt.date}</span>
                                <span className="text-[13px] text-muted-foreground">
                                  {appt.time}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{appt.type}</TableCell>
                            <TableCell>
                              <Badge variant={appt.status.toLowerCase() as any}>
                                {capitalize(appt.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-left flex items-center gap-2">
                              <Button
                                className="w-8 h-8 bg-[#22C55E] border border-[#1FB355]"
                                variant="ghost"
                                onClick={() =>
                                  updateAppointmentStatus(
                                    appt.id,
                                    "Accepted",
                                    appt.patientId ?? undefined,
                                    appt.dateTime
                                  )
                                }
                                disabled={appt.status !== "Pending"}
                              >
                                <Icon icon="mingcute:check-fill" className="text-white" />
                              </Button>

                              <Select
                                value={actionValue}
                                onValueChange={async (value) => {
                                  setSelectedAppointment(appt);
                                  if (value === "resched") setOpenReschedule(true);
                                  else if (value === "follow") setOpenFollowUp(true);
                                  else if (value === "done") {
                                    await updateAppointmentStatus(
                                      appt.id,
                                      "Done",
                                      appt.patientId ?? undefined,
                                      appt.dateTime
                                    );
                                  }
                                  setActionValue("");
                                }}
                                disabled={appt.status === "Declined"}
                              >
                                <SelectTrigger
                                  className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[#DBDEE2]
[&>svg.lucide-chevron-down]:hidden bg-white hover:bg-gray-50`}
                                >
                                  <Icon icon="uiw:more" className="w-5 h-5 text-gray-600" />
                                </SelectTrigger>
                                <SelectContent className="w-[230px] border border-gray-200 shadow-md rounded-lg mr-28">
                                  <SelectItem
                                    value="resched"
                                    className="pr-2 [&>span:first-child]:hidden"
                                  >
                                    <div className="flex items-center gap-2 text-[#6B7280]">
                                      <Icon icon="pepicons-pop:rewind-time" className="w-5 h-5" />
                                      <p className="text-[15px]">Reschedule</p>
                                    </div>
                                  </SelectItem>
                                  <SelectItem
                                    value="follow"
                                    className="pr-2 [&>span:first-child]:hidden"
                                  >
                                    <div className="flex items-center gap-2 text-[#6B7280]">
                                      <Icon icon="mdi:calendar" className="w-5 h-5" />
                                      <p className="text-[15px]">Schedule for Follow-up</p>
                                    </div>
                                  </SelectItem>

                                  {["Accepted", "Rescheduled", "Follow-up"].includes(
                                    appt.status
                                  ) && (
                                    <SelectItem
                                      value="done"
                                      className="pr-2 [&>span:first-child]:hidden"
                                    >
                                      <div className="flex items-center gap-2 text-green-700">
                                        <Icon icon="gg:check-o" className="w-5 h-5" />
                                        <p className="text-[15px]">Mark as Done</p>
                                      </div>
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-40 w-full">
                    <Alert className="flex items-center gap-3 px-4 py-3 w-fit border border-gray-300">
                      <Icon icon="tabler:face-id-error" className="w-5 h-5" />
                      <div>
                        <AlertTitle className="text-sm font-medium">
                          No appointments to display
                        </AlertTitle>
                      </div>
                    </Alert>
                  </div>
                )}
              </div>

              {hasAppointments && !loading && (
                <div className="w-full flex flex-col sm:flex-row items-center justify-between text-[#616161] mt-6">
                  <p className="text-[12px] font-semibold text-muted-foreground whitespace-nowrap">
                    Showing{" "}
                    {paginatedAppointments.length +
                      (currentPage - 1) * itemsPerPage}{" "}
                    out of {filteredAppointments.length} appointments
                  </p>
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((p) => Math.max(p - 1, 1))
                          }
                          className={
                            currentPage === 1
                              ? "opacity-50 pointer-events-none"
                              : "text-[#E46B64]"
                          }
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setCurrentPage(i + 1)}
                            isActive={currentPage === i + 1}
                            className={
                              currentPage === i + 1
                                ? "bg-[#E46B64] text-white"
                                : "text-[#E46B64]"
                            }
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((p) => Math.min(p + 1, totalPages))
                          }
                          className={
                            currentPage === totalPages
                              ? "opacity-50 pointer-events-none"
                              : "text-[#E46B64]"
                          }
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

      {/* Reschedule */}
      <RescheduleDialog
        open={openReschedule}
        onClose={() => setOpenReschedule(false)}
        appointment={selectedAppointment}
        onConfirm={async () => {
          await fetchAppointments();
          setOpenReschedule(false);
        }}
      />

      {/* Follow-up */}
      <FollowUpDialog
        open={openFollowUp}
        onClose={() => setOpenFollowUp(false)}
        appointment={selectedAppointment}
        onConfirm={() => {
          fetchAppointments();
        }}
      />

      <Toaster />
    </div>
  );
}
