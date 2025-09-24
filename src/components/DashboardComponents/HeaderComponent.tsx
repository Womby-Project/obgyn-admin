import React from "react";
import { useNavigate } from "react-router-dom";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabaseClient";
import { Icon } from "@iconify/react";
import { useProfile } from "@/hooks/hooksforNotifcation/useProfile";
import { useNotifications } from "@/hooks/hooksforNotifcation/useNotifcation";
import { NotificationList } from "@/components/NotificationList";

function Header() {
  const profile = useProfile();
  const { notifications, setNotifications } = useNotifications(profile?.id);

  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const initial = profile?.name?.charAt(0).toUpperCase() || "?";

  const handleNotificationClick = async (notif: any) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    );

    if (notif.related_appointment_id) {
      if (profile?.role === "obgyn") navigate(`/appointments`);
      if (profile?.role === "secretary") navigate(`/secretarydashboard/appointmentdirectory`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="flex justify-end items-center gap-1 px-6 py-4 bg-white shadow-sm h-16 relative mb-2">
      {/* 🔔 Notifications */}
      <Popover>
        <PopoverTrigger asChild>
          <div
            className="relative cursor-pointer hover:shadow-md rounded-full transition"
            role="button"
            tabIndex={0}
          >
            <div className="relative bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
              <NotificationsIcon className="text-gray-600" fontSize="medium" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="min-w-[350px] p-4 bg-white border border-gray-100">
          <NotificationList notifications={notifications} onClick={handleNotificationClick} />
        </PopoverContent>
      </Popover>

      {/* Separator */}
      <div className="h-6 border-l border-gray-300 mx-4" />

      {/* 👤 Avatar + Name */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex sm:flex-row flex-col items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded-md transition text-center sm:text-left">
            <Avatar className="w-10 h-10 bg-gray-100">
              <AvatarImage src={profile?.avatar_url || ""} alt={profile?.name} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm leading-tight">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900 text-base">
                  <span className="font-bold">
                    {profile?.role === "obgyn"
                      ? "Dr. "
                      : profile?.role === "secretary"
                        ? "Sec. "
                        : ""}
                  </span>
                  {profile?.name || "Loading..."}
                </span>
                {profile?.is_verified && (
                  <Icon icon="mdi:approval" className="h-4 w-4 text-blue-400" />
                )}
              </div>
            </div>

          </div>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-44 p-2 bg-white border border-gray-100">
          <div className="text-sm text-gray-700 space-y-1">
            <button
              onClick={handleLogout}
              className="w-full text-left hover:bg-gray-100 px-2 py-1 rounded-md text-red-500"
            >
              Logout Account
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
}

export default React.memo(Header);
