import React from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

type HeaderProps = {
  name?: string;
  title?: string;
  avatarUrl?: string;
  hasNotifications?: boolean;
};

function Header({
  name = 'Dr. Sarah Johnson',
  title = 'OBGYN',
  avatarUrl,
  hasNotifications = false,
}: HeaderProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="flex justify-end items-center gap-4 px-6 py-4 bg-white shadow-sm h-15 relative mb-2">
      {/* Notification Bell */}
      <Popover>
        <PopoverTrigger asChild>
          <div
            className="relative cursor-pointer hover:shadow-md rounded-full transition"
            role="button"
            tabIndex={0}
            aria-label="Toggle notifications"
          >
            <div className="relative bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
              <NotificationsIcon className="text-gray-600" fontSize="medium" />
              {hasNotifications && (
                <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3 border-2 border-white" />
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="min-w-[300px] p-4 bg-white border border-gray-100">
          <p className="text-sm text-muted-foreground">No new notifications</p>
        </PopoverContent>
      </Popover>

      {/* Separator */}
      <div className="h-6 border-l border-gray-300 mx-4" />

      {/* Avatar + Name with Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex sm:flex-row flex-col items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded-md transition text-center sm:text-left">
            <Avatar className="w-10 h-10">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="text-sm leading-tight">
              <p className="font-semibold text-gray-800">{name}</p>
              <p className="text-gray-500 text-xs">{title}</p>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-44 p-2 bg-white border border-gray-100">
          <div className="text-sm text-gray-700 space-y-1">
            <button className="w-full text-left hover:bg-gray-100 px-2 py-1 rounded-md">Edit Profile</button>
            <button className="w-full text-left hover:bg-gray-100 px-2 py-1 rounded-md">Settings</button>
            <button className="w-full text-left hover:bg-gray-100 px-2 py-1 rounded-md text-red-500">Logout</button>
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
}

export default React.memo(Header);
