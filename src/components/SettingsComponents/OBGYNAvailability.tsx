import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

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
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};


export default function OBGYNAvailability() {
  const [scheduleName, setScheduleName] = useState("")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [fromTime, setFromTime] = useState("")
  const [toTime, setToTime] = useState("")
  const [schedules, setSchedules] = useState<any[]>([])
  const [draftSchedules, setDraftSchedules] = useState<any[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
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
      <h1 className="text-[20px] font-semibold text-gray-800 ">Availability</h1>
      <Toaster position="top-right" />

      {/* Schedule List */}
      <div className="gap-0 max-w-2xl mt-0">
        {draftSchedules.map((s, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-2 pt-4 border border-gray-400 rounded-sm p-3">
              <div className="flex justify-between">
                <p className="font-medium">{s.name}</p>
                <button onClick={() => handleEdit(i)} className="text-[#E46B64] hover:underline">
                  Edit
                </button>
              </div>
              <div className="flex gap-7">
                {daysOfWeek.map(day => (
                  <div
                    key={day.full}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm mt-5 ${s.days.includes(day)
                        ? "bg-[#E46B64] text-white"
                        : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {day.short}
                  </div>
                ))}
              </div>
              <div className="flex gap-10 text-sm text-gray-700 mt-5">
                <div className="flex-1 border-0 border-b-2 border-gray-300 pb-1">
                  <span className="block font-medium">From</span>
                  {formatTime12Hr(s.from)}
                </div>
                <div className="flex-1 border-0 border-b-2 border-gray-300 pb-1">
                  <span className="block font-medium">To</span>
                  {formatTime12Hr(s.to)}
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
              className="w-full h-[40px] border border-[#E46B64] text-[#E46B64] hover:bg-[#E46B64] hover:text-white justify-start"
              onClick={resetForm}
            >
              + Add a new time slot
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md rounded-2xl p-6 bg-white shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-800">
                {editingIndex !== null ? "Edit Time Slot" : "Add a New Time Slot"}
              </DialogTitle>
            </DialogHeader>

            {/* Form */}
            <div className="space-y-6 mt-4">
              <div>
                <Label className="text-gray-700 text-sm">Name of Schedule</Label>
                <input
                  value={scheduleName}
                  onChange={e => setScheduleName(e.target.value)}
                  placeholder="e.g., Morning Clinic"
                  className="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-[#E46B64] pb-1"
                />
              </div>

              <div className="flex justify-center gap-8">
                {daysOfWeek.map(day => (
                  <button
                    key={day.full}
                    type="button"
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedDays.includes(day.full)
                        ? "bg-[#E46B64] text-white"
                        : "bg-gray-200 text-gray-600"
                      }`}
                    onClick={() => toggleDay(day.full)}
                  >
                    {day.short}
                  </button>
                ))}
              </div>

              <div className="flex gap-6 mt-6">
                <div className="flex-1 flex flex-col">
                  <span className="text-gray-700 mb-2 font-medium">From:</span>
                  <Input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-gray-700 mb-2 font-medium">To:</span>
                  <Input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-4">
                {editingIndex !== null && (
                  <Button
                    variant="outline"
                    className="flex-1 border border-red-500 text-red-500 hover:bg-red-50"
                    onClick={() => {
                      handleDelete(editingIndex)
                      setOpen(false)
                    }}
                  >
                    Delete
                  </Button>
                )}
                <Button className="flex-1 bg-[#E46B64] hover:bg-[#d15b55] text-white" onClick={handleAddOrUpdate}>
                  {editingIndex !== null ? "Update Schedule" : "Add to Schedule"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bottom buttons */}
      <div className="flex justify-end gap-4 mt-4">
        <Button variant="outline" className="border border-gray-400 text-gray-700 hover:bg-gray-100" onClick={handleDiscard}>
          Discard
        </Button>
        <Button className="bg-[#E46B64] hover:bg-[#d15b55] text-white" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
