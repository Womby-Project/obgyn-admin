"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect, useCallback } from "react"
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

import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, X, Check } from "lucide-react"

/* ---------------- Crop helpers: solid white output, 16:9 ---------------- */
function toRad(deg: number) {
  return (deg * Math.PI) / 180
}
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
async function getCroppedBlob(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  rotationDeg = 0
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const outW = 1280
  const outH = 720

  const off = document.createElement("canvas")
  const offCtx = off.getContext("2d")!
  off.width = image.width
  off.height = image.height
  offCtx.save()
  offCtx.fillStyle = "#ffffff"
  offCtx.fillRect(0, 0, off.width, off.height)
  if (rotationDeg !== 0) {
    offCtx.translate(off.width / 2, off.height / 2)
    offCtx.rotate(toRad(rotationDeg))
    offCtx.drawImage(image, -image.width / 2, -image.height / 2)
  } else {
    offCtx.drawImage(image, 0, 0)
  }
  offCtx.restore()

  const out = document.createElement("canvas")
  out.width = outW
  out.height = outH
  const outCtx = out.getContext("2d")!
  outCtx.fillStyle = "#ffffff"
  outCtx.fillRect(0, 0, outW, outH)
  outCtx.drawImage(
    off,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, outW, outH
  )

  return new Promise((resolve) =>
    out.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.9)
  )
}

type FormDataType = {
  firstName: string
  lastName: string
  gender: string
  dob: Date | undefined
  email: string
  phone: string
  education: string
  organization: string          // 👈 NEW
  affiliatedHospitals: string[]
  profilePictureUrl?: string
}
type EditModeType = Record<keyof FormDataType, boolean>

