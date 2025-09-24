import React, { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import { getAgoraToken } from "@/utils/agora";
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  roomId: string;
  callerName: string;
  calleeName: string;
  onClose?: () => void;
  profileUrl?: string;
  remoteProfileUrl?: string;
};

export default function VideoCall({ roomId, onClose, profileUrl, remoteProfileUrl, callerName,
  calleeName, }: Props) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const [joined, setJoined] = useState(false);
  const [micTrack, setMicTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [camTrack, setCamTrack] = useState<ICameraVideoTrack | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [remoteCamEnabled, setRemoteCamEnabled] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);

  const [callStarted, setCallStarted] = useState(false);
  const [duration, setDuration] = useState(0);

  // force object-fit: cover for all videos
  const enforceVideoStyle = (container: HTMLDivElement | null) => {
    if (!container) return;
    const videoEl = container.querySelector("video") as HTMLVideoElement | null;
    if (videoEl) {
      videoEl.style.objectFit = "cover";
      videoEl.style.width = "100%";
      videoEl.style.height = "100%";
    }
  };

  useEffect(() => {
    joinCall();
    return () => {
      leaveCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (joined && remoteJoined && !callStarted) {
      setCallStarted(true);
      setDuration(0);
    }
  }, [joined, remoteJoined, callStarted]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (callStarted) {
      interval = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStarted]);

  const joinCall = async () => {
    if (joined) return;

    const uid = Math.floor(Math.random() * 100000);
    const { token, appId } = await getAgoraToken(roomId, uid);

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    await client.join(appId, roomId, token, uid);

    let localMic: IMicrophoneAudioTrack | null = null;
    let localCam: ICameraVideoTrack | null = null;

    try {
      [localMic, localCam] = await AgoraRTC.createMicrophoneAndCameraTracks();
      if (localCam && localVideoRef.current) {
        localCam.play(localVideoRef.current, { fit: "cover" });
        enforceVideoStyle(localVideoRef.current);
      }
    } catch (err) {
      console.warn("No camera or microphone detected.", err);
    }

    const tracksToPublish = [localMic, localCam].filter(Boolean) as any[];
    if (tracksToPublish.length > 0) await client.publish(tracksToPublish);

    setMicTrack(localMic);
    setCamTrack(localCam);
    setJoined(true);

    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      setRemoteJoined(true);

      if (mediaType === "video" && remoteVideoRef.current) {
        (user.videoTrack as IRemoteVideoTrack)?.play(remoteVideoRef.current, { fit: "cover" });
        enforceVideoStyle(remoteVideoRef.current);
        setRemoteCamEnabled(true);
      }
      if (mediaType === "audio") user.audioTrack?.play();
    });

    client.on("user-unpublished", (user, type) => {
      if (type === "video") {
        setRemoteCamEnabled(false);
      }
    });

    client.on("user-left", () => {
      setRemoteJoined(false);
      setRemoteCamEnabled(false);
      setCallStarted(false);
    });
  };

  const leaveCall = async () => {
    if (!clientRef.current) return;

    await clientRef.current.leave();
    clientRef.current.removeAllListeners();
    micTrack?.close();
    camTrack?.close();
    setMicTrack(null);
    setCamTrack(null);
    setJoined(false);
    setCallStarted(false);

    await supabase
      .from("chat_calls")
      .update({ ended_at: new Date() })
      .eq("room_id", roomId)
      .is("ended_at", null);

    onClose?.();
    window.close();
  };

  const toggleMic = () => {
    if (!micTrack) return;
    micTrack.setEnabled(!micEnabled);
    setMicEnabled(!micEnabled);
  };

  const toggleCam = () => {
    if (!camTrack) return;
    camTrack.setEnabled(!camEnabled);
    setCamEnabled(!camEnabled);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const bothCamsOn = camEnabled && remoteCamEnabled;

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      {/* --- Video Area --- */}
      {bothCamsOn ? (
        <div className="flex w-full h-full">
          {/* Local Video */}
          <div ref={localVideoRef} className="flex-1 bg-black relative">
            {!camEnabled && profileUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-cover bg-center blur-lg"
                  style={{ backgroundImage: `url(${profileUrl})` }}
                />
                <img
                  src={profileUrl}
                  alt="Local profile"
                  className="relative w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                />
              </div>
            )}
          </div>

          {/* Remote Video */}
          <div ref={remoteVideoRef} className="flex-1 bg-black relative">
            {!remoteCamEnabled && remoteProfileUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-cover bg-center blur-lg"
                  style={{ backgroundImage: `url(${remoteProfileUrl})` }}
                />
                <img
                  src={remoteProfileUrl}
                  alt="Remote profile"
                  className="relative w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Remote video full background */}
          <div ref={remoteVideoRef} className="absolute inset-0 bg-black">
            {!remoteCamEnabled && remoteProfileUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-cover bg-center blur-lg"
                  style={{ backgroundImage: `url(${remoteProfileUrl})` }}
                />
                <img
                  src={remoteProfileUrl}
                  alt="Remote profile"
                  className="relative w-40 h-40 rounded-full border-4 border-white shadow-xl object-cover"
                />
              </div>
            )}
          </div>

          {/* Local video PiP */}
          <div
            ref={localVideoRef}
            className="absolute bottom-4 right-4 w-40 h-28 rounded-lg overflow-hidden shadow-lg bg-gray-800 border border-gray-700"
          >
            {!camEnabled && profileUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-cover bg-center blur-lg"
                  style={{ backgroundImage: `url(${profileUrl})` }}
                />
                <img
                  src={profileUrl}
                  alt="Local profile"
                  className="relative w-20 h-20 rounded-full border-2 border-white shadow-lg object-cover"
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* --- Top bar --- */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 bg-black/40 backdrop-blur-sm">
        <h2 className="font-semibold text-lg text-white">
    {callStarted
      ? `In Call - ${callerName}, ${calleeName}`
      : joined
      ? "Waiting for other user..."
      : "Connecting..."}
  </h2>

        <button onClick={leaveCall} className="p-2 rounded-full hover:bg-gray-700 transition">
          <X size={22} className="text-gray-300" />
        </button>
      </div>

      {/* --- Timer --- */}
      {callStarted && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold">
          {formatDuration(duration)}
        </div>
      )}

      {/* --- Controls --- */}
      {callStarted && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
          <button
            onClick={toggleMic}
            className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition ${micEnabled ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
          >
            {micEnabled ? (
              <Mic size={22} className="text-white" />
            ) : (
              <MicOff size={22} className="text-white" />
            )}
          </button>
          <button
            onClick={toggleCam}
            className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition ${camEnabled ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
          >
            {camEnabled ? (
              <Video size={22} className="text-white" />
            ) : (
              <VideoOff size={22} className="text-white" />
            )}
          </button>
          <button
            onClick={leaveCall}
            className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-red-500 hover:bg-red-600 transition"
          >
            <PhoneOff size={24} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
