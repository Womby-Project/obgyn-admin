// src/pages/VideoCallPage.tsx
import { useParams, useSearchParams } from "react-router-dom";
// If your component is a *named* export, use:
// import { VideoCall } from "@/components/modals/videoCall";
import VideoCall from "@/components/modals/videoCall";
export default function VideoCallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();

  const callId = searchParams.get("callId") || "";
  const callerName = searchParams.get("callerName") || "You";
  const calleeName = searchParams.get("calleeName") || "Other User";
  const profileUrl = searchParams.get("profileUrl") || undefined;
  const remoteProfileUrl = searchParams.get("remoteProfileUrl") || undefined;

  if (!roomId) return <div>Invalid room</div>;
  if (!callId) return <div>Missing callId</div>; // 🔴 this was the culprit

  return (
    <VideoCall
      callId={callId}                 // ✅ pass the row id
      roomId={roomId}
      callerName={callerName}
      calleeName={calleeName}
      profileUrl={profileUrl}
      remoteProfileUrl={remoteProfileUrl}
      onClose={() => window.close()}
    />
  );
}
