import { useNavigate, useOutletContext } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type StepContext = { step: number; totalSteps: number };

const daysOfWeek = [
    { id: "sun", label: "S" },
    { id: "mon", label: "M" },
    { id: "tue", label: "T" },
    { id: "wed", label: "W" },
    { id: "thu", label: "Th" },
    { id: "fri", label: "F" },
    { id: "sat", label: "S" }
];


export default function SetSchedul() {
    const navigate = useNavigate();
    const { step, totalSteps } = useOutletContext<StepContext>();

    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState([{ from: "", to: "" }]);

    const toggleDay = (dayId: string) => {
        setSelectedDays(prev =>
            prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
        );
    };

    const updateTimeSlot = (index: number, field: "from" | "to", value: string) => {
        const updated = [...timeSlots];
        updated[index][field] = value;
        setTimeSlots(updated);
    };

    const addTimeSlot = () => {
        setTimeSlots([...timeSlots, { from: "", to: "" }]);
    };

    return (
        <div className="flex flex-col">
            <p className="text-[12px] text-[#616161] uppercase">
                Step {step} out of {totalSteps}
            </p>
            <h1 className="text-[40px] font-bold text-[#E46B64] font-lato">
                Availability Setup
            </h1>
            <p className="text-[17px] text-[#616161] ">
                Set your availability so patients can schedule appointments that work for you.
            </p>

            <p className="text-[17px] text-[#616161] mt-5 ">
                Available on
            </p>

            {/* Day Chooser */}
            <div className="flex gap-5 flex-wrap mt-5 w-[362px]">
                {daysOfWeek.map(day => (
                    <Button
                        key={day.id}
                        type="button"
                        variant={selectedDays.includes(day.id) ? "default" : "outline"}
                        className={`rounded-full w-8 h-8 border bg-[#E5E7EB] border-gray-200 shadow-none cursor-pointer hover:shadow-md ${selectedDays.includes(day.id) ? "bg-[#E46B64] text-white" : ""}`}
                        onClick={() => toggleDay(day.id)}
                    >
                        {day.label}
                    </Button>
                ))}
            </div>

            {/* Time Slots */}
            <div className="mt-5 space-y-3 w-[362px]">
                {timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-3">

                        {/* From Time */}
                        <div className="w-full">
                            <Select
                                value={slot.from}
                                onValueChange={(value) => updateTimeSlot(index, "from", value)}
                            >
                                <SelectTrigger className="w-full h-[42px] border border-gray-300 rounded-lg pl-3 pr-3 text-sm hover:border-gray-400 transition-colors">
                                    <SelectValue placeholder="From" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 24 * 2 }).map((_, i) => {
                                        const hour24 = Math.floor(i / 2);
                                        const minute = i % 2 === 0 ? "00" : "30";
                                        const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
                                        const ampm = hour24 < 12 ? "AM" : "PM";
                                        const displayTime = `${hour12}:${minute} ${ampm}`;
                                        return (
                                            <SelectItem key={displayTime} value={displayTime}>
                                                {displayTime}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* To Time */}
                        <div className="w-full">
                            <Select
                                value={slot.to}
                                onValueChange={(value) => updateTimeSlot(index, "to", value)}
                            >
                                <SelectTrigger className="w-full h-[42px] border border-gray-300 rounded-lg pl-3 pr-3 text-sm hover:border-gray-400 transition-colors">
                                    <SelectValue placeholder="To" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 24 * 2 }).map((_, i) => {
                                        const hour24 = Math.floor(i / 2);
                                        const minute = i % 2 === 0 ? "00" : "30";
                                        const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
                                        const ampm = hour24 < 12 ? "AM" : "PM";
                                        const displayTime = `${hour12}:${minute} ${ampm}`;
                                        return (
                                            <SelectItem key={displayTime} value={displayTime}>
                                                {displayTime}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Time Slot Button */}
            <Button variant="outline" className="mt-3 w-fit h-[45px] text-[15px] text-[#E46B64] w-[362px] border border-[#E46B64] bg-[#FFFFFF] " onClick={addTimeSlot}>
                +  Add a time slot
            </Button>

            {/* Note */}

            <div className="mt-2">
                <p className="italic text-[11px] ">You can add more schedule later in your profile!</p>
            </div>


            {/* Continue Button */}
            <button
                onClick={() => navigate("/setschedule")} // Change to actual step 4 route
                className="bg-[#E46B64] border border-[#E46B64] w-[362px] h-[45px] rounded-md mt-5 text-[#FFFFFF] hover:shadow-md cursor-pointer"
            >
                Continue
            </button>
        </div>
    );
}
