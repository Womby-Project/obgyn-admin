import { useNavigate, useOutletContext } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

type StepContext = { step: number; totalSteps: number; formData: any };

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
    const { step, totalSteps, formData } = useOutletContext<StepContext>();

    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState([{ from: "", to: "" }]);
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async () => {
        if (selectedDays.length === 0 || timeSlots.some(slot => !slot.from || !slot.to)) {
            alert("Please select at least one day and complete all time slots.");
            return;
        }

        // ✅ Validate all NOT NULL fields before sending
        const requiredFields = [
            "first_name",
            "last_name",
            "gender",
            "prc_license_number",
            "accountInfo.email",
            "accountInfo.password"
        ];

        for (const field of requiredFields) {
            const keys = field.split(".");
            let value = formData;
            keys.forEach(k => { value = value?.[k]; });

            if (!value) {
                alert(`Please fill in the required field: ${field.replace("accountInfo.", "")}`);
                return;
            }
        }

        try {
            setLoading(true);

            // 1️⃣ Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.accountInfo?.email,
                password: formData.accountInfo?.password,
            });

            if (authError) {
                console.error("❌ Auth signup failed:", authError);
                alert("Failed to create account. Please check email and password.");
                return;
            }

            const userId = authData.user?.id;
            if (!userId) {
                console.error("❌ No user ID returned from Supabase Auth.");
                alert("Something went wrong creating the account.");
                return;
            }


            let prcIdUrl = formData.prc_id_document_url ?? null;

            if (formData.prc_id_file) {
                const file = formData.prc_id_file;
                const fileExt = file.name.split(".").pop();
                // remove invalid characters from PRC license number
                const sanitizedLicense = formData.prc_license_number.replace(/[^a-zA-Z0-9_-]/g, '');
                const fileName = `${Date.now()}_${sanitizedLicense}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("prc_ids")
                    .upload(fileName, file);

                if (uploadError) {
                    console.error("❌ Failed to upload PRC ID:", uploadError);
                    alert("Failed to upload PRC ID file.");
                    return;
                }

                const { data: publicUrlData } = supabase.storage
                    .from("prc_ids")
                    .getPublicUrl(fileName);

                prcIdUrl = publicUrlData.publicUrl;
            }


            // 2️⃣ Wait longer for replication to avoid FK error
            await new Promise(res => setTimeout(res, 1500));

            const obgynPayload = {
                id: userId,
                first_name: formData.first_name,
                last_name: formData.last_name,
                gender: formData.gender,
                email: formData.accountInfo.email,
                prc_license_number: formData.prc_license_number,
                affiliated_hospitals_clinics: formData.affiliated_hospitals_clinics ?? [],
                prc_id_document_url: prcIdUrl,
                phone_number: formData.phone_number ?? null,
                birth_date: formData.birth_date ?? null,
                education: formData.education ?? null,
                profile_picture_url: formData.profile_picture_url ?? null,
                two_factor_auth_enabled: false
            };

            // 4️⃣ Insert profile
            const { error: userError } = await supabase
                .from("obgyn_users")
                .insert([obgynPayload]);

            if (userError) {
                console.error("❌ Failed to insert obgyn_users:", userError);
                alert("Failed to save OB-GYN profile.");
                return;
            }

            // 5️⃣ Insert availability
            const availabilityRows = selectedDays.flatMap(day =>
                timeSlots.map(slot => ({
                    obgyn_id: userId,
                    day_of_week: day,
                    time_from: slot.from,
                    time_to: slot.to
                }))
            );

            const { error: availabilityError } = await supabase
                .from("obgyn_availability")
                .insert(availabilityRows);

            if (availabilityError) {
                console.error("❌ Failed to insert availability:", availabilityError);
                alert("Failed to save availability schedule.");
                return;
            }

            navigate("/finalpage");

        } catch (err) {
            console.error("❌ Unexpected error:", err);
            alert("Something went wrong while saving. Please try again.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="flex flex-col">
            <p className="text-[12px] text-[#616161] uppercase">
                Step {step} out of {totalSteps}
            </p>
            <h1 className="text-[40px] font-bold text-[#E46B64] font-lato">
                Availability Setup
            </h1>
            <p className="text-[17px] text-[#616161]">
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
            <Button
                variant="outline"
                className="mt-3 w-[362px] h-[45px] text-[15px] text-[#E46B64] border border-[#E46B64] bg-[#FFFFFF]"
                onClick={addTimeSlot}
            >
                + Add a time slot
            </Button>

            <div className="mt-2">
                <p className="italic text-[11px]">You can add more schedule later in your profile!</p>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#E46B64] border border-[#E46B64] w-[362px] h-[45px] rounded-md mt-5 text-[#FFFFFF] hover:shadow-md cursor-pointer disabled:opacity-50"
            >
                {loading ? "Saving..." : "Submit"}
            </button>
        </div>
    );
}
