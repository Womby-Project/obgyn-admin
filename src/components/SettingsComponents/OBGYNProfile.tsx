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
  organization: string
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
    organization: "",
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
    organization: false,
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
          organization: data.organization || "",
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
    if (field === "organization") updatePayload.organization = formData.organization
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
    <>
      {/* keep toaster but no outer layout wrapper */}
      <Toaster position="top-right" />

      {/* Avatar Row — now full-width in the parent profile container */}
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-24 w-24 md:h-28 md:w-28 overflow-hidden rounded-full ring-2 ring-[#F4C9C6]">
            <AvatarImage src={formData.profilePictureUrl} className="h-full w-full object-cover" />
            <AvatarFallback className="text-lg font-semibold text-[#E46B64] bg-[#FFF4F3]">
              {formData.firstName?.[0]}
              {formData.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-lato text-xl font-semibold leading-tight text-gray-900 md:text-2xl">
              Dr. {formData.firstName} {formData.lastName}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {formData.education || "—"} {formData.organization ? `• ${formData.organization}` : ""}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <label
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#E46B64] px-4 text-sm font-medium text-white shadow-sm transition hover:opacity-90 cursor-pointer"
            aria-label="Upload new profile photo"
          >
            Upload Photo
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:shadow-md"
            onClick={async () => {
              handleChange("profilePictureUrl", "")
              await saveField("profilePictureUrl")
            }}
            aria-label="Remove current profile photo"
          >
            Remove
          </button>
        </div>
      </div>

      <Separator className="bg-gray-200" />

      {/* Two-column sections — full width, not inside another wrapper card */}
      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        <section className="rounded-xl border border-gray-100 bg-white p-4 md:p-5 shadow-[0_1px_0_#f1f5f9]">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Personal Information
          </h3>

          <div className="space-y-2">
            {renderField("First Name", "firstName", formData.firstName, editMode.firstName, handleChange, saveField, toggleEdit)}
            {renderField("Last Name", "lastName", formData.lastName, editMode.lastName, handleChange, saveField, toggleEdit)}
            {renderField("Gender", "gender", formData.gender, editMode.gender, handleChange, saveField, toggleEdit)}

            {/* DOB */}
            <div className="w-full mt-2">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-lato text-[15px] font-medium text-gray-800">Date of Birth</p>
                <button
                  onClick={() => (editMode.dob ? saveField("dob") : toggleEdit("dob"))}
                  className="text-[14px] font-medium text-[#E46B64] hover:underline"
                  aria-label={editMode.dob ? "Save date of birth" : "Edit date of birth"}
                >
                  {editMode.dob ? "Save" : "Edit"}
                </button>
              </div>

              {editMode.dob ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-[15px] font-lato text-gray-800 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C9C6]"
                      aria-label="Open date picker"
                    >
                      {formData.dob ? format(formData.dob, "PPP") : "Pick a date"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl border border-gray-200 shadow-md">
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
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] font-lato text-gray-600"
                  aria-readonly="true"
                />
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-4 md:p-5 shadow-[0_1px_0_#f1f5f9]">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Contact & Credentials
          </h3>

          <div className="space-y-2">
            {renderField("Email", "email", formData.email, editMode.email, handleChange, saveField, toggleEdit)}
            {renderField("Phone", "phone", formData.phone, editMode.phone, handleChange, saveField, toggleEdit)}
            {renderField("Education", "education", formData.education, editMode.education, handleChange, saveField, toggleEdit)}
            {renderField("Organization", "organization", formData.organization, editMode.organization, handleChange, saveField, toggleEdit)}
            {renderField("Affiliated Hospitals", "affiliatedHospitals", formData.affiliatedHospitals, editMode.affiliatedHospitals, handleChange, saveField, toggleEdit)}
          </div>
        </section>
      </div>

      {/* --- Cropper Dialog (solid white background, simple UI) --- */}
      <Dialog open={cropperOpen} onOpenChange={setCropperOpen}>
        <DialogContent className="max-w-[860px] rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Crop your photo (16:9)</DialogTitle>
            <p className="mt-1 text-sm text-gray-500">
              Adjust the frame below. Your photo will be saved with a clean white background.
            </p>
          </DialogHeader>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
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

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                className="h-9 rounded-lg bg-[#E46B64] text-white hover:bg-[#de5d56]"
              >
                <RotateCw className="h-4 w-4 rotate-180" />
              </Button>
              <span className="text-sm text-gray-600">{rotation}°</span>
              <Button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="h-9 rounded-lg bg-[#E46B64] text-white hover:bg-[#de5d56]"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <ZoomOut className="h-4 w-4 text-gray-600" />
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-48 accent-[#E46B64]"
                aria-label="Zoom"
              />
              <ZoomIn className="h-4 w-4 text-gray-600" />
            </div>

            <Button
              onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0) }}
              className="h-9 rounded-lg bg-[#F3F4F6] text-gray-700 hover:bg-[#e9eaee]"
              aria-label="Reset crop"
            >
              <RefreshCw className="mr-1 h-4 w-4" /> Reset
            </Button>
          </div>

          <DialogFooter className="mt-6 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (rawImageSrc) URL.revokeObjectURL(rawImageSrc)
                setRawImageSrc(null)
                setCropperOpen(false)
              }}
              className="hover:bg-gray-50"
            >
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={confirmCropAndUpload}
              disabled={!croppedAreaPixels || uploading}
              className="rounded-lg bg-[#E46B64] text-white hover:bg-[#de5d56]"
            >
              {uploading ? "Uploading..." : <><Check className="mr-1 h-4 w-4" /> Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <Label className="font-lato text-[15px] font-medium text-gray-800">{label}</Label>
        <button
          type="button"
          onClick={() => (isEditing ? saveField(key) : toggleEdit(key))}
          className="text-[13px] font-medium text-[#E46B64] underline-offset-2 hover:underline"
          aria-label={isEditing ? `Save ${label}` : `Edit ${label}`}
        >
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>

      {isEditing ? (
        key === "gender" ? (
          <Select value={value} onValueChange={(val) => handleChange("gender", val)}>
            <SelectTrigger className="w-full rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#F4C9C6]">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-gray-200 shadow-md">
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
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700"
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
                    className="rounded-full px-1 text-xs text-gray-500 hover:bg-white hover:text-red-600"
                    aria-label={`Remove ${hospital}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <Input
              type="text"
              placeholder="Add an affiliated hospital and press Enter"
              className="w-full rounded-lg border-gray-300 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F4C9C6]"
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
              aria-label="Add affiliated hospital"
            />
          </div>
        ) : (
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full rounded-lg border-gray-300 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F4C9C6]"
            aria-label={label}
          />
        )
      ) : (
        <div
          className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] font-lato text-gray-700 hover:border-gray-300"
          onClick={() => toggleEdit(key)}
          role="button"
          aria-label={`Edit ${label}`}
        >
          {key === "affiliatedHospitals" ? (
            value?.length ? (
              value.map((hospital: string, i: number) => (
                <span
                  key={i}
                  className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700"
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
