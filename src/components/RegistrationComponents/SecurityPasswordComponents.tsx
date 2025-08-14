import { useNavigate, useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import type { StepContextType } from "@/lib/type";

export default function SetPassword() {
  const navigate = useNavigate();
  const { step, totalSteps, formData, setFormData } = useOutletContext<
    StepContextType & {
      formData: Record<string, any>;
      setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    }
  >();

  const [password, setPassword] = useState(formData.password || "");
  const [confirmPassword, setConfirmPassword] = useState(
    formData.confirmPassword || ""
  );

  const cleanPassword = password.trim();
  const cleanConfirm = confirmPassword.trim();

  const requirements = [
    { label: "A total of at least 8 characters", test: (pw: string) => pw.length >= 8 },
    { label: "A minimum of one special character", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
    { label: "A minimum of one number", test: (pw: string) => /\d/.test(pw) },
    { label: "A combination of lower and upper case letters", test: (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  ];

  const allMet = requirements.every(req => req.test(cleanPassword));
  const passwordsMatch = cleanPassword && cleanPassword === cleanConfirm;

  const handleContinue = () => {
    const updatedFormData = {
      ...formData,
      accountInfo: {
        ...formData.accountInfo,   // preserve any previous data
        password,                  // snake_case, matches DB
        confirm_password: confirmPassword, // keep for navigation steps
      },
    };

    console.log("🔍 Step 2 - Saving formData:", updatedFormData);

    setFormData(updatedFormData);
    navigate("/professionalinformation"); // Step 3
  };


  return (
    <div className="flex flex-col">
      <p className="text-[12px] text-[#616161] uppercase">
        Step {step} out of {totalSteps}
      </p>
      <h1 className="text-[40px] font-bold text-[#E46B64] font-lato">
        Account Security
      </h1>
      <p className="text-[17px] text-[#616161]">
        Secure your account by setting a reliable and private password.
      </p>

      {/* Password */}
      <div className="flex flex-col mt-5">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
        />
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col mt-5">
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
        />
      </div>

      {/* Requirements */}
      <div className="mt-3 w-[362px] text-[13px] text-[#616161]">
        <p className="mb-2">Your password must contain:</p>
        {requirements.map((req, idx) => {
          const met = req.test(password);
          return (
            <motion.div
              key={idx}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
            >
              <motion.div
                animate={{
                  scale: met ? 1.1 : 1,
                  color: met ? "#16a34a" : "#9ca3af",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {met ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
              </motion.div>
              <motion.span
                animate={{ color: met ? "#16a34a" : "#616161" }}
                transition={{ duration: 0.3 }}
              >
                {req.label}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* Continue Button */}
      <button
        disabled={!allMet || !passwordsMatch}
        onClick={handleContinue}
        className={`w-[362px] h-[45px] rounded-md mt-5 text-white transition-all duration-200 ${allMet && passwordsMatch
          ? "bg-[#E46B64] hover:shadow-md"
          : "bg-gray-300 cursor-not-allowed"
          }`}
      >
        Continue
      </button>
    </div>
  );
}
