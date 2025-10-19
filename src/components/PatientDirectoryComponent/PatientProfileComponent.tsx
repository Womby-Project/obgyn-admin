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
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import { supabase } from "@/lib/supabaseClient";
import type { VariantProps } from "class-variance-authority";

/* ----------------------------- Types ----------------------------- */

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  email: string;
  phone_number: string;
  status: string; // e.g., "Active" | "Inactive" | "Pending"
  risk_level: "Low" | "Moderate" | "High";
  appointment_type?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  allergies?: string[];
  pre_existing_conditions?: string[];
  mental_health_history?: string;
  family_medical_history?: string[];
  birth_date?: string | null;
};

type Group = {
  title: string;
  options: string[];
};

/* ---------------------- Allergies Group Catalog (UI only) ---------------------- */

const ALLERGIES_GROUPS: Group[] = [
  {
    title: "Airborne Triggers",
    options: ["None", "Pollen", "Dust Mites", "Mold Spores", "Pet Dander", "Cockroach Droppings"],
  },
  {
    title: "Food Allergens",
    options: [
      "None",
      "Milk",
      "Eggs",
      "Peanuts/Tree Nuts (e.g., walnuts, almonds)",
      "Fish",
      "Shellfish (e.g., crabs, shrimp, lobsters, oysters, clams, mussels, squid, and octopuses)",
      "Wheat",
      "Soy",
      "Sesame",
    ],
  },
  {
    title: "Insect Stings",
    options: ["None", "Bee Sting", "Wasp Sting", "Hornet Sting", "Yellow Jackets Sting", "Fire Ants Sting"],
  },
  { title: "Medication Allergies", options: ["None", "Penicillin", "Antibiotics"] },
  { title: "Contact/Substance Allergies", options: ["None", "Poison Ivy", "Latex", "Nickel (in jewelry)", "Fragrances/Cosmetics"] },
];

/* ------------- Pre-existing Conditions Group Catalog (UI only) ------------- */

const CONDITIONS_GROUPS: Group[] = [
  {
    title: "Common Medical Conditions",
    options: [
      "None",
      "COVID-19",
      "HIV/AIDS",
      "Malaria",
      "Tuberculosis",
      "Cancer",
      "Anemia",
      "Hemophilia",
      "Lupus",
      "Rheumatoid Arthritis",
      "Diabetes Mellitus",
      "Thyroid disorders",
      "Obesity",
      "Vitamin deficiencies",
      "Depression",
      "Anxiety Disorders",
      "Schizophrenia",
      "Autism Spectrum Disorder",
      "Alzheimer's disease",
      "Parkinson's disease",
      "Epilepsy",
      "Multiple Sclerosis",
      "Migraines",
      "Cataracts",
      "Glaucoma",
      "Hearing Loss",
      "Hypertension",
      "Coronary Artery Disease",
      "Heart Failure",
      "Stroke",
      "Asthma",
      "Chronic Obstructive Pulmonary Disease (COPD)",
      "Pneumonia",
      "Gastroenteritis",
      "Irritable Bowel Syndrome",
      "Cirrhosis of the liver",
      "Psoriasis",
      "Eczema",
      "Acne",
      "Osteoarthritis",
      "Osteoporosis",
      "Back pain",
      "Chronic Kidney Disease",
      "Kidney stones",
      "Benign Prostatic Hyperplasia",
    ],
  },
  {
    title: "Related to Pregnancy, Childbirth, and the Postpartum",
    options: [
      "None",
      "Ectopic pregnancy",
      "Miscarriage",
      "Severe morning sickness",
      "Gestational diabetes",
      "Pre-eclampsia",
      "Placenta previa",
    ],
  },
];

/* --------------------------- Mappers/Utils --------------------------- */

const riskToVariant = (
  risk: string | null | undefined
): VariantProps<typeof badgeVariants>["variant"] => {
  const v = (risk ?? "").toLowerCase();
  if (v === "low") return "Low";
  if (v === "moderate") return "Moderate";
  if (v === "high") return "High";
  return "secondary";
};

const statusToVariant = (
  status: string | null | undefined
): VariantProps<typeof badgeVariants>["variant"] => {
  const s = (status ?? "").toLowerCase();
  if (["active", "verified", "current"].includes(s)) return "Active";
  if (["pending", "new", "unverified"].includes(s)) return "Inactive";
  if (["inactive", "blocked"].includes(s)) return "destructive";
  return "outline";
};

