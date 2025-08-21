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

    const times = generateTimes(30)

    // Reset when dialog opens/closes
    useEffect(() => {
        if (open && appointment) {
            setDate(appointment.dateTime)
            setTime(
                appointment.dateTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })
            )
        } else {
            setDate(undefined)
            setTime("")
            setReason("")
        }
    }, [appointment, open])

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


    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="bg-white border-gray-300">
                <DialogHeader>
                    <DialogTitle className="mt-8">Reschedule Appointment</DialogTitle>
                    <DialogDescription>
                        Modify the scheduled date and time for this appointment.
                    </DialogDescription>
                </DialogHeader>

                {appointment && (
                    <>
                        {/* Original Info */}
                        <div className="flex flex-col">
                            <h1 className="text-base font-medium">Original Appointment</h1>
                            <p className="text-[#616161] text-[15px]">
                                {appointment.date} at {appointment.time}
                            </p>
                            <p className="text-[#616161] text-[13px]">
                                Patient: {appointment.patient}
                            </p>
                        </div>

                        {/* New Date Picker */}
                        <div className="flex flex-col gap-3 mt-5">
                            <Label htmlFor="date" className="px-1">
                                <div className="text-[15px] font-lato">New Appointment Date</div>
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

                        {/* New Time Picker */}
                        <div className="flex flex-col gap-3 mt-3">
                            <Label htmlFor="time" className="px-1">
                                <div className="text-[15px] font-lato">New Appointment Time</div>
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
                                <div className="text-[15px] font-lato">Reason for Rescheduling</div>
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
                            >
                                {loading ? "Saving..." : "Confirm"}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
