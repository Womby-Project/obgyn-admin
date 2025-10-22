import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      // ✅ Log in
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (data?.user) {
        const userId = data.user.id;

        // ✅ Check OBGYN first
        const { data: obgyn } = await supabase
          .from("obgyn_users")
          .select("id")
          .eq("id", userId)
          .single();

        if (obgyn) {
          navigate("/dashboard");
          return;
        }

        // ✅ Check Secretary next
        const { data: secretary } = await supabase
          .from("secretary_users")
          .select("id")
          .eq("id", userId)
          .single();

        if (secretary) {
          navigate("/secretarydashboard");
          return;
        }

        // ❌ If not found in either
        setError("Your account role could not be determined.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading){
      handleLogin()
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center w-screen px-4 h-17 shadow-sm border border-[#E5E7EB] bg-[#FFFFFF] gap-2">
        <img
          src="/wombly-logo.png"
          alt="womblylogo"
          className="w-[40px] h-[40px] bg-[#FCF5EE] rounded-lg"
        />
        <p className="font-bold text-[18px] text-[#E46B64]">Wombly</p>
      </div>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center bg-[#FFFFFF] border border-[#E5E7EB] shadow-md">
        <div className="w-[468px] h-[480px] p-6 bg-[#FFFFFF] border border-[#E5E7EB] shadow-lg rounded-lg px-10">
          <div className="flex flex-col">
            <h1 className="text-[40px] font-bold text-[#E46B64] font-lato">Welcome back</h1>
            <p className="text-[17px] text-[#616161]">Enter your credentials.</p>

            {/* Email */}
            <div className="flex flex-col mt-5">
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                
                className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col mt-5">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
               onKeyDown={handleKeyDown}
                className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-sm w-[362px] h-[45px] px-4"
              />
            </div>

            {/* Error message */}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            {/* Login button */}
            <button
              onClick={handleLogin}

              disabled={loading}
               
              className="bg-[#E46B64] border border-[#E46B64] w-[362px] h-[45px] rounded-md mt-15 text-[#FFFFFF] hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Sign up */}
            <div className="flex flex-1 items-center justify-center gap-1 font-semibold mt-7">
              <h1 className="text-[#616161] text-[15px]">Don't have an account?</h1>
              <button
                className="text-[15px] text-[#E46B64] hover:text-gray-800 cursor-pointer"
                onClick={() => navigate("/basicinformation")}
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
