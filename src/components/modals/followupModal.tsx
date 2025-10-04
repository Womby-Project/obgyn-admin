import { useEffect, useMemo, useState } from "react"
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
import { CalendarIcon, Clock, Search, Filter } from "lucide-react"
import { format, addMinutes, startOfToday, isBefore, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { supabase } from "@/lib/supabaseClient"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"

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

// helper to generate 30-min slots (kept as-is)
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

  // ---- Time picker UI filters (presentational only) ----
  const [timeQuery, setTimeQuery] = useState("")
  const [ampm, setAmpm] = useState<"ALL" | "AM" | "PM">("ALL")

  const times = useMemo(() => generateTimes(30), [])
  const filteredTimes = useMemo(() => {
    const q = timeQuery.trim().toLowerCase()
    return times.filter((t) => {
      const isAM = t.toLowerCase().includes("am")
      if (ampm === "AM" && !isAM) return false
      if (ampm === "PM" && isAM) return false
      if (!q) return true
      return t.toLowerCase().includes(q)
    })
  }, [times, timeQuery, ampm])

  // Group by time-of-day for a nicer list
  const groups = useMemo(() => {
    const morning: string[] = []
    const afternoon: string[] = []
    const evening: string[] = []
    for (const t of filteredTimes) {
      const [hm, mer] = t.split(" ")
      const hour = parseInt(hm.split(":")[0], 10)
      const isPM = (mer || "").toLowerCase() === "pm"
      const hour24 = isPM ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour)
      if (hour24 < 12) morning.push(t)
      else if (hour24 < 18) afternoon.push(t)
      else evening.push(t)
    }
    return { morning, afternoon, evening }
  }, [filteredTimes])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setDate(undefined)
      setTime("")
      setReason("")
      setTimeQuery("")
      setAmpm("ALL")
    }
  }, [open])

  // parse "hh:mm AM/PM" back to hours/minutes
  const parseTimeToHM = (label: string) => {
    const [hm, suffixRaw] = label.split(" ")
    const [hStr, mStr] = hm.split(":")
    const isPM = (suffixRaw || "").toLowerCase().includes("pm")
    let h = parseInt(hStr, 10)
    const m = parseInt(mStr, 10)
    if (isPM && h < 12) h += 12
    if (!isPM && h === 12) h = 0
    return { h, m }
  }

  const quickSet = (minutesFromNow: number) => {
    const base = new Date()
    const d = addMinutes(base, minutesFromNow)
    setDate(d)
    const label = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    setTime(label)
    toast.message(`Set to ${format(d, "PPP")} • ${label}`)
  }

  const quickDate = (which: "today" | "tomorrow" | "nextweek") => {
    const d =
      which === "today"
        ? new Date()
        : which === "tomorrow"
        ? addDays(new Date(), 1)
        : addDays(new Date(), 7)
    setDate(d)
    toast.message(`Date set to ${format(d, "PPP")}`)
  }

  const handleConfirm = async () => {
    if (!appointment) return

    if (!date) {
      toast.warning("Please select a follow-up date.")
      return
    }
    if (!time) {
      toast.warning("Please select a follow-up time.")
      return
    }

    // Build datetime from selected date + time (logic unchanged)
    const { h, m } = parseTimeToHM(time)
    const followUpDate = new Date(date)
    followUpDate.setHours(h, m, 0, 0)

    // Optional guard: prevent past datetime
    if (isBefore(followUpDate, new Date())) {
      toast.warning("Follow-up must be in the future.")
      return
    }

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

      toast.success("Follow-up scheduled successfully.")
      if (onConfirm && followup) onConfirm(followup)
      onClose()
    } catch (err: any) {
      console.error("❌ Error scheduling follow-up:", err)
      toast.error(err?.message || "Something went wrong while scheduling the follow-up.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-white border-gray-200 max-w-md rounded-2xl shadow-lg max-h-[92vh] overflow-hidden">
        <DialogHeader className="sticky top-0 z-10 bg-white pt-6">
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Schedule Follow-up Checkup
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Set the date, time, and reason for the patient’s follow-up appointment.
          </DialogDescription>
        </DialogHeader>

        {appointment && (
          <div className="space-y-6 mt-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(92vh - 120px)" }}>
            {/* Current Appointment Info */}
            <div className="rounded-lg border border-gray-100 p-3 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">Current Appointment</h2>
              <p className="text-xs text-gray-600">{appointment.date} • {appointment.time}</p>
              <p className="text-xs text-gray-600">Patient: {appointment.patient}</p>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">Follow-up Date</Label>
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
                  className="p-0 w-[320px] rounded-xl bg-white border border-gray-200 shadow-md overflow-hidden"
                  align="center"
                  side="top"
                  sideOffset={-150}
                >
                  {/* Sticky header with quick actions */}
                  <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Filter className="h-3.5 w-3.5" /> Quick dates
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" className="h-7 px-2 text-xs" onClick={() => quickDate("today")}>Today</Button>
                        <Button variant="secondary" className="h-7 px-2 text-xs" onClick={() => quickDate("tomorrow")}>Tomorrow</Button>
                        <Button variant="secondary" className="h-7 px-2 text-xs" onClick={() => quickDate("nextweek")}>Next week</Button>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable calendar */}
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (!d) return
                        setDate(d)
                        setCalendarOpen(false)
                      }}
                      captionLayout="dropdown"  // month + year dropdowns
                      fromYear={new Date().getFullYear() - 5}
                      toYear={new Date().getFullYear() + 2}
                      disabled={(d) => d < startOfToday()}
                      className="rounded-md"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker (centered popover) */}
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium">Follow-up Time</Label>
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
                  className="w-[92vw] max-w-[360px] border border-gray-200 rounded-xl shadow-lg bg-white p-0"
                  align="center"          // centered under trigger
                  side="top"
                  sideOffset={-150}
                  avoidCollisions={false} // don't auto-shift from center
                >
                  {/* Sticky controls */}
                  <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-gray-500">Quick set</div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 text-xs"
                          onClick={() => { quickSet(30); setTimeOpen(false) }}
                        >
                          +30m
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 text-xs"
                          onClick={() => { quickSet(60); setTimeOpen(false) }}
                        >
                          +1h
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 text-xs"
                          onClick={() => { quickSet(120); setTimeOpen(false) }}
                        >
                          +2h
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search times (e.g., 09:00, PM)"
                          value={timeQuery}
                          onChange={(e) => setTimeQuery(e.target.value)}
                          className="pl-8 h-9"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant={ampm === "ALL" ? "default" : "secondary"}
                          className="h-8 text-xs"
                          onClick={() => setAmpm("ALL")}
                        >
                          All
                        </Button>
                        <Button
                          type="button"
                          variant={ampm === "AM" ? "default" : "secondary"}
                          className="h-8 text-xs"
                          onClick={() => setAmpm("AM")}
                        >
                          AM
                        </Button>
                        <Button
                          type="button"
                          variant={ampm === "PM" ? "default" : "secondary"}
                          className="h-8 text-xs"
                          onClick={() => setAmpm("PM")}
                        >
                          PM
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable grouped list */}
                  <div className="max-h-[60vh] overflow-y-auto">
                    <Section
                      title="Morning"
                      items={groups.morning}
                      selected={time}
                      onSelect={(t) => { setTime(t); setTimeOpen(false) }}
                    />
                    <Section
                      title="Afternoon"
                      items={groups.afternoon}
                      selected={time}
                      onSelect={(t) => { setTime(t); setTimeOpen(false) }}
                    />
                    <Section
                      title="Evening"
                      items={groups.evening}
                      selected={time}
                      onSelect={(t) => { setTime(t); setTimeOpen(false) }}
                    />
                    {filteredTimes.length === 0 && (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        No time slots match your filter.
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">Reason for Follow-up</Label>
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
              className="w-full h-11 text-white bg-[#E46B64] hover:bg-[#d95b54] rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Schedule Follow-up"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** ---------- Small UI helper for grouped time sections ---------- */
function Section({
  title,
  items,
  selected,
  onSelect,
}: {
  title: string
  items: string[]
  selected: string
  onSelect: (t: string) => void
}) {
  if (!items.length) return null
  return (
    <div>
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur border-y border-gray-100 px-3 py-1 text-[11px] text-gray-500">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-1 p-2">
        {items.map((t) => (
          <button
            key={t}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
              selected === t && "bg-gray-100"
            )}
            onClick={() => onSelect(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
