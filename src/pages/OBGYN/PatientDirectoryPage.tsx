
import { Input } from '@/components/ui/input';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import SearchIcon from '@mui/icons-material/Search';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
    TableCell
} from "@/components/ui/table";
import { useState, useMemo } from "react";
import { dummyPatients } from "@/lib/dummyDataPatient";
import type { Patient } from "@/lib/dummyDataPatient";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PopcornIcon } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
  
} from '@/components/ui/pagination';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"




const itemsPerPage = 10;

export default function PatientDirectoryPage() {
    const [patients, setPatients] = useState<Patient[]>(dummyPatients);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [riskFilter, setRiskFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const navigate = useNavigate();

    const handleRiskChange = (index: number, newRisk: "High" | "Medium" | "Low") => {
        const updated = [...patients];
        updated[index].risk = newRisk;
        setPatients(updated);
    };

    const filteredPatients = useMemo(() => {
        let filtered = [...patients];
        if (searchTerm) {
            filtered = filtered.filter((p) =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (statusFilter && statusFilter !== "all") {
            filtered = filtered.filter((p) => p.status.toLowerCase() === statusFilter.toLowerCase());
        }
        if (riskFilter && riskFilter !== "all") {
            filtered = filtered.filter((p) => p.risk.toLowerCase() === riskFilter.toLowerCase());
        }
        return filtered;
    }, [patients, searchTerm, statusFilter, riskFilter]);

    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
    const paginatedPatients = filteredPatients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="flex min-h-screen  ">
            {/* Main Content */}
            <div className="flex flex-col flex-1 ml-0 transition-all duration-300 shadow-sm  bg-gray-50 pb-5">
    
                {/* Main Wrapper */}
                <main className="mt-7 px-4 md:px-6 w-[1285px]">
                    <div className="bg-white rounded-[5px] shadow-md w-full p-6">
                        {/* Title Section */}
                        <div className="flex flex-col gap-1 w-full">
                            <h1 className="text-[24px] font-lato font-semibold">Patient Directory</h1>
                            <h2 className="text-[12px] font-lato text-gray-500">Manage the list of all registered patients under your care.</h2>
                        </div>

                        {/* Filters */}
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

                        {/* Table */}
                        <div className="w-full overflow-x-auto mt-6 scrollbar-hide">

                            {paginatedPatients.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[160px]">Patient</TableHead>
                                            <TableHead className="min-w-[180px]">Status</TableHead>
                                            <TableHead className="min-w-[140px]">Risk</TableHead>
                                            <TableHead className="min-w-[160px]">Referrals</TableHead>
                                            <TableHead className="min-w-[100px] text-left">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedPatients.map((patient, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="min-w-[160px]">
                                                    <div className="flex flex-col">
                                                        <button
                                                            onClick={() =>
                                                                navigate(`/patientdirectory/profile?name=${encodeURIComponent(patient.name)}`)
                                                            }
                                                            className="text-left font-lato text-sm text-gray-700 hover:text-primary hover:underline underline-offset-4 transition-colors duration-200"
                                                        >
                                                            {patient.name}
                                                        </button>

                                                        <span className="text-xs text-gray-500">{patient.appointmentType}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="min-w-[180px]">
                                                    <Badge
                                                        className="text-xs px-1 py-1 min-w-[80px] h-[21px] rounded-lg text-center "
                                                        variant={patient.status}
                                                    >
                                                        {patient.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="min-w-[140px]">
                                                    <Select
                                                        value={patient.risk}
                                                        onValueChange={(value) =>
                                                            handleRiskChange(index, value as "Low" | "Medium" | "High")
                                                        }
                                                    >
                                                        <SelectTrigger className="p-0 border-none bg-transparent shadow-none [&>svg]:hidden">
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
                                                <TableCell className="min-w-[160px]">
                                                    <div className="flex flex-col">
                                                        <span className="font-lato">{patient.referralDoctor}</span>
                                                        <span className="text-xs text-gray-500">{patient.referralType}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="min-w-[100px] text-left">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className="flex items-center gap-2 text-[#6B7280] border-gray-300 shadow-sm hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                                                            >
                                                                <Icon icon="vaadin:arrow-forward" className="w-5 h-5 font-bold text-gray-400" />
                                                                Refer patient
                                                            </Button>
                                                        </DialogTrigger>

                                                        <DialogContent
                                                            className="w-[525px] h-[518px] font-lato bg-white relative rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed"
                                                        >
                                               
                                                            {/* Header */}
                                                            < div className="text-left mt-5">
                                                                <DialogTitle className="text-lg text-gray-800 mb-1">
                                                                    Refer Patient
                                                                </DialogTitle>
                                                                <DialogDescription className="text-sm text-gray-500">
                                                                    Subheading here contains: Input the needed details below to refer the selected patient to another OB-GYN or specialist.
                                                                </DialogDescription>
                                                            </div>


                                                            {/* Form Fields */}
                                                            <div className="mt-6 space-y-4">
                                                                <div>
                                                                    <label className="block text-sm text-gray-700 mb-1">
                                                                        Referring Doctor's Name:
                                                                    </label>
                                                                    <Input
                                                                        placeholder="Input here"
                                                                        className="w-[465px] h-[45px] border-gray-300"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm text-gray-700 mb-1">Specialty:</label>
                                                                    <Input
                                                                        placeholder="Input here"
                                                                        className="w-[465px] h-[45px] border-gray-300"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm text-gray-700 mb-1">
                                                                        Reason for referral:
                                                                    </label>
                                                                    <Input
                                                                        placeholder="Input here"
                                                                        className="w-[465px] h-[45px] border-gray-300"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Submit Button */}
                                                            <div className="mt-6">
                                                                <Button
                                                                    className="w-[465px] h-[45px] bg-[#E46B64] text-white border border-[#E46B64] hover:bg-[#d65c58] transition-colors"
                                                                >
                                                                    Save Referral
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex justify-center items-center h-40 w-full">
                                    <Alert className="flex items-center gap-3 px-4 py-3 w-fit border border-gray-300">
                                        <PopcornIcon className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <AlertTitle className="text-sm font-medium">No patients to display</AlertTitle>
                                            <AlertDescription className="text-sm text-muted-foreground">
                                                There are currently no patients matching your criteria.
                                            </AlertDescription>
                                        </div>
                                    </Alert>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {filteredPatients.length > 0 && (
                            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-[#616161]">
                                <p className="text-[12px] font-semibold text-muted-foreground whitespace-nowrap">
                                    Showing {paginatedPatients.length + (currentPage - 1) * itemsPerPage} out of {filteredPatients.length} patients
                                </p>
                                <Pagination>
                                    <PaginationContent className="gap-1">
                                        <PaginationItem>
                                            <PaginationLink
                                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                className={cn(
                                                    "w-[36px] h-[36px] p-0 border-2 border-[#4B5563] rounded-md flex items-center justify-center text-[#4B5563] font-bold",
                                                    currentPage === 1 && "opacity-50 pointer-events-none"
                                                )}
                                            >
                                                <ChevronLeftIcon className="w-[18px] h-[18px] " />
                                            </PaginationLink>

                                        </PaginationItem>

                                        {[...Array(totalPages)].map((_, i) => (
                                            <PaginationItem key={i}>
                                                <PaginationLink
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    isActive={currentPage === i + 1}
                                                    className={currentPage === i + 1
                                                        ? 'bg-[#E46B64] text-white'
                                                        : 'text-[#E46B64]'}
                                                >
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationLink
                                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                className={cn(
                                                    "w-[36px] h-[36px] p-0 border-2 border-[#4B5563] rounded-md flex items-center justify-center text-gray-900 font-bold",
                                                    currentPage === totalPages && "opacity-50 pointer-events-none"
                                                )}
                                            >
                                                <ChevronRightIcon className="w-[18px] h-[18px] " />
                                            </PaginationLink>

                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </div>
                </main>
            </div >
        </div >
    );
}
