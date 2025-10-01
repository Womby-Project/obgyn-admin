import React, { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteVideoTrack,
  type IRemoteAudioTrack,
  type IAgoraRTCRemoteUser,
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
  disableLocalCamOnStart?: boolean;
};

export default function VideoCall({
  roomId,
  onClose,
  profileUrl,
  remoteProfileUrl,
  callerName,
  calleeName,
  disableLocalCamOnStart = false,
}: Props) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  // refs for DOM video containers
  const localMainRef = useRef<HTMLDivElement | null>(null);
  const localPipRef = useRef<HTMLDivElement | null>(null);
  const remoteMainRef = useRef<HTMLDivElement | null>(null);
  const remoteSplitRef = useRef<HTMLDivElement | null>(null);

  const [joined, setJoined] = useState(false);
  const [micTrack, setMicTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [camTrack, setCamTrack] = useState<ICameraVideoTrack | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [remoteCamEnabled, setRemoteCamEnabled] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);

  const [callStarted, setCallStarted] = useState(false);
  const [duration, setDuration] = useState(0);

  const [splitView, setSplitView] = useState(false);

  // store own uid
  const uidRef = useRef<number | null>(null);
  // store active remote
  const remoteUserRef = useRef<IAgoraRTCRemoteUser | null>(null);

  const enforceVideoStyle = (container: HTMLDivElement | null) => {
    if (!container) return;
    const videoEl = container.querySelector("video") as HTMLVideoElement | null;
    if (videoEl) {
      videoEl.style.objectFit = "cover";
      videoEl.style.width = "100%";
      videoEl.style.height = "100%";
    }
  };

  const playTrack = (
    track: ICameraVideoTrack | IRemoteVideoTrack | null,
    container: HTMLDivElement | null
  ) => {
    if (track && container) {
      try {
        container.innerHTML = ""; // clear old track
        track.stop(); // ✅ make sure it detaches from any old container
        track.play(container, { fit: "cover" });
        enforceVideoStyle(container);
      } catch (err) {
        console.warn("playTrack error", err);
      }
    }
  };




  // re-attach when layout or states change
  useEffect(() => {
    if (camTrack) {
      // Always show yourself in PiP, never in main
      playTrack(camTrack, localPipRef.current);
    }

    const remote = remoteUserRef.current;
    if (remote && remote.videoTrack) {
      // Only remote should occupy main/split
      if (splitView) playTrack(remote.videoTrack, remoteSplitRef.current);
      else playTrack(remote.videoTrack, remoteMainRef.current);
    }
  }, [splitView, camTrack, remoteCamEnabled, remoteJoined]);

  useEffect(() => {
    joinCall();
    return () => {
      leaveCall();
    };
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
    if (!roomId) return;

    const uid = Math.floor(Math.random() * 100000);
    uidRef.current = uid;

    const { token, appId } = await getAgoraToken(roomId, uid);

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    await client.join(appId, roomId, token, uid);

    let localMic: IMicrophoneAudioTrack | null = null;
    let localCam: ICameraVideoTrack | null = null;

    try {
      // 👇 only fetch local cam if not disabled
      if (!disableLocalCamOnStart) {
        [localMic, localCam] = await AgoraRTC.createMicrophoneAndCameraTracks();

        // ✅ Always play local cam in PiP (never in main area)
        if (localCam && localPipRef.current) {
          localCam.play(localPipRef.current, { fit: "cover" });
          enforceVideoStyle(localPipRef.current);
        }
      }
    } catch (err) {
      console.warn("No camera or microphone detected.", err);
    }

    // publish only if tracks exist
    const toPublish = [localMic, localCam].filter(Boolean) as any[];
    if (toPublish.length > 0) await client.publish(toPublish);

    setMicTrack(localMic);
    setCamTrack(localCam);
    setJoined(true);

    // remote users
    client.on("user-published", async (user, mediaType) => {
      if (user.uid === uidRef.current) return; // skip self

      await client.subscribe(user, mediaType);
      remoteUserRef.current = user;
      setRemoteJoined(true);

      if (mediaType === "video" && user.videoTrack) {
        // ✅ Remote goes into main or split view
        setTimeout(() => {
          if (splitView) {
            playTrack(user.videoTrack!, remoteSplitRef.current);
          } else {
            playTrack(user.videoTrack!, remoteMainRef.current);
          }
        }, 100);

        setRemoteCamEnabled(true);
      }

      if (mediaType === "audio") {
        (user.audioTrack as IRemoteAudioTrack | undefined)?.play?.();
      }
    });

    client.on("user-unpublished", (user, mediaType) => {
      if (user.uid === uidRef.current) return;

      if (mediaType === "video") {
        setRemoteCamEnabled(false);
        if (remoteUserRef.current?.uid === user.uid) {
          remoteUserRef.current = null;
        }
      }
    });

    client.on("user-left", (user) => {
      if (user.uid === uidRef.current) return;

      if (remoteUserRef.current?.uid === user.uid) {
        remoteUserRef.current = null;
        setRemoteJoined(false);
        setRemoteCamEnabled(false);
        setCallStarted(false);
      }
    });
  };


  const leaveCall = async () => {
    if (!clientRef.current) return;

    try {
      await clientRef.current.leave();
    } catch { }
    clientRef.current.removeAllListeners?.();
    micTrack?.close();
    camTrack?.close();
    setMicTrack(null);
    setCamTrack(null);
    setJoined(false);
    setCallStarted(false);

    try {
      await supabase
        .from("chat_calls")
        .update({ ended_at: new Date() })
        .eq("room_id", roomId)
        .is("ended_at", null);
    } catch (e) {
      console.warn("Failed updating call ended_at", e);
    }

    onClose?.();
    try {
      window.close();
    } catch { }
  };

  // Toggle mic
  const toggleMic = async () => {
    if (!micTrack) return;

    const enabled = micTrack.enabled;
    if (enabled) {
      await micTrack.setEnabled(false); // mute mic
      setMicEnabled(false);
    } else {
      await micTrack.setEnabled(true); // unmute mic
      setMicEnabled(true);
    }
  };

  // Toggle cam
  const toggleCam = async () => {
    if (!camTrack) return;

    const enabled = camTrack.enabled;
    await camTrack.setEnabled(!enabled);
    setCamEnabled(!enabled);

    if (enabled) {
      // turning cam OFF → let JSX show placeholder
      camTrack.stop(); // optional, but keeps container clean
    } else {
      // turning cam ON → replay into PiP
      if (localPipRef.current) {
        camTrack.play(localPipRef.current, { fit: "cover" });
        enforceVideoStyle(localPipRef.current);
      }
    }
  };




  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const onLocalPipClick = () => setSplitView((s) => !s);

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      {splitView ? (
        <div className="flex w-full h-full">
          <div ref={remoteSplitRef} className="flex-1 bg-black relative">
            {!remoteCamEnabled && remoteProfileUrl && (
              <ProfilePlaceholder url={remoteProfileUrl} large />
            )}
          </div>

          {/* Local video ALWAYS stays PiP */}
          <div
            ref={localPipRef}
            onClick={onLocalPipClick}
            className="absolute bottom-4 right-4 w-40 h-28 rounded-lg overflow-hidden shadow-lg bg-gray-800 border border-gray-700 cursor-pointer"
          >
            {!camEnabled && profileUrl && (
              <ProfilePlaceholder url={profileUrl} small />
            )}
          </div>

        </div>
      ) : (
        <>
          <div ref={remoteMainRef} className="absolute inset-0 bg-black">
            {!remoteCamEnabled && remoteProfileUrl && (
              <ProfilePlaceholder url={remoteProfileUrl} large />
            )}
          </div>
          <div
            ref={localPipRef}
            onClick={onLocalPipClick}
            className="absolute bottom-4 right-4 w-40 h-28 rounded-lg overflow-hidden shadow-lg bg-gray-800 border border-gray-700 cursor-pointer"
          >
            {!camEnabled && profileUrl && (
              <ProfilePlaceholder url={profileUrl} small />
            )}
          </div>
        </>
      )}

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 bg-black/40 backdrop-blur-sm">
        <h2 className="font-semibold text-lg text-white">
          {callStarted
            ? `In Call - ${callerName}, ${calleeName}`
            : joined
              ? "Waiting for other user..."
              : "Connecting..."}
        </h2>
        <button
          onClick={leaveCall}
          className="p-2 rounded-full hover:bg-gray-700 transition"
        >
          <X size={22} className="text-gray-300" />
        </button>
      </div>

      {callStarted && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold">
          {formatDuration(duration)}
        </div>
      )}

      {callStarted && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
          <button
            onClick={toggleMic}
            className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition ${micEnabled
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-700 hover:bg-gray-600"
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
            className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition ${camEnabled
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-700 hover:bg-gray-600"
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

function ProfilePlaceholder({
  url,
  large,
  small,
}: {
  url: string;
  large?: boolean;
  small?: boolean;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center blur-lg"
        style={{ backgroundImage: `url(${url})` }}
      />
      <img
        src={url}
        alt="Profile"
        className={`relative rounded-full border-4 border-white shadow-xl object-cover ${large
          ? "w-40 h-40"
          : small
            ? "w-20 h-20 border-2"
            : "w-32 h-32"
          }`}
      />
    </div>
  );
}
