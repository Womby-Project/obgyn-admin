import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { X } from "lucide-react"

const daysOfWeek = ["Su", "M", "T", "W", "Th", "F", "Sa"]

export default function OBGYNAvailability() {
    const [scheduleName, setScheduleName] = useState("")
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [fromTime, setFromTime] = useState("")
    const [toTime, setToTime] = useState("")
    const [schedules, setSchedules] = useState<any[]>([])
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [open, setOpen] = useState(false)

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        )
    }

    const resetForm = () => {
        setScheduleName("")
        setSelectedDays([])
        setFromTime("")
        setToTime("")
        setEditingIndex(null)
    }

    const handleAddOrUpdate = () => {
        if (!scheduleName || selectedDays.length === 0 || !fromTime || !toTime) return

        const newSchedule = { name: scheduleName, days: selectedDays, from: fromTime, to: toTime }

        if (editingIndex !== null) {
            const updated = [...schedules]
            updated[editingIndex] = newSchedule
            setSchedules(updated)
        } else {
            setSchedules([...schedules, newSchedule])
        }

        resetForm()
        setOpen(false)
    }

    const handleEdit = (index: number) => {
        const s = schedules[index]
        setScheduleName(s.name)
        setSelectedDays(s.days)
        setFromTime(s.from)
        setToTime(s.to)
        setEditingIndex(index)
        setOpen(true)
    }

    const handleDelete = (index: number) => {
        setSchedules(schedules.filter((_, i) => i !== index))
    }

    return (
        <div className="flex flex-col max-w-full px-4 md:px-8 lg:px-0">
            <h1 className="text-[20px] font-semibold text-gray-800 mb-6">Availability</h1>

            {/* Schedules List */}
            <div className="space-y-4 max-w-2xl ">
                {schedules.map((s, i) => (
                    <Card key={i}>
                        <CardContent className="flex flex-col gap-2 pt-4 border border-gray-400 rounded-sm p-3">
                            <div className="flex justify-between">
                                <p className="font-medium">{s.name}</p>
                                <button
                                    onClick={() => handleEdit(i)}
                                    className="text-[#E46B64] hover:underline"
                                >
                                    Edit
                                </button>
                            </div>
                            <div className="flex gap-7">
                                {daysOfWeek.map(day => (
                                    <div
                                        key={day}
                                        className={`w-10 h-10 flex items-center justify-center rounded-full text-sm mt-5 
                      ${s.days.includes(day) ? "bg-[#E46B64] text-white" : "bg-gray-200 text-gray-600"}`}
                                    >
                                        {day.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-10 text-sm text-gray-700 mt-5">
                                <div className="flex-1 border-0 border-b-2 border-gray-300 pb-1">
                                    <span className="block font-medium">From</span>
                                    {s.from}
                                </div>
                                <div className="flex-1 border-0 border-b-2 border-gray-300 pb-1">
                                    <span className="block font-medium">To</span>
                                    {s.to}
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
                            className="w-full h-[40px] border border-[#E46B64] text-[#E46B64] hover:bg-[#E46B64] hover:text-white justify-start "
                            onClick={resetForm}
                        >
                            + Add a new time slot
                        </Button>
                    </DialogTrigger>

                    {/* Modal */}
                    <DialogContent className="max-w-md rounded-2xl p-6 bg-white shadow-lg">
                        {/* Close button */}
                        <DialogClose asChild>

                        </DialogClose>

                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-800">
                                {editingIndex !== null ? "Edit Time Slot" : "Add a New Time Slot"}
                            </DialogTitle>
                        </DialogHeader>

                        {/* Form */}
                        <div className="space-y-6 mt-4">
                            {/* Schedule name */}
                            <div>
                                <Label className="text-gray-700 text-sm">Name of Schedule</Label>
                                <input
                                    value={scheduleName}
                                    onChange={e => setScheduleName(e.target.value)}
                                    placeholder="e.g., Morning Clinic"
                                    className="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-[#E46B64] pb-1"
                                />
                            </div>

                            {/* Days */}
                            <div className="flex justify-center gap-8">
                                {daysOfWeek.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        className={`w-10 h-10 rounded-full flex items-center justify-center 
                      ${selectedDays.includes(day) ? "bg-[#E46B64] text-white" : "bg-gray-200 text-gray-600"}`}
                                        onClick={() => toggleDay(day)}
                                    >
                                        {day.charAt(0)}
                                    </button>
                                ))}
                            </div>

                            {/* Time Range */}
                            <div className="flex gap-6 mt-6">
                                <div className="flex-1 flex flex-col">
                                    <span className="text-gray-700 mb-2 font-medium">From:</span>
                                    <Input
                                        type="time"
                                        value={fromTime}
                                        onChange={(e) => setFromTime(e.target.value)}
                                        className="w-full border-0 border-b border-gray-400"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <span className="text-gray-700 mb-2 font-medium">To:</span>
                                    <Input
                                        type="time"
                                        value={toTime}
                                        onChange={(e) => setToTime(e.target.value)}
                                        className="w-full border-0 border-b border-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Submit button */}
                            <Button
                                className="w-full bg-[#E46B64] hover:bg-[#d15b55] text-white"
                                onClick={handleAddOrUpdate}
                            >
                                {editingIndex !== null ? "Update Schedule" : "Add to Schedule"}
                            </Button>
                        </div>


                    </DialogContent>
                </Dialog>





            </div>

            {/* Future feature buttons */}
            <div className="flex justify-end gap-4 mt-4">
                <Button
                    variant="outline"
                    className="border border-gray-400 text-gray-700 hover:bg-gray-100"
                    onClick={() => setOpen(false)} // Discard closes modal
                >
                    Discard
                </Button>
                <Button
                    className="bg-[#E46B64] hover:bg-[#d15b55] text-white"
                    onClick={handleAddOrUpdate} // Save logic same as add/update for now
                >
                    Save Changes
                </Button>
            </div>
        </div>
    )
}
