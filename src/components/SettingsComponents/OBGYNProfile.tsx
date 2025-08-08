import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

type FormDataType = {
    firstName: string;
    lastName: string;
    gender: string;
    dob: Date | undefined;
    email: string;
    phone: string;
    education: string;
    affiliatedHospitals: string;
};

type EditModeType = Record<keyof FormDataType, boolean>;

export default function OBGYNPRofile() {
    const [formData, setFormData] = useState<FormDataType>({
        firstName: "John",
        lastName: "Doe",
        gender: "",
        dob: undefined,
        email: "john.doe@email.com",
        phone: "09123456789",
        education: "MD",
        affiliatedHospitals: "St. Luke's Medical Center",
    });

    const [editMode, setEditMode] = useState<EditModeType>({
        firstName: false,
        lastName: false,
        gender: false,
        dob: false,
        email: false,
        phone: false,
        education: false,
        affiliatedHospitals: false,
    });

    const handleChange = <K extends keyof FormDataType>(
        field: K,
        value: FormDataType[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleEdit = <K extends keyof EditModeType>(field: K) => {
        setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));
    };


    return (
        <div className="flex flex-col gap-6">
            {/* Avatar + Buttons */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Avatar className="w-32 h-32 sm:w-50 sm:h-50">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>TA</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 items-center sm:items-start mt-4 sm:mt-[60px] sm:ml-13">
                    <button className="bg-[#E46B64] text-white w-[147px] h-[38px] rounded-sm hover:shadow-md">
                        Upload New
                    </button>
                    <button className="bg-white border border-[#DBDEE2] text-[#6B7280] w-[147px] h-[38px] rounded-sm hover:shadow-md">
                        Remove Photo
                    </button>
                </div>
            </div>

            <Separator className="text-black" />

            <h1 className="font-lato text-[15px] text-gray-500 mb-0 uppercase font-semibold">
                Personal Information
            </h1>

            {/* First Name */}
            <div className="w-full sm:w-[456px] mt-[-14px] px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[17px] font-lato text-gray-700">First Name</p>
                    <button
                        onClick={() => toggleEdit("firstName")}
                        className="text-[17px] font-lato text-[#E46B64] hover:underline"
                    >
                        {editMode.firstName ? "Save" : "Edit"}
                    </button>
                </div>
                <input
                    type="text"
                    value={formData.firstName}
                    readOnly={!editMode.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className={`border-b w-full text-[16px] font-lato px-2 py-1 rounded-sm transition duration-200
                                        ${editMode.firstName
                            ? "bg-white border-gray-300 text-gray-700 focus:outline-none focus:border-[#E46B64]"
                            : "border-gray-300 text-gray-500 cursor-default"
                        }`}
                />
            </div>

            {/* Last Name */}
            <div className="w-full sm:w-[456px] mt-[-14px] px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[17px] font-lato text-gray-700">Last Name</p>
                    <button
                        onClick={() => toggleEdit("lastName")}
                        className="text-[17px] font-lato text-[#E46B64] hover:underline"
                    >
                        {editMode.lastName ? "Save" : "Edit"}
                    </button>
                </div>
                <input
                    type="text"
                    value={formData.lastName}
                    readOnly={!editMode.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className={`border-b w-full text-[16px] font-lato px-2 py-1 rounded-sm transition duration-200
                                        ${editMode.lastName
                            ? "bg-white border-gray-300 text-gray-700 focus:outline-none focus:border-[#E46B64]"
                            : "border-gray-300 text-gray-500 cursor-default"
                        }`}
                />
            </div>

            {/* Gender */}
            <div className="w-full sm:w-[456px] mt-[-14px] px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[17px] font-lato text-gray-700">Gender</p>
                    <button
                        onClick={() => toggleEdit("gender")}
                        className="text-[17px] font-lato text-[#E46B64] hover:underline"
                    >
                        {editMode.gender ? "Save" : "Edit"}
                    </button>
                </div>
                <select
                    disabled={!editMode.gender}
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="w-full text-[16px] font-lato px-1 py-2 pr-8 rounded-sm border-b border-gray-300 text-gray-700 focus:outline-none focus:border-[#E46B64] appearance-none transition"
                >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Date of Birth */}
            <div className="w-full sm:w-[456px] mt-[-14px] px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[17px] font-lato text-gray-700">Date of Birth</p>
                    <button
                        onClick={() => toggleEdit("dob")}
                        className="text-[17px] font-lato text-[#E46B64] hover:underline"
                    >
                        {editMode.dob ? "Save" : "Edit"}
                    </button>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            disabled={!editMode.dob}
                            className={`relative w-full flex items-center justify-between text-left text-[16px] font-lato px-1 py-2 border-b border-gray-300 rounded-sm transition
                                                ${!formData.dob ? "text-gray-400" : "text-gray-700"}`}
                        >
                            {formData.dob ? format(formData.dob, "PPP") : <span>Select Date</span>}
                            <CalendarIcon className="h-4 w-4 text-gray-400 absolute right-1" />
                        </button>
                    </PopoverTrigger>
                    {editMode.dob && (
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={formData.dob}
                                onSelect={(date) => handleChange("dob", date)}
                                disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                }
                            />
                        </PopoverContent>
                    )}
                </Popover>
            </div>

            {/* Contact Information */}
            <h1 className="font-lato text-[15px] text-gray-500 mb-0 uppercase mt-5 font-semibold">
                Contact Information
            </h1>

            {/* Email */}
            <div className="w-full sm:w-[456px] mt-[-14px] px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[17px] font-lato text-gray-700">Email Address</p>
                    <button
                        onClick={() => toggleEdit("email")}
                        className="text-[17px] font-lato text-[#E46B64] hover:underline"
                    >
                        {editMode.email ? "Save" : "Edit"}
                    </button>
                </div>
                <input
                    type="email"
                    value={formData.email}
                    readOnly={!editMode.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={`border-b w-full text-[16px] font-lato px-2 py-1 rounded-sm transition duration-200
                                        ${editMode.email
                            ? "bg-white border-gray-300 text-gray-700 focus:outline-none focus:border-[#E46B64]"
                            : "border-gray-300 text-gray-500 cursor-default"
                        }`}
                />
            </div>

            {/* Phone Number */}
            <div className="w-full sm:w-[456px] mt-[-14px] px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[17px] font-lato text-gray-700">Phone Number</p>
                    <button
                        onClick={() => toggleEdit("phone")}
                        className="text-[17px] font-lato text-[#E46B64] hover:underline"
                    >
                        {editMode.phone ? "Save" : "Edit"}
                    </button>
                </div>
                <input
                    type="tel"
                    value={formData.phone}
                    readOnly={!editMode.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className={`border-b w-full text-[16px] font-lato px-2 py-1 rounded-sm transition duration-200
                                        ${editMode.phone
                            ? "bg-white border-gray-300 text-gray-700 focus:outline-none focus:border-[#E46B64]"
                            : "border-gray-300 text-gray-500 cursor-default"
                        }`}
                />
            </div>

            {/* Education and Work */}
            <h1 className="font-lato text-[15px] text-gray-500 mb-0 uppercase mt-5 font-semibold">
                Education and Work
            </h1>

            {/* Education */}
            <div className="w-full sm:w-[456px] mt-[-14px] px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[17px] font-lato text-gray-700">Education</p>
                    <button
                        onClick={() => toggleEdit("education")}
                        className="text-[17px] font-lato text-[#E46B64] hover:underline"
                    >
                        {editMode.education ? "Save" : "Edit"}
                    </button>
                </div>
                <input
                    type="text"
                    value={formData.education}
                    readOnly={!editMode.education}
                    onChange={(e) => handleChange("education", e.target.value)}
                    className={`border-b w-full text-[16px] font-lato px-2 py-1 rounded-sm transition duration-200
                                        ${editMode.education
                            ? "bg-white border-gray-300 text-gray-700 focus:outline-none focus:border-[#E46B64]"
                            : "border-gray-300 text-gray-500 cursor-default"
                        }`}
                />
            </div>

            {/* Affiliated Hospitals */}
            <div className="w-full sm:w-[456px] mt-[-14px] px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[17px] font-lato text-gray-700">Affiliated Hospitals/Clinics</p>
                    <button
                        onClick={() => toggleEdit("affiliatedHospitals")}
                        className="text-[17px] font-lato text-[#E46B64] hover:underline"
                    >
                        {editMode.affiliatedHospitals ? "Save" : "Edit"}
                    </button>
                </div>
                <input
                    type="text"
                    value={formData.affiliatedHospitals}
                    readOnly={!editMode.affiliatedHospitals}
                    onChange={(e) => handleChange("affiliatedHospitals", e.target.value)}
                    className={`border-b w-full text-[16px] font-lato px-2 py-1 rounded-sm transition duration-200
                                        ${editMode.affiliatedHospitals
                            ? "bg-white border-gray-300 text-gray-700 focus:outline-none focus:border-[#E46B64]"
                            : "border-gray-300 text-gray-500 cursor-default"
                        }`}
                />
            </div>
        </div>
    )
}