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
import { Badge, badgeVariants } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { appointments as dummyAppointments } from '@/lib/dummyData';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { VariantProps } from 'class-variance-authority';
import { HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { HoverCard } from '@radix-ui/react-hover-card';

const itemsPerPage = 10;
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function AppointmentPage() {

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [mobileColumn, setMobileColumn] = useState('patient');

  const filteredAppointments = useMemo(() => {
    let filtered = [...dummyAppointments];

    if (search) {
      filtered = filtered.filter((a) =>
        a.patient.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter) {
      console.log("Filter:", statusFilter);
      console.log("Matching appointments:", dummyAppointments.filter(a => a.status === statusFilter));
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
    <div className="flex min-h-screen bg-white">
   

      <div className="flex flex-col flex-1  transition-all duration-300 bg-gray-50 shadow-md pb-5 ">
     
      <main className="mt-7 px-4 md:px-6   ">
          <div className="bg-white rounded-md shadow-md mx-auto p-6">
            <div className="flex flex-col gap-9 items-start w-full">
              <div className="flex flex-col p-1 w-full">
                <h1 className="text-[24px] font-lato font-semibold">Appointments</h1>
                <h2 className="text-[12px] font-lato text-gray-500">View all patients appointments</h2>

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
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === 'allstatus' ? '' : value)}>
                      <SelectTrigger className="w-[120px] border border-gray-300">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allstatus">All</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="reschedule">Reschedule</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>

                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value === 'alltypes' ? '' : value)}>
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
                {hasAppointments ? (
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
                          {paginatedAppointments.map((appt, index) => (
                            <TableRow key={index}>
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
                                  <span className="font-lato text-[15px]">{appt.dateTime.split(' - ')[0]}</span>
                                  <span className="text-[11px] text-gray-400">{appt.dateTime.split(' - ')[1]}</span>
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
                                  {(appt.status === "pending" || appt.status === "confirmed") && (
                                    <>
                                      {/* Call Button with HoverCard */}
                                      <HoverCard>
                                        <HoverCardTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 bg-[#65B43B] p-0 hover:shadow-md cursor-help"
                                          >
                                            <Icon icon="material-symbols:call" className="text-white w-5 h-5" />
                                          </Button>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="text-xs p-2 w-max bg-white border border-gray-200 shadow-md rounded-md">
                                          Call
                                        </HoverCardContent>
                                      </HoverCard>

                                      {/* Reschedule Button with HoverCard */}
                                  
                                      <HoverCard>
                                        <HoverCardTrigger asChild>
                                          <div>
                                            <Dialog>
                                              <DialogTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="icon"
                                                  className="w-8 h-8 border border-gray-400 p-0 hover:shadow-md cursor-help"
                                                >
                                                  <Icon icon="pepicons-pop:rewind-time" className="w-5 h-5" />
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent>...your content here...</DialogContent>
                                            </Dialog>
                                          </div>
                                        </HoverCardTrigger>

                                        <HoverCardContent className="text-xs p-2 w-max bg-white border border-gray-200 shadow-md rounded-md">
                                          Reschedule
                                        </HoverCardContent>
                                      </HoverCard>

                                    </>
                                  )}

                                  {appt.status === "reschedule" && (
                                    <>
                                      {/* Gray Call */}
                                      <HoverCard>
                                        <HoverCardTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 bg-gray-300 p-0 hover:shadow-none cursor-help"
                                          >
                                            <Icon icon="material-symbols:call" className="text-gray-700 w-5 h-5" />
                                          </Button>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="text-xs p-2 w-max bg-white border border-gray-200 shadow-md rounded-md">
                                          Call (disabled)
                                        </HoverCardContent>
                                      </HoverCard>

                                      {/* Gray Reschedule */}
                                      <HoverCard>
                                        <HoverCardTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 bg-gray-300 p-0 hover:shadow-none cursor-help"
                                          >
                                            <Icon icon="mdi:reschedule" className="w-5 h-5 text-gray-700" />
                                          </Button>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="text-xs p-2 w-max bg-white border border-gray-200 shadow-md rounded-md">
                                          Reschedule (disabled)
                                        </HoverCardContent>
                                      </HoverCard>
                                    </>
                                  )}

                                  {appt.status === "done" && (
                                    <>
                                      {/* Gray Call Only */}
                                      <HoverCard>
                                        <HoverCardTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 bg-gray-300 p-0 hover:shadow-none cursor-help"
                                          >
                                            <Icon icon="material-symbols:call" className="text-gray-700 w-5 h-5" />
                                          </Button>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="text-xs p-2 w-max bg-white border border-gray-200 shadow-md rounded-md">
                                          Call 
                                        </HoverCardContent>
                                      </HoverCard>
                                    </>
                                  )}


                                  {(appt.status === "done" || appt.status === "reschedule") && (
                                    <HoverCard>
                                      <HoverCardTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="w-8 h-8 bg-[#3D6EC2] p-0 hover:shadow-md border-[#436CB1] cursor-help"
                                        >
                                          <Icon icon="ri:calendar-schedule-fill" className="text-white w-5 h-5" />
                                        </Button>
                                      </HoverCardTrigger>
                                      <HoverCardContent className="text-xs p-2 w-max bg-white border border-gray-200 shadow-md rounded-md">
                                        Schedule Follow-up
                                      </HoverCardContent>
                                    </HoverCard>
                                  )}
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
                          {paginatedAppointments.map((appt, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {mobileColumn === 'patient' && (
                                  <>
                                    <p className="font-semibold">{appt.patient}</p>
                                    <p className="text-xs text-gray-400">{appt.weeksPregnant} weeks pregnant</p>
                                  </>
                                )}
                                {mobileColumn === 'date' && (
                                  <>
                                    <p>{appt.dateTime.split(" - ")[0]}</p>
                                    <p className="text-xs text-gray-400">{appt.dateTime.split(" - ")[1]}</p>
                                  </>
                                )}
                                {mobileColumn === 'type' && <p>{appt.type}</p>}
                                {mobileColumn === 'status' && (
                                  <Badge variant={appt.status.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}>
                                    {capitalize(appt.status)}
                                  </Badge>
                                )}
                                {mobileColumn === 'actions' && (
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
              {hasAppointments && (
                <div className="w-full flex flex-col sm:flex-row items-center justify-between text-[#616161] mt-6">
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
