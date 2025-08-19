// src/components/SecretaryComponents/SecretaryCreationModal.tsx

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"

type SecretaryCreationModalProps = {
  trigger?: React.ReactNode
  obgynId?: string
  onSuccess?: () => void | Promise<void>
}



export default function SecretaryCreationModal({
  trigger,
  obgynId,
  onSuccess,
}: SecretaryCreationModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  
  })

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const passwordChecks = {
    length: formData.password.length >= 8,
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    number: /\d/.test(formData.password),
    mixedCase:
      /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password),
  }
  const allValid = Object.values(passwordChecks).every(Boolean)

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
  }

  const handleSubmit = async () => {
    if (!allValid || formData.password !== formData.confirmPassword) {
      setError("Password requirements not met or passwords do not match.")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // 1️⃣ Get secretary role_id
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("role_name", "Secretary")
        .single()

      if (roleError || !roleData) throw new Error("Secretary role not found.")

      // 2️⃣ Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: "Secretary",
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      })

      if (authError || !authData?.user)
        throw new Error("Failed to create secretary account.")

      const userId = authData.user.id

      // 3️⃣ Insert into secretary_users
      const { error: insertError } = await supabase
        .from("secretary_users")
        .insert([
          {
            id: userId,
            obgyn_id: obgynId || null,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            role_id: roleData.id,
          },
        ])

      if (insertError) throw insertError

      setSuccess(`Secretary ${formData.firstName} ${formData.lastName} created successfully!`)
      resetForm()

      // ✅ Call onSuccess if provided
      if (onSuccess) await onSuccess()

      // Auto-close after short delay
      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="bg-[#E46B64] text-white hover:bg-[#d65c58]">
            Add a Clinic Secretary
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[95%] max-w-[500px] font-lato bg-white border-none rounded-lg p-6">
        <DialogTitle className="text-center text-[18px] font-semibold mb-4">
          Create Clinic Secretary Account
        </DialogTitle>

        <div className="flex flex-col gap-4">
          <div>
            <Label>First Name</Label>
            <Input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter first name"
              className="bg-white border border-[#ECEEF0] h-[45px]"
            />
          </div>

          <div>
            <Label>Last Name</Label>
            <Input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter last name"
              className="bg-white border border-[#ECEEF0] h-[45px]"
            />
          </div>

          <div>
            <Label>Email Address</Label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="bg-white border border-[#ECEEF0] h-[45px]"
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="bg-white border border-[#ECEEF0] h-[45px]"
            />
          </div>

          <div>
            <Label>Confirm Password</Label>
            <Input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              className="bg-white border border-[#ECEEF0] h-[45px]"
            />
          </div>

          {/* Password Checker */}
          <div className="text-xs text-gray-600 mt-1 space-y-1">
            <p className={passwordChecks.length ? "text-green-600" : "text-red-500"}>
              • At least 8 characters
            </p>
            <p className={passwordChecks.specialChar ? "text-green-600" : "text-red-500"}>
              • At least 1 special character
            </p>
            <p className={passwordChecks.number ? "text-green-600" : "text-red-500"}>
              • At least 1 number
            </p>
            <p className={passwordChecks.mixedCase ? "text-green-600" : "text-red-500"}>
              • Combination of lower & upper case letters
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert className="bg-red-100 border-l-4 border-[#E46B64] text-[#E46B64] text-sm">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-100 border-l-4 border-green-600 text-green-700 text-sm">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            className="bg-[#E46B64] text-white hover:bg-[#d65c58] mt-3"
            onClick={handleSubmit}
            disabled={
              loading ||
              !allValid ||
              formData.password !== formData.confirmPassword
            }
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
