// src/components/DashboardComponents/SidebarComponent.tsx
import { NavLink, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import { supabase } from "@/lib/supabaseClient";
import packageJson from "../../../package.json"
import { Icon } from "@iconify/react";

type UserData = {
  name: string;
  avatarUrl?: string;
  role: "OBGYN" | "Secretary";
};

type SidebarProps = {
  user: UserData | null;
};

export default function Sidebar({ user }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };



  return (
    <aside className="fixed left-0 w-[260px] bg-white border-r h-screen shadow-md flex flex-col border-gray-200 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center h-[64px] px-6 border-b border-gray-200 ml-3">
        <img
          src="/src/assets/wombly-logo.png"
          alt="womblylogo"
          className="w-[40px] h-[40px] bg-[#FCF5EE] rounded-lg"
        />
        <div className="ml-3 leading-tight">
          <h1 className="text-[17px] font-semibold text-gray-900">Wombly</h1>

        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col justify-between flex-1">
        <div>
          <p className="ml-8 mt-5 text-[14px] font-semibold text-left text-gray-400 uppercase mb-2">
            OVERVIEW
          </p>
          <nav className="px-8 space-y-2">
            {user?.role === "Secretary" ? (
              <SidebarLink icon={<HomeIcon fontSize="medium" />} text="Dashboard" to="/secretarydashboard" />
            ) : (
              <>
                <SidebarLink icon={<HomeIcon fontSize="medium" />} text="Dashboard" to="/dashboard" />
                <SidebarLink icon={<QuestionAnswerIcon fontSize="medium" />} text="Inbox" to="/inbox" />
                <SidebarLink
                  icon={<Icon icon="material-symbols:library-books-rounded" width={20} height={20} />}
                  text="Articles"
                  to="/articlepage"
                />
              </>
            )}
          </nav>

          <p className="ml-8 mt-6 text-[14px] font-semibold text-left text-gray-400 uppercase mb-2">
            MANAGEMENT
          </p>
          <nav className="px-8 space-y-2">
            {user?.role === "Secretary" ? (
              <>
                <SidebarLink icon={<CalendarMonthIcon fontSize="medium" />} text="Appointments" to="/secretarydashboard/appointmentdirectory" />
                <SidebarLink icon={<PeopleIcon fontSize="medium" />} text="Patient" to="/secretarydashboard/patientdirectory" />
              </>
            ) : (
              <>
                <SidebarLink icon={<CalendarMonthIcon fontSize="medium" />} text="Appointments" to="/appointments" />
                <SidebarLink icon={<PeopleIcon fontSize="medium" />} text="Patients" to="/patientdirectory" />
                {user?.role === "OBGYN" && (
                  <SidebarLink
                    icon={<PersonSearchOutlinedIcon fontSize="medium" />}
                    text="Secretary"
                    to="/secretarymanagement"
                  />
                )}
              </>
            )}

          </nav>
        </div>

        {/* Account */}
        {/* Account */}
        <div className="px-8 mb-6 space-y-2">
          <p className="text-[14px] font-semibold uppercase text-left text-gray-400 mb-2">
            Account
          </p>
          {user?.role === "Secretary" ? (
            <SidebarLink
              icon={<SettingsIcon fontSize="medium" />}
              text="Settings"
              to="/secretarydashboard/settings"
            />
          ) : (
            <SidebarLink
              icon={<SettingsIcon fontSize="medium" />}
              text="Settings"
              to="/settings"
            />
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 w-full"
          >
            <LogoutIcon fontSize="medium" />
            <span className="text-base cursor-pointer">Logout</span>
          </button>
        </div>


        {/* Footer Section */}
        <div className=" text-center text-xs text-gray-400">
          <p>v{packageJson.version}</p>
          <p>© {new Date().getFullYear()} Wombly. All rights reserved.</p>
        </div>

      </div>
    </aside>
  );
}

type SidebarLinkProps = {
  icon: React.ReactNode;
  text: string;
  to: string;
};

function SidebarLink({ icon, text, to }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium ${isActive ? "bg-[#E5E7EB] text-[#4B5563] w-[190px]" : "text-gray-700 hover:bg-gray-100"
        }`
      }
      end={to === "/dashboard" || to === "/secretarydashboard"}
    >
      {icon}
      <span className="text-base">{text}</span>
    </NavLink>
  );
}