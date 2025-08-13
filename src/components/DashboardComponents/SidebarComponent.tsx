// src/components/Sidebar.tsx

import { NavLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';

export default function Sidebar() {
    return (
        <aside className="fixed left-0 w-[260px] bg-white border-r h-screen shadow-md flex flex-col border-gray-200 overflow-hidden">
            {/* Logo and App Name */}
            <div className="flex items-center h-[64px] px-6 border-b border-gray-200">
               <img
                    src="/src/assets/wombly-logo.png"
                    alt="womblylogo"
                    className="w-[40px] h-[40px] bg-[#FCF5EE] rounded-lg"
                /> 
                <div className="ml-3 leading-tight">
                    <h1 className="text-[17px] font-semibold text-gray-900">Wombly</h1>
                    <p className="text-[13px] text-gray-500">OBGYN-Dashboard</p>
                </div>
            </div>


            {/* Navigation */}
            <div className="flex flex-col justify-between flex-1">
                <div>
                    {/* Overview Section */}
                    <p className="ml-8 mt-5 text-[14px] font-semibold text-left text-gray-400 uppercase mb-2">
                        OVERVIEW
                    </p>
                    <nav className="px-8 space-y-2">
                        <SidebarLink icon={<HomeIcon fontSize="medium" />} text="Dashboard" to="/" />
                        <SidebarLink icon={<QuestionAnswerIcon fontSize="medium" />} text="Inbox" to="/inbox" />
                    </nav>

                    {/* Management Section */}
                    <p className="ml-8 mt-6 text-[14px] font-semibold text-left text-gray-400 uppercase mb-2">
                        MANAGEMENT
                    </p>
                    <nav className="px-8 space-y-2">
                        <SidebarLink icon={<CalendarMonthIcon fontSize="medium" />} text="Appointments" to="/appointments" />
                        <SidebarLink icon={<PeopleIcon fontSize="medium" />} text="Patients" to="/patientdirectory" />
                        <SidebarLink icon={<PersonSearchOutlinedIcon fontSize="medium" />} text="Secretary" to="/secretarymanagement" />
                    </nav>
                </div>

                {/* Account Settings at bottom */}
                <div className="px-8 mb-6 space-y-2">
                    <p className="text-[14px] font-semibold uppercase text-left text-gray-400 mb-2">
                        Account
                    </p>
                    <SidebarLink icon={<SettingsIcon fontSize="medium" />} text="Settings" to="/settings" />
                    <SidebarLink icon={<LogoutIcon fontSize="medium" />} text="Logout" to="/logout" />
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
                `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-[#E5E7EB] text-[#4B5563] w-[190px]' : 'text-gray-700 hover:bg-gray-100'
                }`
            }
        >
            {icon}
            <span className="text-base">{text}</span>
        </NavLink>
    );
}
