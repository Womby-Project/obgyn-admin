import { useEffect, useState } from "react";
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
import { useNavigate } from "react-router-dom";

export default function SecretaryAppointment() {
  const [patients, setPatients] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from("patient_users")
        .select(`
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
        `);

      if (error) {
        console.error("Error fetching patients:", error);
      } else {
        setPatients(data);
      }
    };

    fetchPatients();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full  ">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Patient Directory</h2>
        <button 
        onClick={() => navigate("/patientdirectory")}
        className="text-sm text-[#E46B64] font-medium hover:underline">
          View All
        </button>
      </div>

      {/* Table */}
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
          {patients.slice(0, 5).map((p) => (
            <TableRow key={p.id}>
              {/* Patient */}
              <TableCell className="font-medium">
                {p.first_name} {p.last_name}
              </TableCell>

              {/* Maternal Status (plain text) */}
              <TableCell>{p.patient_type || "N/A"}</TableCell>

              {/* Risk Level (badge) */}
              <TableCell>
                {p.risk_level ? (
                  <Badge variant={p.risk_level as any}>{p.risk_level}</Badge>
                ) : (
                  <Badge variant="outline">N/A</Badge>
                )}
              </TableCell>

              {/* Referrals */}
              <TableCell>
                {p.patient_referrals?.length > 0 ? (
                  <ul className="space-y-2">
                    {p.patient_referrals.map((ref: any) => (
                      <li key={ref.id}>
                        <div className="font-lato">{ref.referring_doctor_name}</div>
                        <div className="text-[13px] text-gray-600">{ref.referring_doctor_specialty}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No Referrals"
                )}
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
