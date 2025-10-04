import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useEffect, useRef, useState } from "react";

type StepContext = {
  step: number;
  totalSteps: number;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
};

export default function ProfessionalInformation() {
  const navigate = useNavigate();
  const { step, totalSteps, formData, setFormData } = useOutletContext<StepContext>();

  const [, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // 50MB = 50 * 1024 * 1024 bytes
      if (file.size > 50 * 1024 * 1024) {
        alert("File is too large! Please upload a file under 50MB.");
        return;
      }

      setFileName(file.name);

      setFormData((prev: any) => ({
        ...prev,
        prc_id_file: file,
      }));

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleContinue = () => {
    console.log("📋 Step 3 formData:", formData);

    // Basic validation
    if (!formData.prc_license_number || formData.prc_license_number.trim() === "") {
      alert("PRC License Number is required.");
      return;
    }
    if (!formData.affiliated_hospital) {
      alert("Please select an affiliated hospital.");
      return;
    }
    // If you want to require Organization too, uncomment:
    // if (!formData.organization || formData.organization.trim() === "") {
    //   alert("Please enter your organization.");
    //   return;
    // }
    if (!formData.prc_id_file) {
      alert("Please upload your PRC ID.");
      return;
    }

    console.log("✅ Step 3 validated, moving to Step 4");
    navigate("/setschedule");
  };

  return (
    <div className="flex flex-col">
      <p className="text-[12px] text-[#616161] uppercase">
        Step {step} out of {totalSteps}
      </p>
      <h1 className="text-[40px] font-bold text-[#E46B64] font-lato">
        Background
      </h1>
      <p className="text-[17px] text-[#616161]">
        Tell us about your medical background to help mothers trust and connect with you.
      </p>

      {/* PRC License Number Input */}
      <div className="flex flex-col mt-5">
        <input
          type="text"
          placeholder="PRC License Number"
          value={formData.prc_license_number || ""}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              prc_license_number: e.target.value,
            }))
          }
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
        />
      </div>

      {/* Dropdown for Affiliated Hospital/s */}
      <div className="flex flex-col mt-5">
        <Select
          value={formData.affiliated_hospital || ""}
          onValueChange={(value) =>
            setFormData((prev: any) => ({
              ...prev,
              affiliated_hospital: value,
            }))
          }
        >
          <SelectTrigger className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] !h-[45px] px-4 text-[#616161]">
            <SelectValue placeholder="Affiliated Hospital/s" />
          </SelectTrigger>
          <SelectContent className="w-[362px] max-h-[180px]">
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Organization (NEW — placed right after Affiliated Hospital/s) */}
      <div className="flex flex-col mt-5">
        <input
          type="text"
          placeholder="Organization (e.g., Davao Doctors Hospital – OB-GYN Dept.)"
          value={formData.organization || ""}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              organization: e.target.value,
            }))
          }
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
        />
        <span className="text-[12px] text-[#9E9E9E] mt-1">
          Optional: your clinic, department, or organization name.
        </span>
      </div>

      {/* Upload PRC ID */}
      <p className="text-[14px] text-[#616161] mb-2 mt-5 w-[362px] italic">
        Upload a clear photo or scanned copy of your valid PRC ID for verification purposes.
      </p>

      <label
        htmlFor="prc-upload"
        className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] min-h-[150px] px-4 py-6 flex flex-col items-center justify-center gap-3 text-center relative overflow-hidden"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-md"
          />
        ) : (
          <>
            <UploadFileIcon style={{ fontSize: 40, color: "#E46B64" }} />
            <span className="text-[14px] text-[#333333] font-medium">
              Choose a file or document
            </span>
            <span className="text-[12px] text-[#9E9E9E]">
              JPEG, PNG, and PDF up to 50 MB.
            </span>
            <button
              type="button"
              className="bg-[#FFFFFF] border border-[#A8A8A8] text-[#A8A8A8] px-4 py-2 rounded-md hover:shadow text-[10px] cursor-pointer hover:shadow-md"
              onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
            >
              Browse a file
            </button>
          </>
        )}

        <input
          id="prc-upload"
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        className="bg-[#E46B64] border border-[#E46B64] w-[362px] h-[45px] rounded-md mt-5 text-[#FFFFFF] hover:shadow-md cursor-pointer"
      >
        Continue
      </button>
    </div>
  );
}
