
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate();


    return (
        <div className="flex  flex-col  h-screen ">
            <div className="flex flex items-center w-screen px-4 h-17 shadow-sm border border-[#E5E7EB]  bg-[#FFFFFF] gap-2">
                <img
                    src="/src/assets/wombly-logo.png"
                    alt="womblylogo"
                    className="w-[40px] h-[40px] bg-[#FCF5EE] rounded-lg"
                />
                <p className="font-bold text-[18px] text-[#E46B64] ">Wombly</p>

            </div>

            {/* Main contect */}
            <main className="flex  flex-1 items-center justify-center bg-[#FFFFFF] border border-[#E5E7EB] shadow-md">
                <div className="w-[400px] p-6 bg-[#FFFFFF] border border-[#E5E7EB] w-[468px] h-[480px] shadow-lg rounded-lg px-10">
                    <div className="flex flex-col">
                        <h1 className="text-[40px] font-bold text-[#E46B64] font-lato "> Welcome back</h1>
                        <p className="text-[17px] text-[#616161]">Enter your credentials.</p>


                        {/* Diri ang EMAIL */}
                        <div className="flex flex-col mt-5">
                            <input type="text" placeholder="Email" className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4" />
                        </div>

                        <div className="flex flex-col mt-5">
                            <input type="password" placeholder="Password" className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4" />
                        </div>


                        {/* Login button */}

                        <button className="bg-[#E46B64] border border-[#E46B64] w-[362px] h-[45px] rounded-md mt-15 text-[#FFFFFF] hover:shadow-md cursor-pointer">
                            Login
                        </button>

                        <div className="flex flex-1 items-center justify-center gap-1 font-semibold mt-7">
                            <h1 className="text-[#616161] text-[15px]">Dont have an account?</h1>
                            <button
                                className="text-[15px] text-[#E46B64] hover:text-gray-800 cursor-pointer"
                                onClick={() => navigate("/basicinformation")}
                            >Sign up</button>
                        </div>


                    </div>

                </div>
            </main>
        </div>
    )
}