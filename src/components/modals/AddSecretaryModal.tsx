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
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

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

      setSuccess(
        `Secretary ${formData.firstName} ${formData.lastName} created successfully!`
      )
      resetForm()

      if (onSuccess) await onSuccess()

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
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="w-[95%] max-w-[480px] bg-white border-none rounded-2xl shadow-lg p-6 font-lato">
        <DialogTitle className="text-center text-lg font-semibold text-gray-800 mb-6">
          Create Clinic Secretary
        </DialogTitle>

        <div className="flex flex-col gap-5">
          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                First Name
              </Label>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Jane"
                className="bg-gray-50 border border-gray-200 h-11 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                Last Name
              </Label>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className="bg-gray-50 border border-gray-200 h-11 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="janedoe@email.com"
              className="bg-gray-50 border border-gray-200 h-11 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Password</Label>
            <Input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="bg-gray-50 border border-gray-200 h-11 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              Confirm Password
            </Label>
            <Input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="bg-gray-50 border border-gray-200 h-11 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40"
            />
          </div>

          {/* Password strength */}
          <div className="text-xs mt-1 space-y-1">
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
              • Upper & lower case letters
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-l-4 border-green-600 text-green-700 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <Button
            className="bg-[#E46B64] text-white hover:bg-[#d65c58] h-11 rounded-xl font-medium mt-2"
            onClick={handleSubmit}
            disabled={
              loading ||
              !allValid ||
              formData.password !== formData.confirmPassword
            }
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" /> Creating...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
