"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { Toaster } from "../ui/sonner"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

type FormDataType = {
    firstName: string
    lastName: string
    gender: string
    dob: Date | undefined
    email: string
    phone: string
    profilePictureUrl?: string
}

type EditModeType = Record<keyof FormDataType, boolean>

export default function SecretaryEditProfile() {
    const [formData, setFormData] = useState<FormDataType>({
        firstName: "",
        lastName: "",
        gender: "",
        dob: undefined,
        email: "",
        phone: "",
        profilePictureUrl: "https://github.com/shadcn.png",
    })

    const [editMode, setEditMode] = useState<EditModeType>({
        firstName: false,
        lastName: false,
        gender: false,
        dob: false,
        email: false,
        phone: false,
        profilePictureUrl: false,
    })

    // 🔹 Fetch profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                toast.error("Not logged in")
                return
            }

            const { data, error } = await supabase
                .from("secretary_users")
                .select("*")
                .eq("id", user.id)
                .single()

            if (error) {
                toast.error("Error fetching profile")
                console.error(error)
                return
            }

            if (data) {
                setFormData({
                    firstName: data.first_name,
                    lastName: data.last_name,
                    gender: data.gender_type || "",
                    dob: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
                    email: data.email,
                    phone: data.phone_number || "",
                    profilePictureUrl: data.profile_picture_url || "https://github.com/shadcn.png",
                })
            }
        }

        fetchProfile()
    }, [])

    // 🔹 Local change handler
    const handleChange = <K extends keyof FormDataType>(field: K, value: FormDataType[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    // 🔹 Toggle edit
    const toggleEdit = <K extends keyof EditModeType>(field: K) => {
        setEditMode((prev) => ({ ...prev, [field]: !prev[field] }))
    }

    // 🔹 Save field to Supabase
    const saveField = async <K extends keyof FormDataType>(field: K) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("User not found")
            return
        }

        const updatePayload: any = {}
        if (field === "firstName") updatePayload.first_name = formData.firstName
        if (field === "lastName") updatePayload.last_name = formData.lastName
        if (field === "gender") updatePayload.gender_type = formData.gender
        if (field === "dob") updatePayload.date_of_birth = formData.dob?.toISOString()
        if (field === "email") updatePayload.email = formData.email
        if (field === "phone") updatePayload.phone_number = formData.phone
        if (field === "profilePictureUrl") updatePayload.profile_picture_url = formData.profilePictureUrl

        const { error } = await supabase.from("secretary_users").update(updatePayload).eq("id", user.id)

        if (error) {
            toast.error("Failed to save changes")
            console.error(error)
        } else {
            toast.success("Profile updated")
            toggleEdit(field)
        }
    }

    // 🔹 Upload new profile picture
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("User not found")
            return
        }

        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from("secretary_profiles")
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            toast.error("Upload failed")
            console.error(uploadError)
            return
        }

        const { data } = supabase.storage.from("secretary_profiles").getPublicUrl(filePath)

        if (!data?.publicUrl) {
            toast.error("Could not generate public URL")
            return
        }

        setFormData((prev) => ({ ...prev, profilePictureUrl: data.publicUrl }))

        const { error: dbError } = await supabase
            .from("secretary_users")
            .update({ profile_picture_url: data.publicUrl })
            .eq("id", user.id)

        if (dbError) {
            toast.error("Failed to save profile picture")
            console.error(dbError)
            return
        }

        toast.success("Profile picture updated")
    }

    return (
        <div className="flex flex-col gap-6">
            <Toaster position="top-right" />

            {/* Avatar + Buttons */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Avatar className="w-32 h-32 sm:w-50 sm:h-50">
                    <AvatarImage src={formData.profilePictureUrl} />
                    <AvatarFallback>
                        {formData.firstName?.[0]}
                        {formData.lastName?.[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 items-center sm:items-start mt-4 sm:mt-[60px] sm:ml-13">
                    <label className="bg-[#E46B64] text-white w-[147px] h-[38px] rounded-sm hover:shadow-md flex items-center justify-center cursor-pointer">
                        Upload New
                        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    </label>
                    <button
                        className="bg-white border border-[#DBDEE2] text-[#6B7280] w-[147px] h-[38px] rounded-sm hover:shadow-md"
                        onClick={async () => {
                            handleChange("profilePictureUrl", "")
                            await saveField("profilePictureUrl")
                        }}
                    >
                        Remove Photo
                    </button>
                </div>
            </div>

            <Separator className="text-black" />

            <h1 className="font-lato text-[15px] text-gray-500 mb-0 uppercase font-semibold">
                Personal Information
            </h1>

            {renderField("First Name", "firstName", formData.firstName, editMode.firstName, handleChange, saveField, toggleEdit)}
            {renderField("Last Name", "lastName", formData.lastName, editMode.lastName, handleChange, saveField, toggleEdit)}
            {renderField("Gender", "gender", formData.gender, editMode.gender, handleChange, saveField, toggleEdit)}

            {/* DOB */}
            <div className="w-full sm:w-[456px] mt-[-14px] px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[17px] font-lato text-gray-700">Date of Birth</p>
                    <button
                        onClick={() => editMode.dob ? saveField("dob") : toggleEdit("dob")}
                        className="text-[17px] font-lato text-[#E46B64] hover:underline"
                    >
                        {editMode.dob ? "Save" : "Edit"}
                    </button>
                </div>
                {editMode.dob ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="border-b w-full text-[16px] font-lato px-2 py-1 text-left rounded-sm">
                                {formData.dob ? format(formData.dob, "PPP") : "Pick a date"}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={formData.dob}
                                onSelect={(date) => handleChange("dob", date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                ) : (
                    <input
                        type="text"
                        value={formData.dob ? format(formData.dob, "PPP") : ""}
                        readOnly
                        className="border-b w-full text-[16px] font-lato px-2 py-1 rounded-sm border-gray-300 text-gray-500 cursor-default"
                    />
                )}
            </div>


            <h1 className="font-lato text-[15px] text-gray-500 mb-0 uppercase font-semibold">
                Contact Information
            </h1>

            {renderField("Email", "email", formData.email, editMode.email, handleChange, saveField, toggleEdit)}
            {renderField("Phone", "phone", formData.phone, editMode.phone, handleChange, saveField, toggleEdit)}
        </div>
    )
}

// 🔹 Helper
const renderField = (
    label: string,
    key: keyof FormDataType,
    value: any,
    isEditing: boolean,
    handleChange: <K extends keyof FormDataType>(field: K, value: FormDataType[K]) => void,
    saveField: (key: keyof FormDataType) => void,
    toggleEdit: (key: keyof FormDataType) => void
) => {
    return (
        <div className="w-full sm:w-[456px] mt-[-14px] px-3 py-2">
            <div className="flex justify-between items-center mb-1">
                <Label className="text-[17px] font-lato text-gray-700">{label}</Label>
                <button
                    type="button"
                    onClick={() => isEditing ? saveField(key) : toggleEdit(key)}
                    className="text-[17px] font-lato text-[#E46B64] hover:underline"
                >
                    {isEditing ? "Save" : "Edit"}
                </button>
            </div>

            {isEditing ? (
                key === "gender" ? (
                    <Select value={value} onValueChange={(val) => handleChange("gender", val)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        type="text"
                        value={value || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full focus:outline-none focus:ring-0"
                    />
                )
            ) : (
                <div
                    className="border-b w-full text-[16px] font-lato px-2 py-1 rounded-sm border-gray-300 text-gray-500 cursor-pointer"
                    onClick={() => toggleEdit(key)}
                >
                    {value || `Click to edit ${label.toLowerCase()}`}
                </div>
            )}
        </div>
    )
}
