import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import { Progress } from "@/components/ui/progress";

export default function MultiStepLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const totalSteps = 4;

  const [step, setStep] = useState<number>(1);

  // 🔹 New: Add shared form state here
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Sync step with path
  useEffect(() => {
    const stepMap: Record<string, number> = {
      "/basicinformation": 1,
      "/setpassword": 2,
      "/professionalinformation": 3,
      "/setschedule": 4,
      "/finalpage": 5,
    };
    setStep(stepMap[location.pathname] ?? 1);
  }, [location.pathname]);

  const progressValue = (step / totalSteps) * 100;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex items-center w-screen px-4 h-17 shadow-sm border border-[#E5E7EB] bg-[#FFFFFF] gap-2">
        <img
          src="/wombly-logo.png"
          alt="womblylogo"
          className="w-[40px] h-[40px] bg-[#FCF5EE] rounded-lg"
        />
        <p className="font-bold text-[18px] text-[#E46B64]">Wombly</p>
      </div>

      <main className="flex flex-1 items-center justify-center bg-[#FFFFFF] border border-[#E5E7EB] shadow-md">
        <div className="w-[468px] p-6 bg-[#FFFFFF] border border-[#E5E7EB] shadow-lg rounded-lg px-10">
          {/* Progress Bar Section */}
          <div className="mb-5 flex items-center gap-3">
            <ArrowBackIosIcon
              className="text-[12px] text-[#616161] mb-2 cursor-pointer"
              onClick={() => navigate(-1)}
            />
            <Progress
              value={progressValue}
              className="w-[80%] transition-all duration-500 ease-in-out"
            />
          </div>

          {/* Step Content */}
          <Outlet
            context={{
              step,
              setStep,
              totalSteps,
              formData,
              setFormData, // 🔹 Pass shared state to all steps
            }}
          />
        </div>
      </main>
    </div>
  );
}
