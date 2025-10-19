"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
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

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, X, Check } from "lucide-react"

/* ---------------- Crop helpers: solid white output, 1:1 square 512x512 ---------------- */
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
async function getCroppedBlobSquare(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  rotationDeg = 0
): Promise<Blob> {
  const image = await loadImage(imageSrc)

  const off = document.createElement("canvas")
  const offCtx = off.getContext("2d")!
  const maxSide = Math.ceil(Math.sqrt(image.width * image.width + image.height * image.height))
  off.width = maxSide
  off.height = maxSide

  offCtx.save()
  offCtx.fillStyle = "#ffffff"
  offCtx.fillRect(0, 0, off.width, off.height)
  offCtx.translate(off.width / 2, off.height / 2)
  if (rotationDeg !== 0) offCtx.rotate(toRad(rotationDeg))
  offCtx.drawImage(image, -image.width / 2, -image.height / 2)
  offCtx.restore()

  const OUT = 512
  const out = document.createElement("canvas")
  out.width = OUT
  out.height = OUT
  const outCtx = out.getContext("2d")!
  outCtx.fillStyle = "#ffffff"
  outCtx.fillRect(0, 0, OUT, OUT)

  outCtx.drawImage(
    off,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, OUT, OUT
  )

  return new Promise((resolve) =>
    out.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.92)
  )
}

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

  const handleChange = <K extends keyof FormDataType>(field: K, value: FormDataType[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }
  const toggleEdit = <K extends keyof EditModeType>(field: K) => {
    setEditMode((prev) => ({ ...prev, [field]: !prev[field] }))
  }

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

  // File -> Cropper
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
  const confirmCropAndUpload = useCallback(async () => {
    if (!rawImageSrc || !croppedAreaPixels) return
    setUploading(true)
    try {
      const blob = await getCroppedBlobSquare(rawImageSrc, croppedAreaPixels, rotation)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const filePath = `${user.id}/${Date.now()}.jpg`

      await supabase.storage.from("secretary_profiles").upload(filePath, blob, {
        contentType: "image/jpeg",
        upsert: true,
      })

      const { data } = supabase.storage.from("secretary_profiles").getPublicUrl(filePath)
      const url = data.publicUrl

      setFormData((p) => ({ ...p, profilePictureUrl: url }))
      await supabase.from("secretary_users").update({ profile_picture_url: url }).eq("id", user.id)

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
      <Toaster position="top-right" />

      {/* Header row — full width */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-32 h-32 sm:w-40 sm:h-40 overflow-hidden rounded-full border border-gray-200 ring-2 ring-[#F4C9C6]">
            <AvatarImage src={formData.profilePictureUrl} className="w-full h-full object-cover" />
            <AvatarFallback className="text-lg font-semibold text-[#E46B64] bg-[#FFF4F3]">
              {formData.firstName?.[0]}
              {formData.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-lato text-xl md:text-2xl font-semibold text-gray-900 leading-tight">
              {formData.firstName || "—"} {formData.lastName || ""}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">{formData.email || "—"}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <label className="bg-[#E46B64] text-white h-10 px-4 rounded-lg hover:opacity-90 flex items-center justify-center cursor-pointer shadow-sm">
            Upload New
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
          <button
            className="h-10 px-4 rounded-lg border border-[#DBDEE2] bg-white text-[#6B7280] hover:shadow-md"
            onClick={async () => {
              handleChange("profilePictureUrl", "")
              await saveField("profilePictureUrl")
            }}
          >
            Remove Photo
          </button>
        </div>
      </div>

      <Separator className="bg-gray-200" />

      {/* Personal Info (OBGYN-style inputs) */}
      <div className="p-6">
        <h3 className="font-lato text-xs text-gray-500 mb-3 uppercase font-semibold tracking-wide">
          Personal Information
        </h3>

        {renderField("First Name", "firstName", formData.firstName, editMode.firstName, handleChange, saveField, toggleEdit)}
        {renderField("Last Name", "lastName", formData.lastName, editMode.lastName, handleChange, saveField, toggleEdit)}
        {renderField("Gender", "gender", formData.gender, editMode.gender, handleChange, saveField, toggleEdit)}

        {/* DOB — same Popover + Calendar as OBGYN */}
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

      {/* Contact Info (OBGYN-style inputs) */}
      <div className="px-6 pb-6">
        <h3 className="font-lato text-xs text-gray-500 mb-3 uppercase font-semibold tracking-wide">
          Contact Information
        </h3>

        {renderField("Email", "email", formData.email, editMode.email, handleChange, saveField, toggleEdit)}
        {renderField("Phone", "phone", formData.phone, editMode.phone, handleChange, saveField, toggleEdit)}
      </div>

      {/* --- Cropper Dialog (solid white background, 1:1 square) --- */}
      <Dialog open={cropperOpen} onOpenChange={setCropperOpen}>
        <DialogContent className="max-w-[720px] bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Crop your photo (1:1)</DialogTitle>
          </DialogHeader>

          <div className="relative w-full bg-white rounded-xl overflow-hidden border border-gray-300" style={{ aspectRatio: "1 / 1" }}>
            {rawImageSrc && (
              <Cropper
                image={rawImageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
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
              <Button onClick={() => setRotation((r) => (r - 90 + 360) % 360)} className="h-9 rounded-lg bg-[#E46B64] text-white hover:bg-[#de5d56]">
                <RotateCw className="w-4 h-4 rotate-180" />
              </Button>
              <span className="text-sm">{rotation}°</span>
              <Button onClick={() => setRotation((r) => (r + 90) % 360)} className="h-9 rounded-lg bg-[#E46B64] text-white hover:bg-[#de5d56]">
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

            <Button onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0) }} className="h-9 rounded-lg bg-[#F3F4F6] text-gray-700 hover:bg-[#e9eaee]">
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
              className="hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={confirmCropAndUpload} disabled={!croppedAreaPixels || uploading} className="rounded-lg bg-[#E46B64] text-white hover:bg-[#de5d56]">
              {uploading ? "Uploading..." : <><Check className="w-4 h-4 mr-1" /> Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ------------ Field renderer (identical look & feel to OBGYN) ------------ */
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
          {value || `Click to edit ${label.toLowerCase()}`}
        </div>
      )}
    </div>
  )
}
