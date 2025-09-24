// src/pages/VideoCallPage.tsx
import { useParams, useSearchParams } from "react-router-dom";
import VideoCall from "@/components/modals/videoCall";

export default function VideoCallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const profileUrlParam = searchParams.get("profileUrl");
  const remoteProfileUrlParam = searchParams.get("remoteProfileUrl");


  if (!roomId) return <div>Invalid room</div>;

  return (
    <VideoCall
      roomId={roomId}
      onClose={() => window.close()}
      profileUrl={profileUrlParam ? profileUrlParam : undefined}
      remoteProfileUrl={remoteProfileUrlParam ? remoteProfileUrlParam : undefined}
      callerName={searchParams.get("callerName") || "You"}
      calleeName={searchParams.get("calleeName") || "Other User"}
    />

  );
}
