import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2, Circle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function SecurityPage() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [twoFA, setTwoFA] = useState(false)

  // Password validation rules
  const validations = {
    length: newPassword.length >= 8,
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    number: /\d/.test(newPassword),
    upperLower: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
  }

  const allValid = Object.values(validations).every(Boolean)

  return (
    <div className="flex flex-col gap-10 max-w-full px-4 md:px-8 lg:px-0">
      {/* Change Password Section */}
      <div className="flex flex-col gap-6">
        <h1 className="text-[20px] font-semibold text-gray-800">
          Change Password
        </h1>

        <div className="flex flex-col items-start">
          {/* Old Password */}
          <div className="flex flex-col w-full max-w-md">
            <p className="text-[17px] mb-2">Old Password</p>
            <Input
              className="h-[45px] border border-gray-300"
              type="password"
              placeholder="Enter Old password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>

          {/* New Password */}
          <p className="text-[17px] mt-5">New Password</p>
          <Input
            className="w-full max-w-md h-[45px] border border-gray-300"
            type="password"
            placeholder="Enter New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          {/* Password Requirements */}
          <div className="mt-4 text-sm w-full max-w-md">
            <p className="mb-2 font-medium">Your password must contain:</p>
            <ul className="space-y-1">
              {[
                { key: "length", text: "A total of at least 8 characters" },
                { key: "specialChar", text: "A minimum of one special character" },
                { key: "number", text: "A minimum of one number" },
                { key: "upperLower", text: "A combination of lower and upper case letters" },
              ].map(({ key, text }) => (
                <li key={key} className="flex items-center gap-2">
                  <AnimatePresence mode="wait">
                    {validations[key as keyof typeof validations] ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CheckCircle2 className="text-green-500" size={16} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="circle"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Circle className="text-gray-400" size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Update Password Button */}
        <div className="flex justify-end w-full max-w-md">
          <Button
            className={`mt-4 w-[150px] bg-[#F58171] text-white font-lato transition-opacity ${
              !allValid ? "opacity-50 cursor-not-allowed" : "opacity-100"
            }`}
            disabled={!allValid}
          >
            Update Password
          </Button>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-200" />

      {/* Two-Factor Authentication Section */}
      <div className="flex flex-col gap-10 border w-[445px] px-2 h-34  rounded-md border-gray-200">
        <div className="flex items-start gap-3 w-full max-w-md mt-5">
          <Switch
            checked={twoFA}
            onCheckedChange={setTwoFA}
            className="mt-[2px]"
          />
          <div>
            <p className="text-[17px] font-medium">
              Enable Two-Factor Authentication (2FA)
            </p>
            <p className="text-sm text-gray-500">
              Keep your account secure by enabling 2FA. By enabling this, you
              will receive a one-time passcode via email every time you log in.
            </p>
          </div>
        </div>

      
      </div>
        {/* Save Button */}
        <div className="flex justify-end w-full max-w-md ">
          <Button className="mt-4 w-[150px] bg-[#F58171] text-white font-lato hover:opacity-90 transition-opacity">
            Save
          </Button>
        </div>
    </div>
  )
}
