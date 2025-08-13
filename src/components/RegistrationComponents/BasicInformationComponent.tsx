import { useNavigate, useOutletContext } from "react-router-dom";

type StepContext = { step: number; totalSteps: number };

export default function BasicInformation() {
  const navigate = useNavigate();
  const { step, totalSteps } = useOutletContext<StepContext>();

  return (
    <div className="flex flex-col">
      <p className="text-[12px] text-[#616161] uppercase">
        Step {step} out of {totalSteps}
      </p>
      <h1 className="text-[40px] font-bold text-[#E46B64] font-lato">Basic Information</h1>
      <p className="text-[17px] text-[#616161]">Set up your profile and login credentials</p>

      {/* Email Input */}
      <div className="flex flex-col mt-5">
        <input
          type="text"
          placeholder="First Name"
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
        />
      </div>

      {/* Last name */}
      <div className="flex flex-col mt-5">
        <input
          type="text"
          placeholder="Last Name"
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
        />
      </div>

      {/* Gender Select */}
      <div className="flex items-center gap-15 mt-5 w-[362px]">
        <label className="flex items-center justify-between border border-gray-100 w-[153px] h-[44px] rounded-md px-3 cursor-pointer">
          <span>Female</span>
          <input type="radio" name="gender" />
        </label>

        <label className="flex items-center justify-between border border-gray-100 w-[153px] h-[44px] rounded-md px-3 cursor-pointer">
          <span>Male</span>
          <input type="radio" name="gender" />
        </label>
      </div>


      <div className="flex flex-col mt-5">
        <input
          type="Email"
          placeholder="Email"
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
        />
      </div>

      {/* Continue Button */}
      <button
        onClick={() => navigate("/setpassword")}
        className="bg-[#E46B64] border border-[#E46B64] w-[362px] h-[45px] rounded-md mt-5 text-[#FFFFFF] hover:shadow-md cursor-pointer"
      >
        Continue
      </button>
    </div>
  );
}