const maskPhone = (phone?: string) => {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
};

const prettyEmail = (email?: string) => email || "—";

/** Prefer birth_date (YYYY-MM-DD) to compute age; otherwise return null. */
const computeAgeFromBirthDate = (birthDate?: string | null): number | null => {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

/** Capitalize each word (keeps separators like spaces, hyphens, slashes). */
const toTitleCase = (str?: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/(\s|-|\/)/) // keep separators
    .map((part) =>
      /^[a-z]/.test(part) ? part[0].toUpperCase() + part.slice(1) : part
    )
    .join("");
};

/* ---------------------- Generic Grouping Helpers ---------------------- */

const buildLookup = (groups: Group[]) => {
  const map = new Map<string, string>();
  for (const g of groups) {
    for (const opt of g.options) {
      map.set(opt.trim().toLowerCase(), g.title);
    }
  }
  return map;
};

const ALLERGY_LOOKUP = buildLookup(ALLERGIES_GROUPS);
const CONDITIONS_LOOKUP = buildLookup(CONDITIONS_GROUPS);

const groupForDisplay = (
  rawList: string[] | undefined,
  groups: Group[],
  lookup: Map<string, string>
) => {
  if (!rawList || rawList.length === 0) return [];

  // If "None" is included anywhere, treat as none.
  const hasNone = rawList.some((a) => a.trim().toLowerCase() === "none");
  if (hasNone) return [];

  // Initialize buckets in catalog order
  const buckets: Record<string, string[]> = {};
  for (const g of groups) buckets[g.title] = [];

  const other: string[] = [];

  for (const raw of rawList) {
    const norm = raw.trim();
    if (!norm) continue;
    const key = norm.toLowerCase();
    const cat = lookup.get(key);

    if (cat) {
      if (key !== "none") buckets[cat].push(norm);
    } else {
      other.push(norm);
    }
  }

  const results: { title: string; items: string[] }[] = [];
  for (const g of groups) {
    if (buckets[g.title].length) results.push({ title: g.title, items: buckets[g.title] });
  }
  if (other.length) results.push({ title: "Other", items: other });

  return results;
};

/* ---------------------------- Component ---------------------------- */

