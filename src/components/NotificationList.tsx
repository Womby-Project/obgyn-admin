// components/NotificationList.tsx
import type { Notification } from "@/hooks/hooksforNotifcation/useNotifcation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


type Props = {
  notifications: Notification[];
  onClick: (notif: Notification) => void;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
};

export function NotificationList({
  notifications,
  onClick,
  onMarkAllRead,
  onViewAll,
}: Props) {
  return (
    <div className="flex flex-col h-80">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
        {onMarkAllRead && notifications.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-indigo-600 hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No new notifications</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`p-4 rounded-md flex gap-3 border transition ${notif.is_read
                  ? "bg-gray-50 border-gray-200"
                  : "bg-indigo-50 border-indigo-200"
                  }`}
              >
                {/* Left: Avatar */}
                <Avatar className="w-12 h-12 bg-gray-100 shrink-0">
                  {notif.appointments?.patient_users?.profile_avatar_url ? (
                    <AvatarImage
                      src={notif.appointments.patient_users.profile_avatar_url}
                      alt="Patient avatar"
                    />
                  ) : (
                    <AvatarFallback>
                      {notif.appointments?.patient_users?.full_name
                        ? notif.appointments.patient_users.full_name.charAt(0).toUpperCase()
                        : notif.recipient_role?.charAt(0).toUpperCase() || "N"}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Right: Content */}
                <div className="flex flex-col flex-1">
                  <p className="text-sm text-gray-800 leading-snug">
                    {notif.message}
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
                    {new Date(notif.created_at).toLocaleString(undefined, {
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
        )}
      </div>

      {/* Footer */}
      {onViewAll && (
        <div className="mt-3">
          <button
            onClick={onViewAll}
            className="text-sm text-indigo-600 hover:underline cursor-pointer"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
