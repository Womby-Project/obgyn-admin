import CustomTabs from "@/components/ui/CustomTabs"
import Profilepage from "@/components/SettingsComponents/OBGYNProfile"
import SecurityPage from "@/components/SettingsComponents/OBGYNSecurityPage"
import AvailabilityPage from "@/components/SettingsComponents/OBGYNAvailability"


export default function SettingsOBGYN() {
    const tabs = [
        {
            label: "Profile",
            value: "profile",
            content: (
                <Profilepage  />
            ),
            
        },
        {
            label:
                "Security",
            value: "security",
            content: <SecurityPage />
        },
        {
            label: "Availability",
            value: "availability",
            content: <AvailabilityPage />
        },
    ]

    return (
        <main className="fixed top-10 left-0 md:left-[260px] right-0 bottom-0 overflow-hidden mt-2">
            <div className="h-full w-full overflow-y-auto scrollbar-hide p-4 md:p-6">
                <div className="bg-white rounded-[5px] shadow-md w-full p-4 sm:p-6 mt-2">
                    <div className="flex flex-col gap-1 mb-6">
                        <h1 className="text-[18px] sm:text-[20px] md:text-[24px] font-lato font-semibold">
                            Settings
                        </h1>
                        <h2 className="text-[11px] sm:text-[12px] font-lato text-gray-500">
                            Manage your account preferences and system configurations.
                        </h2>
                    </div>
                    <CustomTabs tabs={tabs} defaultValue="profile"   />
                </div>
            </div>
        </main>
    )
}
