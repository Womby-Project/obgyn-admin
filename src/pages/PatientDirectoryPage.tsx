import Sidebar from "@/components/DashboardComponents/SidebarComponent";
import Header from "@/components/DashboardComponents/HeaderComponent";
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SearchIcon } from "lucide-react";
import SwapVertIcon from '@mui/icons-material/SwapVert';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
    TableCell
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { dummyPatients } from "@/lib/dummyDataPatient";
import type { Patient } from "@/lib/dummyDataPatient"; // ✅ Type-only import
import React from "react";
import { ChevronDown } from "lucide-react";


export default function PatientDirectoryPage() {
    const [patients, setPatients] = React.useState<Patient[]>(dummyPatients);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [riskFilter, setRiskFilter] = useState("");

    const handleRiskChange = (index: number, newRisk: "High" | "Medium" | "Low") => {
        const updated = [...patients];
        updated[index].risk = newRisk;
        setPatients(updated);
    };



    const filteredPatients = patients.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? p.status === statusFilter : true;
        const matchesRisk = riskFilter ? p.risk === riskFilter : true;
        return matchesSearch && matchesStatus && matchesRisk;
    });



    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex flex-col flex-1 ml-[260px] bg-gray-50">
                <header className="fixed top-0 left-[260px] right-0 h-10 bg-white shadow-sm z-10">
                    <Header />
                </header>

                <main className="fixed top-10 left-[260px] right-0 bottom-0 overflow-hidden">
                    <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">
                        <div className="flex flex-col gap-9 mt-2 items-start w-full">
                            <div className="flex flex-col p-1 mt-2 w-full">
                                <h1 className="text-[24px] font-lato font-semibold">Patient Directory</h1>
                                <h2 className="text-[12px] font-lato text-gray-500">Manage the list of all registered patients under your care.</h2>

                                {/* Search bar */}
                                <div className="flex flex-wrap gap-4 mt-5 w-full justify-between">
                                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                        <div className="relative w-full sm:w-[300px]">
                                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fontSize="small" />
                                            <Input
                                                className="pl-10 border border-gray-300 w-full"
                                                placeholder="Search"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-[120px] border border-gray-300">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={riskFilter} onValueChange={setRiskFilter}>
                                            <SelectTrigger className="w-[140px] border border-gray-300">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="Low">Low</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Select>
                                        <SelectTrigger className="w-full sm:w-[120px] border border-gray-300 px-2 flex justify-between">
                                            <SelectValue placeholder="Sort" />
                                            <SwapVertIcon className="text-gray-500" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest</SelectItem>
                                            <SelectItem value="oldest">Oldest</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="w-full overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[160px]">PATIENT</TableHead>
                                            <TableHead className="min-w-[180px]">STATUS</TableHead>
                                            <TableHead className="min-w-[140px]">RISK</TableHead>
                                            <TableHead className="min-w-[160px]">REFERRALS</TableHead>
                                            <TableHead className="min-w-[100px] text-left">ACTIONS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPatients.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4 text-sm text-gray-400">
                                                    No patients to display.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredPatients.map((patient, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{patient.name}</span>
                                                            <span className="text-xs text-gray-500">{patient.appointmentType}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className="text-xs px-1 py-1 min-w-[80px] h-[21px] rounded-lg text-center "
                                                            variant={patient.status}>{patient.status}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                           
                                                            value={patient.risk}
                                                            onValueChange={(value) => handleRiskChange(index, value as "Low" | "Medium" | "High")}
                                                        >

                                                            <SelectTrigger className="p-0 border-none bg-white [&>svg]:hidden">
                                                                <Badge
                                                                    className="flex items-center justify-between gap-1 text-xs h-[21px] min-w-[80px] px-2 py-0.5 rounded-lg text-center cursor-pointer"
                                                                    variant={patient.risk}
                                                                >
                                                                    {patient.risk}
                                                                    <ChevronDown className="w-3 h-3" />
                                                                </Badge>
                                                            </SelectTrigger>

                                                            <SelectContent className="border-none">
                                                                <SelectItem value="Low">Low</SelectItem>
                                                                <SelectItem value="Medium">Medium</SelectItem>
                                                                <SelectItem value="High">High</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>


                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{patient.referralDoctor}</span>
                                                            <span className="text-xs text-gray-500">{patient.referralType}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <button className="text-blue-600 hover:underline flex items-center gap-1 text-xs">
                                                                <VisibilityOutlinedIcon style={{ fontSize: 16 }} /> View Patient
                                                            </button>
                                                            <button className="text-green-600 hover:underline flex items-center gap-1 text-xs">
                                                                <RateReviewOutlinedIcon style={{ fontSize: 16 }} /> Refer to Others
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
