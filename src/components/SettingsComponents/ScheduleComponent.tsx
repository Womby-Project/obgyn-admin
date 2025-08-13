import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function OBGYNAvailability() {
    const [scheduleName, setScheduleName] = useState("")
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [fromTime, setFromTime] = useState("")
    const [toTime, setToTime] = useState("")
    const [schedules, setSchedules] = useState<any[]>([])
    const [editingIndex, setEditingIndex] = useState<number | null>(null)

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        )
    }

    const handleAddOrUpdate = () => {
        if (!scheduleName || selectedDays.length === 0 || !fromTime || !toTime) return

        const newSchedule = { name: scheduleName, days: selectedDays, from: fromTime, to: toTime }

        if (editingIndex !== null) {
            const updated = [...schedules]
            updated[editingIndex] = newSchedule
            setSchedules(updated)
            setEditingIndex(null)
        } else {
            setSchedules([...schedules, newSchedule])
        }

        setScheduleName("")
        setSelectedDays([])
        setFromTime("")
        setToTime("")
    }

    const handleEdit = (index: number) => {
        const s = schedules[index]
        setScheduleName(s.name)
        setSelectedDays(s.days)
        setFromTime(s.from)
        setToTime(s.to)
        setEditingIndex(index)
    }

    const handleDelete = (index: number) => {
        setSchedules(schedules.filter((_, i) => i !== index))
    }

    return (
        <div className="flex flex-col gap-10 max-w-full px-4 md:px-8 lg:px-0">
            <div className="flex flex-col gap-6">
                <h1 className="text-[20px] font-semibold text-gray-800">
                    Availability
                </h1>
            </div>

            {/* Schedule Form */}
            <div className="space-y-6 max-w-xl">
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div>
                            <Label>Schedule Name</Label>
                            <Input value={scheduleName} onChange={e => setScheduleName(e.target.value)} placeholder="e.g., Morning Clinic" />
                        </div>

                        <div>
                            <Label>Select Days</Label>
                            <div className="flex gap-2 flex-wrap mt-2">
                                {daysOfWeek.map(day => (
                                    <Button
                                        key={day}
                                        type="button"
                                        variant={selectedDays.includes(day) ? "default" : "outline"}
                                        className={`rounded-full w-12 ${selectedDays.includes(day) ? "bg-blue-600 text-white" : ""}`}
                                        onClick={() => toggleDay(day)}
                                    >
                                        {day}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Time Range</Label>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <Input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} />
                                </div>
                                <span className="text-gray-500">to</span>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <Input type="time" value={toTime} onChange={e => setToTime(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleAddOrUpdate} className="w-full">
                            {editingIndex !== null ? "Update Schedule" : "Add Schedule"}
                        </Button>
                    </CardContent>
                </Card>

                {/* List of schedules */}
                {schedules.length > 0 && (
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {schedules.map((s, i) => (
                                <div key={i} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <p className="font-medium">{s.name}</p>
                                        <p className="text-sm text-gray-500">{s.days.join(", ")} | {s.from} - {s.to}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(i)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(i)}>Delete</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
