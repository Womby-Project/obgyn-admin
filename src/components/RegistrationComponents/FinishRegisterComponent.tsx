import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";


export default function SuccessCreation() {

    const navigate = useNavigate();

    return (
        <div className="flex flex-col">




            <div className="flex flex-col items-center justify-center">
                <Icon icon="gg:check-o" className="h-30  w-30 items-center text-[#E46B64]" />
            </div>

            <div className="mt-2 flex items-center justify-center">
                <p className="text-[35px] text-[#E46B64] font-bold text-center">
                    Account Successfully Created!
                </p>
            </div>


            <div className="flex items-center justify-center  mt-10 ">
                <p className="text-[15px] text-[#616161] text-center">You can now log in to access patient records and conduct online consultations with your patients.</p>
            </div>


            {/* Continue Button */}
            <button
                onClick={() => navigate("/")} // Change to actual step 4 route
                className="bg-[#E46B64] border border-[#E46B64] w-[380px] h-[45px] rounded-md mt-5 text-[#FFFFFF] hover:shadow-md cursor-pointer"
            >
                Continue
            </button>

        </div>


    )
}