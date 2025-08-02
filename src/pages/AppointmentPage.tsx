import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/DashboardComponents/SidebarComponent';
import Header from '@/components/DashboardComponents/HeaderComponent';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import SearchIcon from '@mui/icons-material/Search';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PopcornIcon } from 'lucide-react';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Badge } from '@/components/ui/badge';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from '@/components/ui/pagination';
import { appointments as dummyAppointments } from '@/lib/dummyData';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';

const itemsPerPage = 10;
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function AppointmentPage() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [sortOption, setSortOption] = useState('');

    const filteredAppointments = useMemo(() => {
        let filtered = [...dummyAppointments];

        if (search) {
            filtered = filtered.filter((a) =>
                a.patient.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (statusFilter) {
            filtered = filtered.filter((a) => a.status === statusFilter.toLowerCase());
        }
        if (typeFilter) {
            filtered = filtered.filter((a) => a.type.toLowerCase().includes(typeFilter));
        }
        if (sortOption === 'Sort1') {
            filtered.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
        }

        return filtered;
    }, [search, statusFilter, typeFilter, sortOption]);

    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
    const paginatedAppointments = filteredAppointments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const hasAppointments = filteredAppointments.length > 0;

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
                                <h1 className="text-[24px] font-lato font-semibold">Appointments</h1>
                                <h2 className="text-[12px] font-lato text-gray-500">View all patients appointments</h2>
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
                                        <Select value={statusFilter} onValueChange={(value)=> {
                                            setStatusFilter(value === 'allstatus' ? '': value)
                                        }}>
                                            <SelectTrigger className="w-[120px] border border-gray-300">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                 <SelectItem value="allstatus">All</SelectItem>
                                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={typeFilter} onValueChange={(value) =>{
                                            setTypeFilter(value === 'alltypes' ? '': value)
                                        }}>
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
                            <div className="w-full overflow-x-auto">
                                {hasAppointments ? (
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
                                            {paginatedAppointments.map((appt, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-lato text-[13px]">{appt.patient}</span>
                                                            <span className="text-[10px] text-gray-400">{appt.weeksPregnant} weeks pregnant</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-lato text-[13px]">{appt.dateTime.split(' - ')[0]}</span>
                                                            <span className="text-[10px] text-gray-400">{appt.dateTime.split(' - ')[1]}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{appt.type}</TableCell>
                                                    <TableCell>
                                                        <Badge className={
                                                            appt.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                                : appt.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-200'
                                                                    : appt.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200'
                                                                        : ''
                                                        }>
                                                            {capitalize(appt.status)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        <Select onValueChange={(value) => {
                                                            if (value === 'notes') {
                                                                navigate(`/appointments/notes?name=${encodeURIComponent(appt.patient)}`);
                                                            }
                                                        }}>
                                                            <SelectTrigger className="p-1 h-auto border-none bg-transparent shadow-none focus:outline-none [&>svg]:hidden">
                                                                <MoreHorizIcon className="text-gray-500 cursor-pointer" fontSize="small" />
                                                            </SelectTrigger>
                                                            <SelectContent className="w-[180px] border-none">
                                                                <SelectItem value="view" className="pr-2 [&>span:first-child]:hidden">
                                                                    <div className="flex items-center gap-2 text-[#6B7280]">
                                                                        <PersonOutlineOutlinedIcon fontSize="small" />
                                                                        View Patient
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="notes" className="pr-2 [&>span:first-child]:hidden">
                                                                    <div className="flex items-center gap-2 text-[#6B7280]">
                                                                        <NotesOutlinedIcon fontSize="small" />
                                                                        View Notes
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="reschedule" className="pr-2 [&>span:first-child]:hidden">
                                                                    <div className="flex items-center gap-2 text-[#6B7280]">
                                                                        <AccessTimeOutlinedIcon fontSize="small" />
                                                                        Reschedule
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="flex justify-center items-center h-full w-full">
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
                            {hasAppointments && (
                                <div className="w-full flex items-center justify-between mt-3 text-[#616161]">
                                    <p className="text-[12px] font-semibold text-muted-foreground whitespace-nowrap">
                                        Showing {paginatedAppointments.length + (currentPage - 1) * itemsPerPage} out of {filteredAppointments.length} appointments
                                    </p>
                                    <Pagination>
                                        <PaginationContent className="gap-1">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                    className={currentPage === 1 ? 'opacity-50 pointer-events-none' : 'text-[#E46B64]'}
                                                />
                                            </PaginationItem>
                                            {[...Array(totalPages)].map((_, i) => (
                                                <PaginationItem key={i}>
                                                    <PaginationLink
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        isActive={currentPage === i + 1}
                                                        className={currentPage === i + 1 ? 'bg-[#E46B64] text-white' : 'text-[#E46B64]'}
                                                    >
                                                        {i + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                    className={currentPage === totalPages ? 'opacity-50 pointer-events-none' : 'text-[#E46B64]'}
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
