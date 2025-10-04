import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { CalendarDays, Clock, Plus, Pencil, Trash2 } from "lucide-react"

// Store both short label and full name
const daysOfWeek = [
  { short: "Su", full: "Sunday" },
  { short: "M", full: "Monday" },
  { short: "T", full: "Tuesday" },
  { short: "W", full: "Wednesday" },
  { short: "Th", full: "Thursday" },
  { short: "F", full: "Friday" },
  { short: "Sa", full: "Saturday" },
];

// ✅ Convert "HH:mm" to "hh:mm AM/PM"
const formatTime12Hr = (time24: string) => {
  if (!time24) return ""
  const [hours, minutes] = time24.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes)
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

export default function OBGYNAvailability() {
  const [scheduleName, setScheduleName] = useState("")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [fromTime, setFromTime] = useState("")
  const [toTime, setToTime] = useState("")
  const [schedules, setSchedules] = useState<any[]>([])
  const [draftSchedules, setDraftSchedules] = useState<any[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [, setUserId] = useState<string | null>(null)
  const [obgynId, setObgynId] = useState<string | null>(null)

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser()
        if (authError) throw new Error(authError.message)

        const authId = auth?.user?.id
        if (!authId) return
        setUserId(authId)

        const { data: obgynUser, error: obgynError } = await supabase
          .from("obgyn_users")
          .select("id")
          .eq("id", authId)
          .single()

        if (obgynError) throw new Error(obgynError.message)

        const obgynId = obgynUser.id
        setObgynId(obgynId)

        const { data, error } = await supabase
          .from("obgyn_availability")
          .select("*")
          .eq("obgyn_id", obgynId)

        if (error) throw new Error(error.message)

        if (data) {
          const grouped: Record<string, any> = {}
          data.forEach((row) => {
            const key = `${row.schedule_name}-${row.time_from}-${row.time_to}`
            if (!grouped[key]) {
              grouped[key] = {
                ids: [],
                name: row.schedule_name,
                days: [],
                from: row.time_from,
                to: row.time_to,
              }
            }
            grouped[key].days.push(row.day_of_week)
            grouped[key].ids.push(row.id)
          })
          setSchedules(Object.values(grouped))
          setDraftSchedules(Object.values(grouped))
        }
      } catch (err: any) {
        toast.error(`Error fetching schedules: ${err.message}`)
      }
    }
    fetchSchedules()
  }, [])

  const resetForm = () => {
    setScheduleName("")
    setSelectedDays([])
    setFromTime("")
    setToTime("")
    setEditingIndex(null)
  }

  const handleAddOrUpdate = () => {
    if (!scheduleName || selectedDays.length === 0 || !fromTime || !toTime) {
      toast.warning("Please complete all fields before saving.")
      return
    }

    const newSchedule = { name: scheduleName, days: selectedDays, from: fromTime, to: toTime }

    if (editingIndex !== null) {
      const updated = [...draftSchedules]
      updated[editingIndex] = newSchedule
      setDraftSchedules(updated)
      toast.success("Draft Save Successfully")
    } else {
      setDraftSchedules([...draftSchedules, newSchedule])
      toast.success("Schedule added to draft.")
    }

    resetForm()
    setOpen(false)
  }

  const handleEdit = (index: number) => {
    const s = draftSchedules[index]
    setScheduleName(s.name)
    setSelectedDays(s.days)
    setFromTime(s.from)
    setToTime(s.to)
    setEditingIndex(index)
    setOpen(true)
  }

  const handleDelete = async (scheduleIndex: number) => {
    const schedule = schedules[scheduleIndex]
    if (!schedule || !schedule.ids?.length) return

    try {
      const { error } = await supabase
        .from("obgyn_availability")
        .delete()
        .in("id", schedule.ids)

      if (error) throw new Error(error.message)

      const updated = schedules.filter((_, i) => i !== scheduleIndex)
      setSchedules(updated)
      setDraftSchedules(updated)
      toast.success("Schedule deleted successfully.")
    } catch (err: any) {
      toast.error(`Error deleting schedule: ${err.message}`)
    }
  }

  const handleDiscard = () => {
    setDraftSchedules(schedules)
    resetForm()
    setOpen(false)
    toast.info("Changes discarded.")
  }

  const handleSaveChanges = async () => {
    if (!obgynId) {
      toast.error("No obgynId found, cannot save.")
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from("obgyn_availability")
        .delete()
        .eq("obgyn_id", obgynId)

      if (deleteError) throw new Error(deleteError.message)

      const newRows = draftSchedules.flatMap((s) =>
        s.days.map((day: string) => ({
          obgyn_id: obgynId,
          schedule_name: s.name,
          day_of_week: day,
          time_from: s.from,
          time_to: s.to,
        }))
      )

      if (newRows.length === 0) {
        setSchedules([])
        setDraftSchedules([])
        setOpen(false)
        toast.success("All schedules removed.")
        return
      }

      const { error: insertError } = await supabase
        .from("obgyn_availability")
        .insert(newRows)

      if (insertError) throw new Error(insertError.message)

      toast.success("Schedule saved!")
      setOpen(false)

      const { data, error: fetchError } = await supabase
        .from("obgyn_availability")
        .select("*")
        .eq("obgyn_id", obgynId)

      if (fetchError) throw new Error(fetchError.message)

      if (data) {
        const grouped: Record<string, any> = {}
        data.forEach((row) => {
          const key = `${row.schedule_name}-${row.time_from}-${row.time_to}`
          if (!grouped[key]) {
            grouped[key] = {
              ids: [],
              name: row.schedule_name,
              days: [],
              from: row.time_from,
              to: row.time_to,
            }
          }
          grouped[key].days.push(row.day_of_week)
          grouped[key].ids.push(row.id)
        })
        setSchedules(Object.values(grouped))
        setDraftSchedules(Object.values(grouped))
      }
    } catch (err: any) {
      toast.error(`Error saving schedules: ${err.message}`)
    }
  }

  return (
    <div className="flex flex-col max-w-full px-4 md:px-8 lg:px-0">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[24px] font-semibold text-gray-900 tracking-tight">Schedules</h1>
        <p className="text-[13px] text-gray-500">Manage your clinic availability. Patients will only see saved schedules.</p>
      </div>

      {/* Schedules List */}
      <div className="max-w-2xl space-y-3">
        {draftSchedules.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center bg-white/70">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E46B64]/10 mb-2">
              <CalendarDays className="h-5 w-5 text-[#E46B64]" />
            </div>
            <p className="text-gray-700 font-medium">No schedules yet</p>
            <p className="text-sm text-gray-500">Add your first schedule to get started.</p>
          </div>
        )}

        {draftSchedules.map((s, i) => (
          <Card
            key={i}
            className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white/90"
          >
            <CardContent className="pt-5 p-5">
              {/* Title + Edit */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[16px] text-gray-900">{s.name}</p>
                  <p className="text-[12px] text-gray-500">Draft</p>
                </div>
                <button
                  onClick={() => handleEdit(i)}
                  className="inline-flex items-center gap-1 text-[#E46B64] hover:text-[#cf5b55] text-sm font-medium"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              </div>

              {/* Days */}
              <div className="mt-4 flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <div
                    key={day.full}
                    className={`h-9 px-3 rounded-full text-sm font-medium border transition ${
                      // NOTE: Keeping your exact logic reference (no logic change)
                      (s.days.includes(day as any) ? true : false)
                        ? "bg-[#E46B64] text-white border-[#E46B64]"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    <div className="h-full flex items-center justify-center">{day.short}</div>
                  </div>
                ))}
              </div>

              {/* Time range */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 p-3 bg-white">
                  <div className="text-[12px] text-gray-500 font-medium">From</div>
                  <div className="flex items-center gap-2 text-gray-800 mt-1">
                    <Clock className="h-4 w-4 text-[#E46B64]" />
                    <span className="text-[15px] font-semibold tracking-wide">
                      {formatTime12Hr(s.from)}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 p-3 bg-white">
                  <div className="text-[12px] text-gray-500 font-medium">To</div>
                  <div className="flex items-center gap-2 text-gray-800 mt-1">
                    <Clock className="h-4 w-4 text-[#E46B64]" />
                    <span className="text-[15px] font-semibold tracking-wide">
                      {formatTime12Hr(s.to)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add new slot button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-[44px] border border-[#E46B64] text-[#E46B64] hover:bg-[#E46B64] hover:text-white justify-center gap-2 rounded-xl mt-2"
              onClick={resetForm}
            >
              <Plus className="h-4 w-4" />
              Add New Schedule
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-5 border-b border-gray-200">
              <DialogTitle className="text-[17px] font-semibold text-gray-900">
                {editingIndex !== null ? "Edit Time Slot" : "Add a New Time Slot"}
              </DialogTitle>
            </DialogHeader>

            {/* Form Body */}
            <div className="space-y-6 p-5">
              <div className="space-y-2">
                <Label className="text-gray-700 text-sm">Name of Schedule</Label>
                <input
                  value={scheduleName}
                  onChange={e => setScheduleName(e.target.value)}
                  placeholder="e.g., Morning Clinic"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#E46B64]/30 focus:border-[#E46B64] placeholder:text-gray-400"
                />
              </div>

              <div>
                <Label className="block text-gray-700 text-sm mb-2">Days</Label>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.full}
                      type="button"
                      className={`h-9 px-3 rounded-full text-sm font-medium border transition ${
                        selectedDays.includes(day.full)
                          ? "bg-[#E46B64] text-white border-[#E46B64]"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                      }`}
                      onClick={() => toggleDay(day.full)}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-gray-700 mb-2 font-medium text-sm">From:</span>
                  <Input
                    type="time"
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                    className="rounded-lg border-gray-300 focus-visible:ring-[#E46B64] focus-visible:ring-2"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-700 mb-2 font-medium text-sm">To:</span>
                  <Input
                    type="time"
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    className="rounded-lg border-gray-300 focus-visible:ring-[#E46B64] focus-visible:ring-2"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                {editingIndex !== null && (
                  <Button
                    variant="outline"
                    className="flex-1 border border-red-500 text-red-600 hover:bg-red-50 rounded-xl gap-2"
                    onClick={() => {
                      handleDelete(editingIndex)
                      setOpen(false)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
                <Button
                  className="flex-1 bg-[#E46B64] hover:bg-[#d15b55] text-white rounded-xl"
                  onClick={handleAddOrUpdate}
                >
                  {editingIndex !== null ? "Update Schedule" : "Add to Schedule"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          className="border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
          onClick={handleDiscard}
        >
          Discard
        </Button>
        <Button
          className="bg-[#E46B64] hover:bg-[#d15b55] text-white rounded-xl"
          onClick={handleSaveChanges}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}