export default function OBGYNProfile() {
  const [formData, setFormData] = useState<FormDataType>({
    firstName: "John",
    lastName: "Doe",
    gender: "",
    dob: undefined,
    email: "john.doe@email.com",
    phone: "09123456789",
    education: "MD",
    organization: "",            // 👈 NEW
    affiliatedHospitals: ["St. Luke's Medical Center"],
    profilePictureUrl: "https://github.com/shadcn.png",
  })

  const [editMode, setEditMode] = useState<EditModeType>({
    firstName: false,
    lastName: false,
    gender: false,
    dob: false,
    email: false,
    phone: false,
    education: false,
    organization: false,         // 👈 NEW
    affiliatedHospitals: false,
    profilePictureUrl: false,
  })

  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false)
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [uploading, setUploading] = useState(false)

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast.error("Not logged in")
        return
      }
      const { data, error } = await supabase
        .from("obgyn_users")
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
          gender: data.gender || "",
          dob: data.birth_date ? new Date(data.birth_date) : undefined,
          email: data.email,
          phone: data.phone_number || "",
          education: data.education || "",
          organization: data.organization || "", // 👈 NEW
          affiliatedHospitals: data.affiliated_hospitals_clinics || [],
          profilePictureUrl: data.profile_picture_url || "https://github.com/shadcn.png",
        })
      }
    }
    fetchProfile()
  }, [])

  // Change & edit toggles
  const handleChange = <K extends keyof FormDataType>(field: K, value: FormDataType[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }
  const toggleEdit = <K extends keyof EditModeType>(field: K) => {
    setEditMode((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  // Save field
  const saveField = async <K extends keyof FormDataType>(field: K) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("User not found")
      return
    }
    const updatePayload: any = {}
    if (field === "firstName") updatePayload.first_name = formData.firstName
    if (field === "lastName") updatePayload.last_name = formData.lastName
    if (field === "gender") updatePayload.gender = formData.gender
    if (field === "dob") updatePayload.birth_date = formData.dob?.toISOString()
    if (field === "email") updatePayload.email = formData.email
    if (field === "phone") updatePayload.phone_number = formData.phone
    if (field === "education") updatePayload.education = formData.education
    if (field === "organization") updatePayload.organization = formData.organization      // 👈 NEW
    if (field === "affiliatedHospitals")
      updatePayload.affiliated_hospitals_clinics = formData.affiliatedHospitals
    if (field === "profilePictureUrl") updatePayload.profile_picture_url = formData.profilePictureUrl

    const { error } = await supabase.from("obgyn_users").update(updatePayload).eq("id", user.id)
    if (error) {
      toast.error("Failed to save changes")
      console.error(error)
    } else {
      toast.success("Profile updated")
      toggleEdit(field)
    }
  }

  // Choose file -> open cropper
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setRawImageSrc(objectUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCropperOpen(true)
  }

  const onCropComplete = useCallback((_: any, areaPixels: any) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  // Confirm crop & upload (solid white output)
  const confirmCropAndUpload = useCallback(async () => {
    if (!rawImageSrc || !croppedAreaPixels) return
    setUploading(true)
    try {
      const blob = await getCroppedBlob(rawImageSrc, croppedAreaPixels, rotation)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const filePath = `${user.id}/${Date.now()}.jpg`
      await supabase.storage.from("obgyn_profiles").upload(filePath, blob, {
        contentType: "image/jpeg",
        upsert: true,
      })
      const { data } = supabase.storage.from("obgyn_profiles").getPublicUrl(filePath)
      const url = data.publicUrl
      setFormData((p) => ({ ...p, profilePictureUrl: url }))
      await supabase.from("obgyn_users").update({ profile_picture_url: url }).eq("id", user.id)
      toast.success("Profile picture updated")
      setCropperOpen(false)
      URL.revokeObjectURL(rawImageSrc)
      setRawImageSrc(null)
    } catch (e) {
      console.error(e)
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }, [croppedAreaPixels, rawImageSrc, rotation])

  return (
    <div className="flex flex-col gap-6">
      <Toaster position="top-right" />

      {/* Avatar + Buttons */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <Avatar className="w-32 h-32 sm:w-40 sm:h-40 overflow-hidden rounded-full border border-gray-200">
          <AvatarImage src={formData.profilePictureUrl} className="w-full h-full object-cover" />
          <AvatarFallback>
            {formData.firstName?.[0]}
            {formData.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2 items-center sm:items-start mt-4 sm:mt-[60px] sm:ml-13">
          <label className="bg-[#E46B64] text-white w-[147px] h-[38px] rounded-sm hover:opacity-90 flex items-center justify-center cursor-pointer">
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
            onClick={() => (editMode.dob ? saveField("dob") : toggleEdit("dob"))}
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

      {renderField("Email", "email", formData.email, editMode.email, handleChange, saveField, toggleEdit)}
      {renderField("Phone", "phone", formData.phone, editMode.phone, handleChange, saveField, toggleEdit)}
      {renderField("Education", "education", formData.education, editMode.education, handleChange, saveField, toggleEdit)}

      {/* 👇 NEW Organization field */}
      {renderField("Organization", "organization", formData.organization, editMode.organization, handleChange, saveField, toggleEdit)}

      {renderField("Affiliated Hospitals", "affiliatedHospitals", formData.affiliatedHospitals, editMode.affiliatedHospitals, handleChange, saveField, toggleEdit)}

      {/* --- Cropper Dialog (solid white background, simple UI) --- */}
      <Dialog open={cropperOpen} onOpenChange={setCropperOpen}>
        <DialogContent className="max-w-[800px] bg-white rounded-md p-6">
          <DialogHeader>
            <DialogTitle>Crop your photo (16:9)</DialogTitle>
          </DialogHeader>

          <div className="relative aspect-video w-full bg-white rounded-md overflow-hidden border border-gray-300">
            {rawImageSrc && (
              <Cropper
                image={rawImageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition
                objectFit="contain"
                showGrid
              />
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                style={{ backgroundColor: "#E46B64", color: "white" }}
              >
                <RotateCw className="w-4 h-4 rotate-180" />
              </Button>
              <span className="text-sm">{rotation}°</span>
              <Button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                style={{ backgroundColor: "#E46B64", color: "white" }}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <ZoomOut className="w-4 h-4 text-gray-600" />
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-40 accent-[#E46B64]"
              />
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </div>

            <Button
              onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0) }}
              style={{ backgroundColor: "#E46B64", color: "white" }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (rawImageSrc) URL.revokeObjectURL(rawImageSrc)
                setRawImageSrc(null)
                setCropperOpen(false)
              }}
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button
              onClick={confirmCropAndUpload}
              disabled={!croppedAreaPixels || uploading}
              style={{ backgroundColor: "#E46B64", color: "white" }}
            >
              {uploading ? "Uploading..." : <><Check className="w-4 h-4 mr-1" /> Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------------- Field renderer ---------------- */
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
          onClick={() => (isEditing ? saveField(key) : toggleEdit(key))}
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
        ) : key === "affiliatedHospitals" ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {value?.map((hospital: string, i: number) => (
                <span
                  key={i}
                  className="bg-[#E5E7EB] text-[#616161] border border-[#616161] px-2 py-0.5 rounded-full text-sm font-semibold flex items-center gap-1"
                >
                  {hospital}
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        "affiliatedHospitals",
                        value.filter((_: string, idx: number) => idx !== i)
                      )
                    }
                    className="text-xs ml-1 text-gray-600 hover:text-red-500"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <Input
              type="text"
              placeholder="Affiliated Hospitals"
              className="w-full focus:outline-none focus:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  const input = (e.currentTarget as HTMLInputElement).value.trim()
                  if (input.length) {
                    handleChange("affiliatedHospitals", [...value, input])
                    ;(e.currentTarget as HTMLInputElement).value = ""
                  }
                }
              }}
            />
          </div>
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
          className="border-b w-full text-[16px] font-lato px-2 py-1 rounded-sm border-gray-300 text-gray-500 cursor-pointer flex flex-wrap gap-2"
          onClick={() => toggleEdit(key)}
        >
          {key === "affiliatedHospitals" ? (
            value?.length ? (
              value.map((hospital: string, i: number) => (
                <span
                  key={i}
                  className="bg-[#E5E7EB] text-[#616161] border border-[#616161] px-2 py-0.5 rounded-full text-sm font-semibold"
                >
                  {hospital}
                </span>
              ))
            ) : (
              <span className="text-gray-400">Click to edit hospitals</span>
            )
          ) : (
            value || `Click to edit ${label.toLowerCase()}`
          )}
        </div>
      )}
    </div>
  )
}
