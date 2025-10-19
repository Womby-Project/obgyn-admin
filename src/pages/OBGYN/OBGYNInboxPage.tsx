// OBGYNInboxPage.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import SearchIcon from "@mui/icons-material/Search";
import rebeca from "@/assets/rebeca.png";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMissedIcon from "@mui/icons-material/CallMissed";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { supabase } from "@/lib/supabaseClient";
import VideoCall from "@/components/modals/videoCall";
import type { User } from "@supabase/supabase-js";
import { useParams, useLocation } from "react-router-dom";
import RightChatPanel from "@/components/InboxComponent/RightChatPanel";

// ------------------ TYPES ------------------
type ChatUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_avatar_url?: string | null;
  profile_picture_url?: string | null;
};

type ChatMessage = {
  status: string;
  id: string;
  sender_id: string;
  message: string;
  room_id: string;
  created_at: string;
  seen?: boolean;
  seen_at?: string | null;
  message_type?: "text" | "image" | "file" | "call";
  file_url?: string | null;
};

type ChatRoom = {
  id: string;
  patient: ChatUser | null;
  obgyn: ChatUser | null;
  chat_messages: ChatMessage[];
  created_at: string;
};

type ChatPreview = {
  id: string;
  name: string;
  img: string;
  message: string;
  time: string;
  hasUnseen: boolean;
  participants: string[];
};

type AppointmentRow = {
  id: string;
  call_seconds_limit: number | null;
  call_seconds_used: number | null;
  chat_messages_limit: number | null;
  chat_messages_used: number | null;
  status: string;
  completed_manually: boolean | null;
  appointment_datetime?: string | null;
};

