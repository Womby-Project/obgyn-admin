import { Video, PhoneMissed } from "lucide-react";

type CallCardProps = {
  type: "missed" | "received";
  name: string;
  time: string;
  duration?: string;
};

export default function CallCard({ type, name, time, duration }: CallCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 max-w-xs">
      {type === "missed" ? (
        <PhoneMissed className="text-red-500 w-6 h-6" />
      ) : (
        <Video className="text-green-500 w-6 h-6" />
      )}
      <div className="flex flex-col">
        <span className="font-medium text-sm">
          {type === "missed" ? `Missed call with ${name}` : `Video call with ${name}`}
        </span>
        <span className="text-xs text-gray-500">{time}{duration ? ` • ${duration}` : ""}</span>
      </div>
    </div>
  );
}
