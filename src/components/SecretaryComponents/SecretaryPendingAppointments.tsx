import { SymptomsIcon, MoodIcon } from '@/components/DashboardComponents/InsightIcons';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const pendingAppointments = [
  {
    id: 1,
    name: "Emma Rodriguez",
    dateTime: "July 10, 2025 9:30 AM",
    details: "Pregnant, 32 weeks • Monthly Checkup",
  },
  {
    id: 2,
    name: "Emma Rodriguez",
    dateTime: "July 10, 2025 9:30 AM",
    details: "Pregnant, 32 weeks • Monthly Checkup",
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    dateTime: "July 10, 2025 9:30 AM",
    details: "Pregnant, 32 weeks • Monthly Checkup",
  },
];


export default function PendingAppointmentsPanel() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-3 h-[530px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-[20px] font-lato font-semibold">
          Pending Appointments
        </h2>
        <span className="text-sm text-red-400 cursor-pointer">View All</span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 mt-4 w-full h-[430px] overflow-y-auto pr-1 rounded-lg">
        {pendingAppointments.map((item) => (
          <Card
            key={item.id}
            className="!py-3 bg-[#FFFCF2] border border-[#FACC15]/30"
          >
            <CardHeader className="flex flex-col items-start">
              <CardTitle className="text-[16px] font-semibold text-black">
                {item.name}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {item.dateTime}
              </CardDescription>
              <div className="text-xs text-gray-700 mt-1">
                {item.details}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

