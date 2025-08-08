import Sidebar from "@/components/DashboardComponents/SidebarComponent";
import Header from "@/components/DashboardComponents/HeaderComponent"
import OBGYNSettings from "@/components/SettingsComponents/OBGYNSettings"

export default function OBGYNSetting() {
    return (
        <div className="flex min-h-screen  ">
            <div className="hidden md:block">
                <Sidebar />
            </div>
            {/* Header */}
            <div className="flex flex-col flex-1 md:ml-[250px] ml-0 transition-all duration-300 shadow-sm  bg-gray-50 pb-5">
                <header className="fixed top-0 left-0 md:left-[260px] right-0 h-10 bg-white shadow-sm z-10">
                    <Header />
                </header>



                {/* This should be the content where who is logged in logic soon for example if the obgyn is loogin then go to settings the component for obgyn settings will be shown */}
            <OBGYNSettings />
            </div>


        </div>
    )
}