// ------------------ PAGE ------------------
export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"Chats" | "Calls">("Chats");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { patientId } = useParams<{ patientId?: string }>();
  const location = useLocation();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  // ✅ Get logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("❌ Error fetching user:", error.message);
        return;
      }
      setCurrentUser(data.user);
    };
    fetchUser();
  }, []);

  const autoCall = location.state?.autoCall;

  useEffect(() => {
    if (!patientId || !currentUser || chats.length === 0) return;
    const targetChat = chats.find((c) => c.participants.includes(patientId));
    if (targetChat) {
      setSelectedChatId(targetChat.id);
      if (autoCall) {
        handleStartCall(targetChat.id);
      }
    }
  }, [patientId, chats, autoCall, currentUser]);

  // 🔎 find the most recent active appointment between current OB-GYN and patient
  const fetchActiveAppointmentFor = useCallback(
    async (patientUserId: string): Promise<AppointmentRow | null> => {
      if (!currentUser?.id) return null;
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, call_seconds_limit, call_seconds_used, chat_messages_limit, chat_messages_used, status, completed_manually, appointment_datetime"
        )
        .eq("patient_id", patientUserId)
        .eq("obgyn_id", currentUser.id)
        .not("status", "in", "(Done,Cancelled)")
        .order("appointment_datetime", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Active appointment lookup failed:", error.message);
        return null;
      }
      return (data as AppointmentRow) ?? null;
    },
    [currentUser?.id]
  );

  // ✅ Start call (kept in page; button is in RightChatPanel via prop)
  const handleStartCall = async (chatId: string) => {
    if (!currentUser) return;

    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const calleeId = chat.participants.find((p) => p !== currentUser.id);
    if (!calleeId) return;

    try {
      const appt = await fetchActiveAppointmentFor(calleeId);
      const remainingCall =
        Math.max(
          (appt?.call_seconds_limit ?? 0) - (appt?.call_seconds_used ?? 0),
          0
        ) || 0;

      if (!appt || appt.completed_manually || remainingCall <= 0) {
        alert(
          "No active appointment with remaining call time. Please ask the patient to rebook."
        );
        return;
      }

      // Reuse any active call row for this room
      const { data: existing, error: exErr } = await supabase
        .from("chat_calls")
        .select("id, status, ended_at")
        .eq("room_id", chatId)
        .is("ended_at", null)
        .limit(1)
        .maybeSingle();

      if (exErr) {
        console.error("❌ check active call failed:", exErr.message);
        return;
      }

      let callId = existing?.id ?? null;

      // Create a new row if none active — tie to appointment
      if (!callId) {
        const { data: inserted, error: insErr } = await supabase
          .from("chat_calls")
          .insert([
            {
              room_id: chatId,
              caller_id: currentUser.id,
              callee_id: calleeId,
              started_at: new Date().toISOString(),
              status: "ringing",
              appointment_id: appt.id,
            },
          ])
          .select("id")
          .single();

        if (insErr) {
          console.error("❌ Error creating call:", insErr.message);
          return;
        }
        callId = inserted.id;
      } else {
        await supabase
          .from("chat_calls")
          .update({ status: "ringing", ended_at: null })
          .eq("id", callId);
      }

      const callerName = currentUser.user_metadata?.full_name || "You";
      const calleeName = chat.name || "Other User";
      const profileUrl = currentUser.user_metadata?.profile_picture_url || "";
      const remoteProfileUrl = chat.img || "";

      const url =
        `/video-call/${chatId}` +
        `?callId=${encodeURIComponent(callId)}` +
        `&callerName=${encodeURIComponent(callerName)}` +
        `&calleeName=${encodeURIComponent(calleeName)}` +
        `&profileUrl=${encodeURIComponent(profileUrl)}` +
        `&remoteProfileUrl=${encodeURIComponent(remoteProfileUrl)}`;

      const popup = window.open(
        url,
        "VideoCallPopup",
        "width=900,height=650,toolbar=no,menubar=no,location=no,status=no"
      );
      if (popup) popup.focus();
    } catch (err) {
      console.error("❌ Unexpected error in handleStartCall:", err);
    }
  };

  // ✅ Fetch calls + chats
  useEffect(() => {
    if (!currentUser) return;

    const fetchCalls = async () => {
      try {
        const { data: callData, error } = await supabase
          .from("chat_calls")
          .select("*")
          .or(`caller_id.eq.${currentUser.id},callee_id.eq.${currentUser.id}`)
          .order("started_at", { ascending: false });

        if (error) throw error;
        if (!callData) return;

        const otherUserIds = [
          ...new Set(
            callData.map((c) =>
              c.caller_id === currentUser.id ? c.callee_id : c.caller_id
            )
          ),
        ];

        const { data: patientProfiles } = await supabase
          .from("patient_users")
          .select("id, first_name, last_name, profile_avatar_url")
          .in("id", otherUserIds);

        const profileMap: Record<
          string,
          { id: string; first_name: string; last_name: string; avatar: string }
        > = {};

        (patientProfiles || []).forEach((p) => {
          profileMap[p.id] = {
            ...p,
            avatar: p.profile_avatar_url || "/default-avatar.png",
          };
        });

        const callsWithProfiles = callData.map((c) => {
          const otherId =
            c.caller_id === currentUser.id ? c.callee_id : c.caller_id;
          const profile = profileMap[otherId];

          return {
            id: c.id,
            roomId: c.room_id,
            startedAt: c.started_at,
            endedAt: c.ended_at,
            name: profile
              ? `${profile.first_name} ${profile.last_name}`
              : "Unknown",
            img: profile?.avatar || "/default-avatar.png",
            type: c.ended_at ? "received" : "missed",
            time: new Date(c.started_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });

        setCalls(callsWithProfiles);
      } catch (err) {
        console.error("Error fetching calls:", err);
      }
    };

    const fetchChats = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_rooms")
          .select(
            `
            id,
            created_at,
            patient:patient_id (
              id,
              first_name,
              last_name,
              profile_avatar_url
            ),
            obgyn:obgyn_id (
              id,
              first_name,
              last_name,
              profile_picture_url
            ),
            chat_messages ( id, message, created_at, sender_id, seen, seen_at )
          `
          )
          .or(`patient_id.eq.${currentUser.id},obgyn_id.eq.${currentUser.id}`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedChats: ChatPreview[] =
          (data as unknown as ChatRoom[])?.map((room) => {
            const isObgyn = room.obgyn?.id === currentUser.id;
            const other = isObgyn ? room.patient : room.obgyn;

            const latestMsg = room.chat_messages?.length
              ? [...room.chat_messages].sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )[0]
              : null;

            const hasUnseen =
              latestMsg &&
              latestMsg.sender_id !== currentUser.id &&
              !latestMsg.seen_at;

            return {
              id: room.id,
              name: other
                ? `${other.first_name ?? ""} ${other.last_name ?? ""}`.trim()
                : "Unknown",
              img: other?.profile_avatar_url || (rebeca as any),
              message: latestMsg?.message || "No messages yet",
              time: latestMsg
                ? new Date(latestMsg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
              hasUnseen: Boolean(hasUnseen),
              participants: [room.patient?.id, room.obgyn?.id].filter(
                Boolean
              ) as string[],
            };
          }) || [];

        setChats(formattedChats);
      } catch (err) {
        console.error("❌ Error fetching chats:", err);
      }
    };

    fetchChats();
    fetchCalls();
  }, [currentUser]);

  // Auto incoming call mini-modal
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("patient_calls")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_calls",
          filter: `callee_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const call = payload.new as any;
          setActiveRoomId(call.room_id);
          setActiveCallId(call.id);
          setIsCalling(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const filteredChats = useMemo(
    () =>
      chats.filter((chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [chats, searchQuery]
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <div className="bg-white flex-shrink-0 w-[280px] rounded-lg shadow-sm flex flex-col">
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search Inbox"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-gray-100 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="relative flex justify-center gap-x-2 px-4">
          {["Chats", "Calls"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "Chats" | "Calls")}
              className={`w-1/2 pb-2 text-[15px] font-bold transition-colors ${
                activeTab === tab ? "text-gray-700" : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
          <div
            className="absolute bottom-0 h-[2px] w-1/2 bg-gray-700 transition-all duration-500"
            style={{ left: activeTab === "Chats" ? "0%" : "50%" }}
          />
        </div>

        {/* Chats / Calls List */}
        <div className="overflow-y-auto px-4 py-2 space-y-4 flex-1">
          {activeTab === "Chats" &&
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition ${
                  selectedChatId === chat.id
                    ? "bg-gray-200"
                    : chat.hasUnseen
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <img
                  src={chat.img}
                  alt={chat.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">
                    {chat.name}
                  </div>
                  <div
                    className={`text-xs truncate ${
                      chat.hasUnseen
                        ? "text-blue-600 font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    {chat.message}
                  </div>
                </div>
                <div className="text-[11px] text-gray-400">{chat.time}</div>
              </div>
            ))}

          {activeTab === "Calls" &&
            calls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={call.img}
                    alt={call.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      {call.name}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 gap-1 mt-0.5">
                      {call.type === "missed" ? (
                        <CallMissedIcon className="text-red-500" fontSize="small" />
                      ) : (
                        <CallReceivedIcon
                          className="text-green-500"
                          fontSize="small"
                        />
                      )}
                      <span>{call.time}</span>
                    </div>
                  </div>
                </div>
                <VideocamOutlinedIcon />
              </div>
            ))}
        </div>
      </div>

      {/* Right Chat Panel (all chat logic moved here) */}
      <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
        {selectedChat ? (
          <RightChatPanel
            roomId={selectedChat.id}
            chatName={selectedChat.name}
            chatImg={selectedChat.img}
            currentUserId={currentUser?.id}
            onStartCall={() => handleStartCall(selectedChat.id)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {/* Mini in-app call container (incoming ring) */}
      {isCalling && activeRoomId && activeCallId && (
        <div className="fixed bottom-4 right-4 w-[400px] h-[300px] bg-white shadow-lg rounded-2xl z-50 border overflow-hidden">
          {(() => {
            const activeChat = chats.find((c) => c.id === activeRoomId);
            return (
              <VideoCall
                callId={activeCallId}
                roomId={activeRoomId}
                onClose={() => {
                  setIsCalling(false);
                  setActiveCallId(null);
                }}
                callerName={currentUser?.user_metadata?.full_name || "You"}
                calleeName={activeChat?.name || "Unknown User"}
                profileUrl={currentUser?.user_metadata?.profile_picture_url || ""}
                remoteProfileUrl={activeChat?.img || ""}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}
