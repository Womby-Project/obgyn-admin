// components/NotificationList.tsx
import type { Notification } from "@/hooks/hooksforNotifcation/useNotifcation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  notifications: Notification[];
  onClick: (notif: Notification) => void;
};

export function NotificationList({ notifications, onClick }: Props) {
  if (notifications.length === 0) {
    return <p className="text-sm text-muted-foreground">No new notifications</p>;
  }

  return (
    <ul className="space-y-3">
      {notifications.map((notif) => (
        <li
          key={notif.id}
          className={`p-4 rounded-md flex gap-3 border ${
            notif.is_read ? "bg-gray-50 border-gray-200" : "bg-indigo-50 border-indigo-200"
          }`}
        >
          {/* Left: Avatar */}
          <Avatar className="w-12 h-12 bg-gray-100 shrink-0">
            <AvatarImage src={(notif as any).patient_avatar_url || ""} />
            <AvatarFallback>
              {(notif as any).patient_name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          {/* Right: Content */}
          <div className="flex flex-col flex-1">
            <p className="text-sm text-gray-800 leading-snug">
              <span className="font-semibold">
                {(notif as any).patient_name || "Patient"}
              </span>{" "}
              {notif.message.split("appointment for")[0]}{" "}
              <span className="font-semibold">
                {notif.message.split("appointment for")[1]}
              </span>
            </p>

            {notif.related_appointment_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(notif);
                }}
                className="mt-2 self-start px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600"
              >
                See Appointment
              </button>
            )}

            <span className="text-xs text-gray-500 mt-2">
              {new Date((notif as any).created_at).toLocaleString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
