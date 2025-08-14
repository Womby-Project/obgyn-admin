import { useNavigate, useOutletContext } from "react-router-dom";
import { useState } from "react";

type StepContext = {
  step: number;
  totalSteps: number;
  formData: any;
  setFormData: (data: any) => void;
};

export default function BasicInformation() {
  const navigate = useNavigate();
  const { step, totalSteps, formData, setFormData } =
    useOutletContext<StepContext>();

  const [first_name, setFirstName] = useState(formData.firstName || "");
  const [last_name, setLastName] = useState(formData.lastName || "");
  const [gender, setGender] = useState(formData.gender || "");
  const [email, setEmail] = useState(formData.email || "");

  const handleContinue = () => {
    const updatedFormData = {
      ...formData,
      first_name,
      last_name,
      gender,
      accountInfo: {
        ...formData.accountInfo,
        email,
      },
    };

    // Save to context
    setFormData(updatedFormData);

    console.log("🔍 Step 1 - Saving formData:", updatedFormData);
    navigate("/setpassword"); // go to Step 2
  };


  return (
    <div className="flex flex-col">
      <p className="text-[12px] text-[#616161] uppercase">
        Step {step} out of {totalSteps}
      </p>
      <h1 className="text-[40px] font-bold text-[#E46B64] font-lato">
        Basic Information
      </h1>
      <p className="text-[17px] text-[#616161]">
        Set up your profile and login credentials
      </p>

      {/* First Name */}
      <div className="flex flex-col mt-5">
        <input
          type="text"
          value={first_name}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
        />
      </div>

      {/* Last Name */}
      <div className="flex flex-col mt-5">
        <input
          type="text"
          value={last_name}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
        />
      </div>

      {/* Gender Select */}
      <div className="flex items-center gap-15 mt-5 w-[362px]">
        <label className={`flex items-center justify-between border ${gender === "Female" ? "border-[#E46B64]" : "border-gray-100"} w-[153px] h-[44px] rounded-md px-3 cursor-pointer`}>
          <span>Female</span>
          <input
            type="radio"
            name="gender"
            checked={gender === "Female"}
            onChange={() => setGender("Female")}
          />
        </label>

        <label className={`flex items-center justify-between border ${gender === "Male" ? "border-[#E46B64]" : "border-gray-100"} w-[153px] h-[44px] rounded-md px-3 cursor-pointer`}>
          <span>Male</span>
          <input
            type="radio"
            name="gender"
            checked={gender === "Male"}
            onChange={() => setGender("Male")}
          />
        </label>
      </div>

      {/* Email */}
      <div className="flex flex-col mt-5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
        />
      </div>

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
