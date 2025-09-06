import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { supabase } from "@/lib/supabaseClient"

type AppointmentUIRow = {
  id: string
  patient: string
  weeksPregnant: number | string
  date: string
  time: string
  type: string
  status: string
  dateTime: Date
}

type FollowUpDialogProps = {
  open: boolean
  onClose: () => void
  appointment?: AppointmentUIRow
  onConfirm?: (followUp: {
    id: string
    appointment_id: string
    follow_up_datetime: string
    reason?: string
  }) => void
}

// helper to generate 30-min slots
const generateTimes = (interval = 30) => {
  const times: string[] = []
  const date = new Date()
  date.setHours(0, 0, 0, 0)

  while (date.getDate() === new Date().getDate()) {
    const label = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
    times.push(label)
    date.setMinutes(date.getMinutes() + interval)
  }
  return times
}

export default function FollowUpDialog({
  open,
  onClose,
  appointment,
  onConfirm,
}: FollowUpDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [time, setTime] = useState<string>("")
  const [timeOpen, setTimeOpen] = useState(false)

  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const times = generateTimes(30)

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setDate(undefined)
      setTime("")
      setReason("")
    }
  }, [open])

  const handleConfirm = async () => {
  if (!appointment || !date || !time) return;

  // build datetime
  const [hours, minutes] = time.split(":");
  const isPM = time.toLowerCase().includes("pm");
  let h = parseInt(hours, 10);
  let m = parseInt(minutes, 10);
  if (isPM && h < 12) h += 12;
  if (!isPM && h === 12) h = 0;

  const followUpDate = new Date(date);
  followUpDate.setHours(h, m, 0, 0);

  try {
    setLoading(true);

    // 1. Insert into followups table
    const { data: followup, error } = await supabase
      .from("appointment_followups")
      .insert([
        {
          appointment_id: appointment.id,
          follow_up_datetime: followUpDate.toISOString(),
          reason: reason || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    console.log("✅ Follow-up inserted:", followup);

    // 2. Update parent appointment table with *new date + status*
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "Accepted",
        appointment_datetime: followUpDate.toISOString(), // ⬅️ update main date
      })
      .eq("id", appointment.id);

    if (updateError) throw updateError;
    console.log("✅ Appointment status & date updated in DB");

    if (onConfirm && followup) onConfirm(followup);
    onClose();
  } catch (err) {
    console.error("❌ Error scheduling follow-up:", err);
  } finally {
    setLoading(false);
  }
};



  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-white border-gray-300">
        <DialogHeader>
          <DialogTitle className="mt-8">Schedule for  Follow-up Checkup</DialogTitle>
          <DialogDescription>
            Set the date and time for the patient’s follow-up appointment.
          </DialogDescription>
        </DialogHeader>

        {appointment && (
          <>
            {/* Original Appointment Info */}
            <div className="flex flex-col">
              <h1 className="text-base font-medium">Current Appointment</h1>
              <p className="text-[#616161] text-[12px]">
                {appointment.date} {appointment.time}
              </p>
              <p className="text-[#616161] text-[12px] ">
                Name: {appointment.patient}
              </p>
            </div>

            {/* Follow-up Date Picker */}
            <div className="flex flex-col gap-3 mt-5">
              <Label htmlFor="date" className="px-1">
                <div className="text-[15px] font-lato">Follow-up Appointment Date</div>
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className={cn(
                      "w-full justify-between text-left font-normal h-[45px] border border-[#ECEEF0]",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-90" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-gray-400"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate)
                      setCalendarOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Follow-up Time Picker */}
            <div className="flex flex-col gap-3 mt-3">
              <Label htmlFor="time" className="px-1">
                <div className="text-[15px] font-lato">Follow-up Appointment Time</div>
              </Label>
              <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="time"
                    className={cn(
                      "w-full justify-between text-left font-normal h-[45px] border border-[#ECEEF0]",
                      !time && "text-muted-foreground"
                    )}
                  >
                    {time || <span>Pick a time</span>}
                    <Clock className="ml-2 h-4 w-4 opacity-90" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-40 p-0 border border-gray-300 rounded-md shadow-lg bg-white"
                  align="start"
                  side="bottom"
                  avoidCollisions={false}
                >
                  <div className="max-h-60 overflow-y-auto">
                    {times.map((t) => (
                      <div
                        key={t}
                        className="cursor-pointer px-3 py-2 hover:bg-accent"
                        onClick={() => {
                          setTime(t)
                          setTimeOpen(false)
                        }}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-3 mt-3">
              <Label htmlFor="reason" className="px-1">
                <div className="text-[15px] font-lato">
                  Reason for Follow-up
                </div>
              </Label>
              <Input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason"
                className="h-[45px] border border-[#ECEEF0]"
              />
            </div>

            {/* Confirm Button */}
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleConfirm}
                disabled={!date || !time || loading}
                className="w-full h-[45px] text-white bg-[#E46B64] rounded-[100px]"

              >

                {loading ? "Saving... " : "Schedule Follow-up"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
