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
    if (!appointment || !date || !time) return

    // build datetime
    const [hours, minutes] = time.split(":")
    const isPM = time.toLowerCase().includes("pm")
    let h = parseInt(hours, 10)
    let m = parseInt(minutes, 10)
    if (isPM && h < 12) h += 12
    if (!isPM && h === 12) h = 0

    const followUpDate = new Date(date)
    followUpDate.setHours(h, m, 0, 0)

    try {
      setLoading(true)

      // Insert into followups
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
        .single()

      if (error) throw error

      // Update parent appointment
      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          status: "Accepted",
          appointment_datetime: followUpDate.toISOString(),
        })
        .eq("id", appointment.id)

      if (updateError) throw updateError

      if (onConfirm && followup) onConfirm(followup)
      onClose()
    } catch (err) {
      console.error("❌ Error scheduling follow-up:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-white border-gray-200 max-w-md rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="mt-6 text-xl font-semibold text-gray-800">
            Schedule Follow-up Checkup
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Set the date, time, and reason for the patient’s follow-up
            appointment.
          </DialogDescription>
        </DialogHeader>

        {appointment && (
          <div className="space-y-6 mt-4">
            {/* Current Appointment Info */}
            <div className="rounded-lg border border-gray-100 p-3 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                Current Appointment
              </h2>
              <p className="text-xs text-gray-600">
                {appointment.date} • {appointment.time}
              </p>
              <p className="text-xs text-gray-600">
                Patient: {appointment.patient}
              </p>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Follow-up Date
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className={cn(
                      "w-full justify-between text-left h-11 border border-gray-200 rounded-lg",
                      !date && "text-gray-400"
                    )}
                  >
                    {date ? format(date, "PPP") : "Pick a date"}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-80" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-44 max-h-64 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-md p-1"
                  align="start"       // ✅ aligns with trigger (not centered)
                  side="bottom"       // ✅ makes it act like a dropdown
                  sideOffset={4}      // ✅ small gap from the button
                  avoidCollisions={false}
                  onWheel={(e) => e.stopPropagation()}
                >
                  {times.map((t) => (
                    <button
                      key={t}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        setTime(t)
                        setTimeOpen(false)
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </PopoverContent>


              </Popover>
            </div>

            {/* Time Picker */}
            {/* Time Picker */}
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium">
                Follow-up Time
              </Label>
              <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="time"
                    className={cn(
                      "w-full justify-between text-left h-11 border border-gray-200 rounded-lg",
                      !time && "text-gray-400"
                    )}
                  >
                    {time || "Pick a time"}
                    <Clock className="ml-2 h-4 w-4 opacity-80" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-44 max-h-64 overflow-y-auto border border-gray-200 rounded-xl shadow-lg bg-white"
                  align="start"
                  side="bottom"
                  avoidCollisions={false}   // ✅ allow wheel scroll
                  onWheel={(e) => e.stopPropagation()} // ✅ make wheel scrolling work
                >
                  {times.map((t) => (
                    <div
                      key={t}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        setTime(t)
                        setTimeOpen(false)
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </div>


            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for Follow-up
              </Label>
              <Input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason"
                className="h-11 border border-gray-200 rounded-lg"
              />
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleConfirm}
              disabled={!date || !time || loading}
              className="w-full h-11 text-white bg-[#E46B64] hover:bg-[#d95b54] rounded-full transition"
            >
              {loading ? "Saving..." : "Schedule Follow-up"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
