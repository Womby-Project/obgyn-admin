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


const itemsPerPage = 10;
const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

type AppointmentRow = {
  id: string;
  status: string;
  appointment_type: string | null;
  appointment_datetime: string;
  patient: {
    first_name: string;
    last_name: string;
    weeks_count: number | null;
  } | null;
};


type AppointmentUIRow = {
  id: string;
  patient: string;
  weeksPregnant: number | string;
  date: string;   // formatted for display
  time: string;   // formatted for display
  type: string;
  status: string;
  dateTime: Date; // real Date object for sorting
};


export default function AppointmentPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [mobileColumn, setMobileColumn] = useState("patient");

  const [actionValue, setActionValue] = useState("");
  const [openReschedule, setOpenReschedule] = useState(false);
  const [openFollowUp, setOpenFollowUp] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentUIRow | null>(null);




  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);

      // 1. Get logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error fetching user:", userError?.message);
        setLoading(false);
        return;
      }

      let obgynId: string | null = null;

      try {
        // 1. Check if user is Secretary FIRST (this avoids RLS issues)
        const { data: secUser, error: secError } = await supabase
          .from("secretary_users")
          .select("obgyn_id")
          .eq("id", user.id)
          .maybeSingle();

        if (secUser && secUser.obgyn_id) {
          obgynId = secUser.obgyn_id;  // secretary's assigned OB-GYN
          console.log("User is Secretary, assigned to OB-GYN:", obgynId);
        } else {
          // 2. Only check OB-GYN table if user is NOT a secretary
          const { data: obgynUser, error: obgynError } = await supabase
            .from("obgyn_users")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (obgynUser) {
            obgynId = obgynUser.id;  // user is the OB-GYN
            console.log("User is OB-GYN:", obgynId);
          }
        }

        if (!obgynId) {
          console.warn("User is neither OB-GYN nor Secretary with linked OB-GYN");
          setAppointments([]);
          setLoading(false);
          return;
        }

        // 3. Fetch appointments for the determined obgynId
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
            weeks_count
          ),
          obgyn:obgyn_users (
            id,
            first_name,
            last_name
          )
        `)
          .eq("obgyn_id", obgynId)
          .order("appointment_datetime", { ascending: false });

        if (error) {
          console.error("Error fetching appointments:", error.message);
        } else {
          setAppointments(data as unknown as AppointmentRow[]);
          console.log("Fetched appointments:", data.length);
        }

      } catch (error) {
        console.error("Unexpected error in fetchAppointments:", error);
      }

      setLoading(false);
      console.log("Logged in user:", user.id, "Resolved obgynId:", obgynId);
    };

    fetchAppointments();
  }, []);






  const mappedAppointments = useMemo<AppointmentUIRow[]>(() => {
    return appointments.map((a) => {
      const rawDate = new Date(a.appointment_datetime);

      // formatted for display
      const formattedDate = rawDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      const formattedTime = rawDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        id: a.id,
        patient: a.patient
          ? `${a.patient.first_name} ${a.patient.last_name}`
          : "Unknown Patient",
        weeksPregnant: a.patient?.weeks_count ?? "-",
        date: formattedDate,
        time: formattedTime,
        type: a.appointment_type ?? "-",
        status: a.status,
        dateTime: rawDate, // ✅ use this for sorting
      };
    });
  }, [appointments]);



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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="rescheduled">Declined</SelectItem>
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
                  <div className="flex justify-center items-center h-40">
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
                                  <button className="font-lato text-[15px] text-left text-[#1F2937] hover:underline hover:text-[#1F2937]">
                                    {appt.patient}
                                  </button>
                                  <span className="text-[11px] text-gray-400">{appt.weeksPregnant} weeks pregnant</span>
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
                                    const isDone = s === "done";
                                    const isPending = s === "pending";
                                    const isDeclined = s === "declined";

                                    const callDisabled = !isAccepted;
                                    const moreDisabled = isPending || isDeclined;

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

                                        {/* More Menu */}
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

                                            // reset select after action
                                            setActionValue("");
                                          }}
                                          disabled={appt.status.toLowerCase() === "declined"} // disabled only if Declined
                                        >
                                          <SelectTrigger
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[#DBDEE2] 
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

                    {/* Mobile Table */}
                    <div className="block md:hidden w-full mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-medium">Select Column:</label>
                        <select
                          value={mobileColumn}
                          onChange={(e) => setMobileColumn(e.target.value)}
                          className="border border-gray-300 text-sm px-2 py-1 rounded-md"
                        >
                          <option value="patient">Patient</option>
                          <option value="date">Date & Time</option>
                          <option value="type">Type</option>
                          <option value="status">Status</option>
                          <option value="actions">Actions</option>
                        </select>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{capitalize(mobileColumn)}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedAppointments.map((appt) => (
                            <TableRow key={appt.id}>
                              <TableCell>
                                {mobileColumn === "patient" && (
                                  <>
                                    <p className="font-semibold">{appt.patient}</p>
                                    <p className="text-xs text-gray-400">{appt.weeksPregnant} weeks pregnant</p>
                                  </>
                                )}
                                {mobileColumn === "date" && (
                                  <p>{appt.date}</p>
                                )}
                                {mobileColumn === "type" && <p>{appt.type}</p>}
                                {mobileColumn === "status" && (
                                  <Badge variant={appt.status.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}>
                                    {capitalize(appt.status)}
                                  </Badge>
                                )}
                                {mobileColumn === "actions" && (
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="w-8 h-8 bg-transparent p-0 hover:shadow-md bg-[#65B43B]">
                                      <Icon icon="material-symbols:call" className="text-[#FFFF] w-5 h-5" />
                                    </Button>
                                  </div>
                                )}
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
                      <PopcornIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <AlertTitle className="text-sm font-medium">No appointments to display</AlertTitle>
                        <AlertDescription className="text-sm text-muted-foreground">
                          There are currently no upcoming appointments available.
                        </AlertDescription>
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
          onConfirm={(newDate) => {
            setAppointments((prev) =>
              prev.map((a) =>
                a.id === selectedAppointment?.id
                  ? { ...a, appointment_datetime: newDate.toISOString(), status: "Rescheduled" }
                  : a
              )
            );
          }}
        />




      </div>
    </div>
  );
}
