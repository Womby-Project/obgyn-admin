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
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Clock, Search, Filter } from "lucide-react"
import { format, addDays } from "date-fns"
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

type RescheduleDialogProps = {
  open: boolean
  onClose: () => void
  appointment?: AppointmentUIRow
  onConfirm?: (newDateTime: Date) => void
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

export default function RescheduleDialog({
  open,
  onClose,
  appointment,
  onConfirm,
}: RescheduleDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [time, setTime] = useState<string>("")
  const [timeOpen, setTimeOpen] = useState(false)

  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  // ----- UI-only helpers for the time list (does NOT change logic) -----
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

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setDate(undefined)
      setTime("")
      setReason("")
      setTimeQuery("")
      setAmpm("ALL")
    }
  }, [open]) // 👈 always exactly one dependency

  const handleConfirm = async () => {
    if (!appointment || !date || !time) return

    const [hours, minutes] = time.split(":")
    const isPM = time.toLowerCase().includes("pm")
    let h = parseInt(hours, 10)
    let m = parseInt(minutes, 10)

    if (isPM && h < 12) h += 12
    if (!isPM && h === 12) h = 0

    const newDate = new Date(date)
    newDate.setHours(h, m, 0, 0)

    try {
      setLoading(true)

      // 1. Get logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw userError || new Error("No logged in user found")

      let actorId: string | null = null

      // 2. Check if user is an obgyn
      const { data: obgynData } = await supabase
        .from("obgyn_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle()

      if (obgynData) {
        actorId = obgynData.id
      } else {
        // 3. Else check if user is a secretary
        const { data: secretaryData } = await supabase
          .from("secretary_users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle()

        if (secretaryData) actorId = secretaryData.id
        console.log("actorId resolved as:", actorId, "from user.id:", user.id)
      }

      if (!actorId) throw new Error("User not found in obgyn_users or secretary_users")

      // 4. Update appointment
      const { data, error } = await supabase
        .from("appointments")
        .update({
          original_datetime: appointment.dateTime,  // keep the old datetime
          status: "Rescheduled",
          reschedule_reason: reason || null,
          last_updated_by: actorId,
          appointment_datetime: newDate.toISOString(),          // new datetime
        })
        .eq("id", appointment.id)
        .select()   // 👈 force return of updated row

      console.log("Update result:", { data, error })
      if (error) throw error

      if (onConfirm) onConfirm(newDate)
      onClose()
    } catch (err) {
      console.error("Error rescheduling appointment:", err)
    } finally {
      setLoading(false)
    }
  }

  // Quick date actions (UI sugar only, does not change confirm logic)
  const quickDate = (which: "today" | "tomorrow" | "nextweek") => {
    const d =
      which === "today"
        ? new Date()
        : which === "tomorrow"
        ? addDays(new Date(), 1)
        : addDays(new Date(), 7)
    setDate(d)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-white border-gray-300 rounded-2xl shadow-lg max-w-md max-h-[92vh] overflow-hidden">
        <DialogHeader className="sticky top-0 z-10 bg-white pt-8">
          <DialogTitle className="text-lg font-semibold">Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Modify the scheduled date and time for this appointment.
          </DialogDescription>
        </DialogHeader>

        {appointment && (
          <div className="space-y-5 overflow-y-auto pr-1" style={{ maxHeight: "calc(92vh - 120px)" }}>
            {/* Original Info */}
            <div className="flex flex-col rounded-lg border border-gray-100 p-3 bg-gray-50">
              <h1 className="text-sm font-medium">Original Appointment</h1>
              <p className="text-[#616161] text-[12px]">
                {appointment.date} • {appointment.time}
              </p>
              <p className="text-[#616161] text-[12px] ">
                Name: {appointment.patient}
              </p>
            </div>

            {/* New Date Picker */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="date" className="px-1">
                <div className="text-[15px] font-lato">New Appointment Date</div>
              </Label>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className={cn(
                      "w-full justify-between text-left font-normal h-[45px] border border-[#ECEEF0] rounded-lg",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, "PPP") : <span>Pick a new date</span>}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-90" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-[320px] p-0 border border-gray-300 rounded-xl shadow-md bg-white overflow-hidden"
                  align="center"
                  side="top"
                  sideOffset={-150}
                >
                  {/* Sticky header with quick dates */}
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

                  {/* Scrollable calendar with easy month/year change */}
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate)
                        setCalendarOpen(false)
                      }}
                      captionLayout="dropdown"   // month + year dropdowns
                      fromYear={new Date().getFullYear() - 5}
                      toYear={new Date().getFullYear() + 2}
                      initialFocus
                      className="rounded-md"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* New Time Picker (centered, scrollable, grouped) */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="time" className="px-1">
                <div className="text-[15px] font-lato">New Appointment Time</div>
              </Label>

              <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="time"
                    className={cn(
                      "w-full justify-between text-left font-normal h-[45px] border border-[#ECEEF0] rounded-lg",
                      !time && "text-muted-foreground"
                    )}
                  >
                    {time || <span>Pick a new time</span>}
                    <Clock className="ml-2 h-4 w-4 opacity-90" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-[92vw] max-w-[360px] p-0 border border-gray-300 rounded-xl shadow-lg bg-white"
                  align="center"          // centered under trigger
                  side="top"
                  sideOffset={-150}
                  avoidCollisions={false} // don't auto-shift away from center
                >
                  {/* Sticky controls */}
                  <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-2 space-y-2">
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

                  {/* Scrollable grouped time list */}
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="reason" className="px-1">
                <div className="text-[15px] font-lato">Reason for Rescheduling</div>
              </Label>
              <Input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for schedule"
                className="h-[45px] border border-[#ECEEF0] rounded-lg"
              />
            </div>

            {/* Confirm Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleConfirm}
                disabled={!date || !time || loading}
                className="w-full h-[45px] text-white bg-[#E46B64] rounded-[100px]"
              >
                {loading ? "Saving..." : "Update Schedule"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** ---------- Small UI helper for grouped time sections (visual only) ---------- */
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
