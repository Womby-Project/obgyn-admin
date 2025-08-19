
import OBGYNSettings from "@/components/SettingsComponents/OBGYNSettings"

export default function OBGYNSetting() {
    return (
        <div className="flex min-h-screen  ">
        
            {/* Header */}
            <div className="flex flex-col  ml-0 transition-all duration-300 shadow-sm  bg-gray-50 pb-5">
              



                {/* This should be the content where who is logged in logic soon for example if the obgyn is loogin then go to settings the component for obgyn settings will be shown */}
            <OBGYNSettings />
            </div>


        </div>
    )
}