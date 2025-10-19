"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Referral = {
  id: string;
  referring_doctor_name: string | null;
  referring_doctor_specialty: string | null;
  reason: string | null;
};

type PatientRow = {
  id: string;
  first_name: string;
  last_name: string;
  patient_type: string | null;
  risk_level: string | null;
  patient_referrals?: Referral[];
};

export default function ObgynPatientDirectorySnippet() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);

        // Logged-in OBGYN
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!user) throw new Error("Not authenticated.");

        // Optional: verify OBGYN
        const { data: obgynRow, error: obgynErr } = await supabase
          .from("obgyn_users")
          .select("id")
          .eq("id", user.id)
          .single();
        if (obgynErr || !obgynRow) {
          throw new Error("This account is not registered as an OB-GYN.");
        }

        // Fetch ONLY 5 patients for this OBGYN
        const { data, error } = await supabase
          .from("patient_users")
          .select(
            `
            id,
            first_name,
            last_name,
            patient_type,
            risk_level,
            patient_referrals (
              id,
              referring_doctor_name,
              referring_doctor_specialty,
              reason
            )
          `
          )
          .eq("obgyn_id", user.id)
          .order("last_name", { ascending: true })
          .limit(5); // <-- hard limit at the DB level

        if (error) throw error;
        if (mounted) setPatients((data as PatientRow[]) ?? []);
      } catch (e: any) {
        if (mounted) setErrMsg(e?.message ?? "Failed to load patients.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const RiskBadge = ({ level }: { level: string | null }) => {
    if (!level) return <Badge variant="outline">N/A</Badge>;
    const normalized = level.toLowerCase();
    if (normalized === "high") {
      return <Badge className="bg-red-100 text-red-800 border-red-200">High</Badge>;
    }
    if (normalized === "moderate") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Moderate
        </Badge>
      );
    }
    if (normalized === "low") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Low</Badge>;
    }
    return <Badge variant="outline">{level}</Badge>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Patient Directory</h2>
        <button
          onClick={() => navigate("/patientdirectory")}
          className="text-sm text-[#E46B64] font-medium hover:underline"
        >
          View All
        </button>
      </div>

      {/* States */}
      {loading && <div className="text-sm text-gray-500 py-6">Loading patients…</div>}
      {errMsg && !loading && (
        <div className="text-sm text-red-600 py-4">{errMsg}</div>
      )}

      {/* Table */}
      {!loading && !errMsg && (
        <Table className="border rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Patient</TableHead>
              <TableHead>Maternal Status</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Referrals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-gray-500">
                  No patients found for this OB-GYN.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.first_name} {p.last_name}
                  </TableCell>
                  <TableCell>{p.patient_type || "N/A"}</TableCell>
                  <TableCell>
                    <RiskBadge level={p.risk_level} />
                  </TableCell>
                  <TableCell>
                    {p.patient_referrals && p.patient_referrals.length > 0 ? (
                      <ul className="space-y-2">
                        {p.patient_referrals.map((ref) => (
                          <li key={ref.id}>
                            <div className="font-lato">
                              {ref.referring_doctor_name || "Unknown Doctor"}
                            </div>
                            <div className="text-[13px] text-gray-600">
                              {ref.referring_doctor_specialty || "—"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No Referrals"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
