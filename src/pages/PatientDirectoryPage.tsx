import Sidebar from "@/components/DashboardComponents/SidebarComponent"
import Header from "@/components/DashboardComponents/HeaderComponent"
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchIcon } from "lucide-react";
import SwapVertIcon from '@mui/icons-material/SwapVert';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function PatientDirectoryPage() {
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


                                            />
                                        </div>
                                        <Select >
                                            <SelectTrigger className="w-[120px] border border-gray-300">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                               
                                            </SelectContent>
                                        </Select>
                                        <Select >
                                            <SelectTrigger className="w-[140px] border border-gray-300">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Select >
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
                                <Table >
                                    
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
                                        <TableRow>
                                           
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </main>

            </div>
        </div>
    )
}