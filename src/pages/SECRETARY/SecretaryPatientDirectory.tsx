import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import SearchIcon from "@mui/icons-material/Search";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  risk_level: string | null;
  patient_type: string | null;
  pregnancy_weeks: number | null;
  trimester: string | null;
  appointments?: { appointment_datetime: string }[];
  patient_referrals?: {
    referring_doctor_name: string;
    referring_doctor_specialty: string;
  }[];
};

const itemsPerPage = 10;

export default function SecretaryPatientDirectory() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);



  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const navigate = useNavigate();
  const [refDoctorName, setRefDoctorName] = useState("");
  const [refSpecialty, setRefSpecialty] = useState("");
  const [refReason, setRefReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 🔹 filters & search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState(""); // Active / Inactive
  const [trimesterFilter, setTrimesterFilter] = useState(""); // 1st / 2nd / 3rd


  const handleSaveReferral = async () => {
    if (!selectedPatient) return;

    const { data, error } = await supabase
      .from("patient_referrals")
      .insert([
        {
          patient_id: selectedPatient.id,
          referring_doctor_name: refDoctorName,
          referring_doctor_specialty: refSpecialty,
          reason: refReason,
        },
      ])
      .select();

    if (error) {
      console.error("Error saving referral:", error);
      toast.error("Failed to save referral ❌");
    } else {
      toast.success("Referral saved successfully ✅");

      // Reset form
      setRefDoctorName("");
      setRefSpecialty("");
      setRefReason("");

      // Update local state
      setPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatient.id
            ? {
              ...p,
              patient_referrals: [
                ...(p.patient_referrals ?? []),
                {
                  referring_doctor_name: data[0].referring_doctor_name,
                  referring_doctor_specialty:
                    data[0].referring_doctor_specialty,
                },
              ],
            }
            : p
        )
      );
      setIsReferralDialogOpen(false);
    }
  };

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);

      // 🔹 Get logged-in secretary
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching logged-in user:", userError);
        setLoading(false);
        return;
      }

      // 🔹 Get secretary details (to find their OBGYN)
      const { data: secretaryData, error: secretaryError } = await supabase
        .from("secretary_users")
        .select("obgyn_id")
        .eq("id", user.id)
        .single();

      if (secretaryError || !secretaryData) {
        console.error("Error fetching secretary details:", secretaryError);
        setLoading(false);
        return;
      }

      const obgynId = secretaryData.obgyn_id;

      // 🔹 Fetch patients under this OBGYN
      const { data, error } = await supabase
        .from("patient_users")
        .select(
          `
          id,
          first_name,
          last_name,
          status,
          risk_level,
          patient_type,

          pregnancy_weeks,
          pregnancy_weeks,
          appointments(appointment_datetime),
          patient_referrals(referring_doctor_name, referring_doctor_specialty)
        `
        )
        .eq("obgyn_id", obgynId);

      if (error) {
        console.error("Error fetching patients:", error);
      } else {
        setPatients(data as Patient[]);
      }
      setLoading(false);
    };

    fetchPatients();
  }, []);


  const getTrimester = (weeks: number | null): string | null => {
    if (!weeks || weeks <= 0) return null;
    if (weeks <= 12) return "1st Trimester";
    if (weeks <= 27) return "2nd Trimester";
    return "3rd Trimester";
  };


  // 🔹 Filtering logic
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(search.toLowerCase());

      const trimester = getTrimester(p.pregnancy_weeks);

      const matchesActivity =
        activityFilter === "all" ||
        !activityFilter ||
        p.status.toLowerCase() === activityFilter.toLowerCase();

      const matchesTrimester =
        trimesterFilter === "all" ||
        !trimesterFilter ||
        (trimester && trimester === trimesterFilter);

      const matchesRisk =
        riskFilter === "all" ||
        !riskFilter ||
        (p.risk_level && p.risk_level.toLowerCase() === riskFilter.toLowerCase());

      return (
        matchesSearch &&
        matchesActivity &&
        matchesTrimester &&
        matchesRisk
      );
    });
  }, [patients, search, activityFilter, trimesterFilter, riskFilter]);

  const totalPatientDirectoryPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatientDirectory = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasPatients = filteredPatients.length > 0;


  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-col flex-1 transition-all duration-300 bg-gray-50 shadow-md pb-5">
        <main className="mt-7 px-4 md:px-6">
          <Toaster position="top-right" richColors />
          <div className="bg-white rounded-md shadow-md mx-auto p-6">
            <div className="flex flex-col gap-9 items-start w-full">
              <div className="flex flex-col p-1 w-full">
                <h1 className="text-[24px] font-lato font-semibold">
                  Patient Directory
                </h1>
                <h2 className="text-[12px] font-lato text-gray-500">
                  View all patients under your assigned OB-GYN
                </h2>

                {/* 🔹 Filters */}
                <div className="flex flex-wrap gap-4 mt-5 w-full justify-between">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                      <SearchIcon
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        fontSize="small"
                      />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 border border-gray-300 w-full text-[#6B7280] border border-[#ECEEF0] bg-[#FFFFFF] hover:shadow-sm"
                        placeholder="Search..."
                      />
                    </div>


                    {/* Activity filter */}
                    <Select value={activityFilter} onValueChange={setActivityFilter}>
                      <SelectTrigger className="w-[140px] text-[#6B7280] border border-[#ECEEF0] bg-[#FFFFFF] cursor-pointer hover:shadow-sm">
                        <SelectValue placeholder="Activity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>


                    {/* Status filter */}
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[140px] text-[#6B7280] border border-[#ECEEF0] bg-[#FFFFFF] cursor-pointer hover:shadow-sm">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pregnant">Pregnant</SelectItem>
                        <SelectItem value="postpartum">Postpartum</SelectItem>
                      </SelectContent>
                    </Select>


                    {/* Trimester filter */}
                    <Select value={trimesterFilter} onValueChange={setTrimesterFilter}>
                      <SelectTrigger className="w-[140px] text-[#6B7280] border border-[#ECEEF0] bg-[#FFFFFF] cursor-pointer hover:shadow-sm">
                        <SelectValue placeholder="Trimester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="1st Trimester">1st Trimester</SelectItem>
                        <SelectItem value="2nd Trimester">2nd Trimester</SelectItem>
                        <SelectItem value="3rd Trimester">3rd Trimester</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Risk filter */}
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger className="w-[140px] text-[#6B7280] border border-[#ECEEF0] bg-[#FFFFFF] cursor-pointer hover:shadow-sm">
                        <SelectValue placeholder="Risk Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sorting dropdown */}
                  <Select>
                    <SelectTrigger className="w-full sm:w-[120px] text-[#6B7280] border border-[#ECEEF0] bg-[#FFFFFF] px-2 flex justify-between cursor-pointer hover:shadow-sm [&>svg]:hidden">
                      <SelectValue placeholder="Sort" />
                      <SwapVertIcon className="text-[#6B7280]" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 🔹 Patient Table */}
              <div className="w-full">
                {loading ? (
                  <div className="flex items-center  justify-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 "></div>
                    <p className="text-sm text-gray-500">Loading appointments...</p>
                  </div>
                ) : hasPatients ? (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[160px]">Patient</TableHead>
                            <TableHead className="min-w-[180px]">Maternal Health Status</TableHead>
                            <TableHead className="min-w-[140px]">Risk Level</TableHead>
                            <TableHead className="min-w-[160px]">Referrals</TableHead>
                            <TableHead className="min-w-[100px] text-left">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPatientDirectory.length === 0 ? (

                            <TableRow>
                              <TableCell colSpan={5} className="text-center">
                                No patients found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedPatientDirectory.map((patient) => {

                              const trimester = getTrimester(patient.pregnancy_weeks);


                              // 🔹 Last visit = latest appointment
                              const lastVisit = patient.appointments?.length
                                ? format(
                                  new Date(
                                    patient.appointments.sort(
                                      (a, b) =>
                                        new Date(b.appointment_datetime).getTime() -
                                        new Date(a.appointment_datetime).getTime()
                                    )[0].appointment_datetime
                                  ),
                                  "MMM dd, yyyy"
                                )
                                : "No visits yet";


                              return (
                                <TableRow key={patient.id}>
                                  {/* 🔹 Patient Name Column */}
                                  <TableCell>
                                    <button
                                      onClick={() => navigate(`/secretarydashboard/patientdirectory/patientprofile/${patient.id}`)}

                                      className="font-lato cursor-pointer hover:underline">
                                      {patient.first_name} {patient.last_name}
                                    </button>
                                    <div className="text-[13px] text-[#616161]">Last visit: {lastVisit}</div>
                                    <div className="mt-1">
                                      <Badge variant={patient.status === "Active" ? "Active" : "Inactive"}>
                                        {patient.status}
                                      </Badge>
                                    </div>
                                  </TableCell>

                                  {/* 🔹 Maternal Health Status Column */}
                                  <TableCell>
                                    {patient.patient_type?.toLowerCase() === "pregnant" ? (
                                      <div className="flex flex-col">
                                        <div>Pregnant</div>
                                        {patient.pregnancy_weeks && (
                                          <div>
                                            {patient.pregnancy_weeks} weeks ∙ {trimester}
                                          </div>
                                        )}
                                      </div>
                                    ) : patient.patient_type?.toLowerCase() === "postpartum" ? (
                                      <div className="flex flex-col">
                                        <div>Postpartum</div>
                                        <div>Post delivery</div>
                                      </div>
                                    ) : (
                                      <>N/A</>
                                    )}
                                  </TableCell>


                                  {/* 🔹 Risk Level */}
                                  <TableCell>
                                    <Badge
                                      className="text-xs h-[20px] min-w-[70px] px-2 rounded-full"
                                      variant={patient.risk_level as "High" | "Moderate" | "Low"}
                                    >
                                      {patient.risk_level ?? "Low"}
                                    </Badge>
                                  </TableCell>





                                  {/* 🔹 Referrals */}
                                  <TableCell>
                                    {patient.patient_referrals?.[0] ? (
                                      <>
                                        {patient.patient_referrals[0].referring_doctor_name} <br />
                                        <div className="text-[13px] text-[#616161]">
                                          {patient.patient_referrals[0].referring_doctor_specialty}
                                        </div>
                                      </>
                                    ) : "No referrals"}

                                  </TableCell>


                                  {/* 🔹 Actions */}
                                  <TableCell className="min-w-[100px] text-left">
                                    <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
                                      <DialogTrigger asChild>
                                        <Button
                                          onClick={() => {
                                            setSelectedPatient(patient);
                                            setIsReferralDialogOpen(true); // 👈 open when button clicked
                                          }}
                                          variant="outline"

                                          className="cursor-pointer flex items-center gap-2 text-[#6B7280] border-gray-300 shadow-sm hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                                        >
                                          <Icon
                                            icon="vaadin:arrow-forward"
                                            className="w-5 h-5 font-bold text-gray-400"
                                          />
                                          Refer patient
                                        </Button>
                                      </DialogTrigger>

                                      <DialogContent className="w-[525px] h-[518px] font-lato bg-white relative rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed">
                                        {/* Header */}
                                        <div className="text-left mt-5">
                                          <DialogTitle className="text-lg text-gray-800 mb-1">
                                            Refer Patient
                                          </DialogTitle>
                                          <DialogDescription className="text-sm text-gray-500">
                                            Input the needed details below to refer the selected patient to another OB-GYN or specialist.
                                          </DialogDescription>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="mt-6 space-y-4">
                                          <div>
                                            <label className="block text-sm text-gray-700 mb-1">
                                              Referring Doctor's Name:
                                            </label>
                                            <Input
                                              value={refDoctorName}
                                              onChange={(e) => setRefDoctorName(e.target.value)}
                                              placeholder="Input here"
                                              className="w-[465px] h-[45px] border-gray-300"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-sm text-gray-700 mb-1">
                                              Specialty:
                                            </label>
                                            <Input
                                              value={refSpecialty}
                                              onChange={(e) => setRefSpecialty(e.target.value)}
                                              placeholder="Input here"
                                              className="w-[465px] h-[45px] border-gray-300"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-sm text-gray-700 mb-1">
                                              Reason for referral:
                                            </label>
                                            <Input
                                              value={refReason}
                                              onChange={(e) => setRefReason(e.target.value)}
                                              placeholder="Input here"
                                              className="w-[465px] h-[45px] border-gray-300"
                                            />
                                          </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="mt-6">
                                          <Button
                                            onClick={handleSaveReferral}
                                            className="w-[465px] h-[45px] bg-[#E46B64] text-white border border-[#E46B64] hover:bg-[#d65c58] transition-colors"
                                          >
                                            Save Referral
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </TableCell>

                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>

                    </div>
                  </>
                ) : (
                  <div className="flex justify-center items-center h-40 w-full">
                    <Alert className="flex items-center gap-2 px-4 py-3 w-fit border border-none">
                      <Icon icon="tabler:face-id-error" className="w-5 h-5 " />
                      <div>
                        <AlertTitle className="text-sm font-medium">No patient records found</AlertTitle>

                      </div>
                    </Alert>
                  </div>
                )}
              </div>

              {hasPatients && !loading && (
                <div className="w-full flex flex-col sm:flex-row items-center justify-between text-[#616161] mt-6">
                  <p className="text-[12px] font-semibold text-muted-foreground whitespace-nowrap">
                    Showing {paginatedPatientDirectory.length + (currentPage - 1) * itemsPerPage} out of {filteredPatients.length} appointments
                  </p>
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "opacity-50 pointer-events-none" : "text-[#E46B64]"}
                        />
                      </PaginationItem>
                      {[...Array(totalPatientDirectoryPages)].map((_, i) => (
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
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPatientDirectoryPages))}
                          className={currentPage === totalPatientDirectoryPages ? "opacity-50 pointer-events-none" : "text-[#E46B64]"}
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
    </div>
  );
}