export default function PatientProfileComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams<{ patientId: string }>();

  const [userRole, setUserRole] = useState<"obgyn" | "secretary" | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [riskLevel, setRiskLevel] = useState<"Low" | "Moderate" | "High">("Low");
  const canViewInsights = userRole === "obgyn";

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
    return "/appointments";
  };
  const backPath = useMemo(getBackPath, [location.pathname]);

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);

      if (!patientId) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        return;
      }

      let obgynId: string | null = null;

      // Check OBGYN role
      const { data: obgyn } = await supabase
        .from("obgyn_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (obgyn) {
        setUserRole("obgyn");
        obgynId = obgyn.id;
      } else {
        // Otherwise, secretary
        const { data: secretary } = await supabase
          .from("secretary_users")
          .select("obgyn_id")
          .eq("id", user.id)
          .maybeSingle();

        if (secretary) {
          setUserRole("secretary");
          obgynId = secretary.obgyn_id;
        }
      }

      if (!obgynId) {
        setLoading(false);
        return;
      }

      const { data: patientData } = await supabase
        .from("patient_users")
        .select("*")
        .eq("id", patientId)
        .eq("obgyn_id", obgynId)
        .maybeSingle();

      if (patientData) {
        const normalized: Patient = {
          ...patientData,
          risk_level: (patientData.risk_level ?? "Low").replace(
            /Medium/i,
            "Moderate"
          ) as "Low" | "Moderate" | "High",
        };

        // Prefer birth_date-derived age for display
        const computedAge = computeAgeFromBirthDate(patientData.birth_date);
        const normalizedWithAge: Patient = {
          ...normalized,
          age: computedAge ?? normalized.age ?? null,
        };

        setPatient(normalizedWithAge);
        setRiskLevel(normalizedWithAge.risk_level);
      }

      setLoading(false);
    };

    fetchPatient();
  }, [patientId]);

  /* --------------------------- UI States --------------------------- */

  if (loading) {
    return (
      <div className="flex h-screen w-[1150px] items-center justify-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#E46B64]" />
        <p className="text-sm text-gray-500">Loading patient details…</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-screen">
        <div className="flex flex-col flex-1 ml-[260px] bg-gray-50">
          <header className="fixed top-0 left-[260px] right-0 h-10 bg-white shadow-sm z-10" />
          <main className="fixed top-10 left-[260px] right-0 bottom-0 overflow-hidden mt-2">
            <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">
              <Card className="bg-white rounded-xl shadow-sm p-8 text-center">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Patient not found
                </CardTitle>
                <p className="text-sm text-gray-500 mt-2">
                  The patient you’re looking for may have been moved or no longer
                  exists.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => navigate(getBackPath())}
                >
                  Go back
                </Button>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* ---------------------------- Render ---------------------------- */

  // Group for display (UI-only)
  const groupedAllergies = groupForDisplay(patient.allergies, ALLERGIES_GROUPS, ALLERGY_LOOKUP);
  const groupedConditions = groupForDisplay(
    patient.pre_existing_conditions,
    CONDITIONS_GROUPS,
    CONDITIONS_LOOKUP
  );

  return (
    <div className="flex h-screen">
      <div className="flex flex-col flex-1 ml-[260px] bg-gray-50">
        <header className="fixed top-0 left-[260px] right-0 h-10 bg-white shadow-sm z-10">
          <Header />
        </header>

        <main className="fixed top-10 left-[260px] right-0 bottom-0 overflow-hidden mt-2">
          <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">
            {/* Profile Shell */}
            <div className="flex mt-2">
              <Card className="w-full bg-white rounded-xl shadow-sm">
                <CardHeader className="flex flex-col gap-2 border-b border-gray-100">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex flex-col gap-1">
                      <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">
                        Patient Profile
                      </h1>
                      <div className="text-[12px] text-gray-500">
                        <Breadcrumb>
                          <BreadcrumbList>
                            <BreadcrumbItem>
                              <BreadcrumbLink
                                className="hover:underline cursor-pointer"
                                onClick={() => navigate(backPath)}
                              >
                                {backPath.includes("appointment")
                                  ? "Appointments"
                                  : "Patient Directory"}
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbPage>Profile Details</BreadcrumbPage>
                          </BreadcrumbList>
                        </Breadcrumb>
                      </div>
                    </div>

                    {/* Quick Action for OBGYN */}
                    {canViewInsights && (
                      <Button
                        variant="outline"
                        className="text-[#E46B64] border-[#F4C9C6] hover:bg-[#FFF4F3]"
                        onClick={() =>
                          navigate(`/patientdirectory/maternalinsight/${patient.id}`)
                        }
                        aria-label="View maternal insights"
                      >
                        View Maternal Insights →
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-5">
                  {/* Header Row: Name + Status */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="flex items-center gap-3 font-semibold text-[20px] text-gray-900">
                      {/* Simple avatar placeholder */}
                      <div className="h-10 w-10 rounded-full bg-[#FFE9E7] text-[#E46B64] flex items-center justify-center text-sm font-bold">
                        {`${patient.first_name?.[0] ?? ""}${patient.last_name?.[0] ?? ""}`.toUpperCase()}
                      </div>
                      <span>
                        {patient.first_name} {patient.last_name}
                      </span>
                      <Badge variant={statusToVariant(patient.status)} className="px-2 py-0.5">
                        {patient.status ?? "Status"}
                      </Badge>
                    </CardTitle>

                    <div className="flex items-center gap-4">
                      {/* Appointment type (if any) */}
                      {patient.appointment_type && (
                        <div className="flex items-center gap-1 text-[#E46B64]">
                          <CheckCircleOutlineIcon fontSize="small" />
                          <span className="text-[14px] font-medium">
                            {patient.appointment_type}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Snapshot: Age (line 1) + Risk (line 2) */}
                  <div className="mt-4 flex flex-col gap-2">
                    {/* Age line */}
                    <div className="flex items-center gap-2">
                      <PersonOutlineOutlinedIcon className="text-gray-500" fontSize="small" />
                      <p className="text-[14.5px] text-[#616161]">
                        <span className="font-semibold">Age:</span>{" "}
                        <span className="font-medium">{patient.age ?? "—"}</span>
                      </p>
                    </div>

                    {/* Risk line (now next line after Age) */}
                    <div className="flex items-center gap-2">
                      <ReportGmailerrorredOutlinedIcon className="text-gray-500" fontSize="small" />
                      <p className="text-[14.5px] text-[#616161]">
                        <span className="font-semibold">Risk Level:</span>{" "}
                      </p>

                      {userRole === "obgyn" ? (
                        <Select
                          value={riskLevel}
                          onValueChange={(value) =>
                            setRiskLevel(value as "Low" | "Moderate" | "High")
                          }
                        >
                          <SelectTrigger className="p-0 border-none bg-transparent [&>svg]:hidden">
                            <Badge
                              className="flex font-semibold items-center gap-1 text-xs h-[24px] min-w-[100px] px-2 rounded-lg cursor-pointer"
                              variant={riskToVariant(riskLevel)}
                            >
                              {riskLevel}
                              <ChevronDown className="w-3 h-3" />
                            </Badge>
                          </SelectTrigger>
                          <SelectContent className="border-none shadow-lg">
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Moderate">Moderate</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className="flex font-semibold items-center gap-1 text-xs h-[24px] min-w-[100px] px-2 rounded-lg"
                          variant={riskToVariant(riskLevel)}
                        >
                          {riskLevel}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="mt-8">
                    <h2 className="font-semibold text-[18px] text-gray-900">
                      Contact Details
                    </h2>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-[12px] uppercase tracking-wide text-gray-500">
                          Phone Number
                        </p>
                        <p className="mt-1 text-[15px] font-medium text-gray-800">
                          {maskPhone(patient.phone_number)}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-[12px] uppercase tracking-wide text-gray-500">
                          Email Address
                        </p>
                        <p className="mt-1 text-[15px] font-medium text-gray-800">
                          {prettyEmail(patient.email)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contacts */}
                  <div className="mt-8">
                    <h2 className="font-semibold text-[18px] text-gray-900">
                      Emergency Contact
                    </h2>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-[12px] uppercase tracking-wide text-gray-500">
                          Name
                        </p>
                        <p className="mt-1 text-[15px] font-semibold text-gray-900">
                          {patient.emergency_contact_name || "—"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-[12px] uppercase tracking-wide text-gray-500">
                          Relationship
                        </p>
                        <p className="mt-1 text-[15px] font-semibold text-gray-900">
                          {patient.emergency_contact_relationship || "—"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-[12px] uppercase tracking-wide text-gray-500">
                          Phone Number
                        </p>
                        <p className="mt-1 text-[15px] font-semibold text-gray-900">
                          {patient.emergency_contact_phone || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Medical History */}
            <Card className="w-full bg-white rounded-xl shadow-sm mt-6">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-[20px] text-gray-900">
                  Medical History
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5">
                {/* Allergies - grouped by refined categories (UI-only) */}
                <section className="mb-6">
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-2">
                    Allergies
                  </h3>

                  {groupedAllergies.length === 0 ? (
                    <p className="text-gray-500 text-[14px]">
                      No allergies recorded.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {groupedAllergies.map((grp) => (
                        <div key={grp.title}>
                          {/* Basic refined title (no icons) */}
                          <p className="text-[12px] uppercase tracking-wide text-gray-600 mb-1">
                            {grp.title}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {grp.items.map((item, idx) => (
                              <Badge key={idx} variant="allergy" className="rounded-lg">
                                {toTitleCase(item)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Pre-existing Conditions - grouped into the 2 categories */}
                <section className="mb-6">
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-2">
                    Pre-existing Conditions
                  </h3>

                  {groupedConditions.length === 0 ? (
                    <p className="text-gray-500 text-[14px]">
                      No pre-existing conditions recorded.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {groupedConditions.map((grp) => (
                        <div key={grp.title}>
                          <p className="text-[12px] uppercase tracking-wide text-gray-600 mb-1">
                            {grp.title}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {grp.items.map((item, idx) => (
                              <Badge key={idx} variant="conditions" className="rounded-lg">
                                {toTitleCase(item)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Mental Health History */}
                <section className="mb-6">
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-2">
                    Mental Health History
                  </h3>
                  {patient.mental_health_history ? (
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-[14.5px] leading-relaxed text-gray-800">
                      {patient.mental_health_history}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-[14px]">
                      No mental health history recorded.
                    </p>
                  )}
                </section>

                {/* Family Medical History */}
                <section>
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-2">
                    Family Medical History
                  </h3>
                  {patient.family_medical_history?.length ? (
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-[14.5px] text-gray-800 capitalized">
                      <ul className="list-disc ml-5 space-y-1 ">
                        {patient.family_medical_history.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-[14px]">
                      No family medical history recorded.
                    </p>
                  )}
                </section>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
