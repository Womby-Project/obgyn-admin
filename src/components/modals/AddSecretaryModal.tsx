// src/components/SecretaryComponents/SecretaryCreationModal.tsx

import { useEffect, useMemo, useState } from "react"
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
import {
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

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

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // --- Validation helpers ---
  const emailValid = useMemo(() => {
    if (!formData.email) return false
    // Simple RFC5322-ish
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
  }, [formData.email])

  const passwordChecks = {
    length: formData.password.length >= 8,
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    number: /\d/.test(formData.password),
    mixedCase:
      /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password),
  }
  const allValid = Object.values(passwordChecks).every(Boolean)
  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword

  const strengthPct = useMemo(() => {
    const passed = Object.values(passwordChecks).filter(Boolean).length
    return (passed / 4) * 100
  }, [passwordChecks])

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
    setShowPassword(false)
    setShowConfirm(false)
    setError(null)
    setSuccess(null)
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) resetForm()
  }, [open])

  const handleSubmit = async () => {
    const trimmed = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    }

    // Basic validations with toast feedback
    if (!trimmed.firstName || !trimmed.lastName) {
      setError("Please enter first and last name.")
      toast.warning("Please complete the name fields.")
      return
    }
    if (!emailValid) {
      setError("Please enter a valid email address.")
      toast.warning("Invalid email format.")
      return
    }
    if (!allValid) {
      setError("Password requirements not met.")
      toast.warning("Password requirements not met.")
      return
    }
    if (trimmed.password !== trimmed.confirmPassword) {
      setError("Passwords do not match.")
      toast.warning("Passwords do not match.")
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

      if (roleError || !roleData) {
        throw new Error("Secretary role not found.")
      }

      // 2️⃣ Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmed.email,
        password: trimmed.password,
        options: {
          data: {
            role: "Secretary",
            first_name: trimmed.firstName,
            last_name: trimmed.lastName,
          },
        },
      })

      if (authError || !authData?.user) {
        // Common Supabase auth error surface
        const msg =
          authError?.message ||
          "Failed to create secretary account. Please try again."
        throw new Error(msg)
      }

      const userId = authData.user.id

      // 3️⃣ Insert into secretary_users
      const { error: insertError } = await supabase
        .from("secretary_users")
        .insert([
          {
            id: userId,
            obgyn_id: obgynId || null,
            first_name: trimmed.firstName,
            last_name: trimmed.lastName,
            email: trimmed.email,
            role_id: roleData.id,
          },
        ])

      if (insertError) {
        // If the auth user exists but DB insert failed, bubble precise reason
        throw new Error(insertError.message || "Database insert failed.")
      }

      const msg = `Secretary ${trimmed.firstName} ${trimmed.lastName} created successfully!`
      setSuccess(msg)
      toast.success(msg, { duration: 2500 })

      // Optional callback
      if (onSuccess) await onSuccess()

      // Close after a short pause
      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
      }, 1200)
    } catch (err: any) {
      const friendly =
        typeof err?.message === "string" && err.message.length
          ? err.message
          : "Something went wrong."
      setError(friendly)
      toast.error(friendly, { duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (!loading) handleSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent
        className="w-[95%] max-w-[520px] bg-white border-none rounded-2xl shadow-xl p-6 font-lato"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
               style={{ backgroundColor: "#FFF2F1", border: "1px solid #FAD4D2" }}>
            <ShieldCheck size={18} className="text-[#E46B64]" />
          </div>
          <DialogTitle className="text-center text-lg font-semibold text-gray-800">
            Create Clinic Secretary
          </DialogTitle>
        </div>

        {/* subtle divider */}
        <div className="h-px w-full my-3" style={{ background: "linear-gradient(90deg, transparent, #eee, transparent)" }} />

        <div className="flex flex-col gap-5">
          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Jane"
                  className="pl-9 bg-gray-50 border border-gray-200 h-11 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="pl-9 bg-gray-50 border border-gray-200 h-11 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="janedoe@email.com"
                className={`pl-9 bg-gray-50 border h-11 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40 ${
                  formData.email && !emailValid ? "border-red-300" : "border-gray-200"
                }`}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="pl-9 pr-10 bg-gray-50 border border-gray-200 h-11 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`pl-9 pr-10 bg-gray-50 border h-11 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40 ${
                  formData.confirmPassword &&
                  formData.password &&
                  formData.confirmPassword !== formData.password
                    ? "border-red-300"
                    : "border-gray-200"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password strength meter (compact, same palette) */}
          <div className="space-y-2">
            <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${strengthPct}%`,
                  backgroundColor:
                    strengthPct < 50 ? "#FCA5A5" : strengthPct < 75 ? "#F59E0B" : "#22C55E",
                }}
              />
            </div>
            <div className="text-xs grid grid-cols-2 gap-y-1">
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
            className="bg-[#E46B64] text-white hover:bg-[#d65c58] h-11 rounded-xl font-medium mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={
              loading ||
              !emailValid ||
              !allValid ||
              !passwordsMatch
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
