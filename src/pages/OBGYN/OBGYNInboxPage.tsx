import { useState, useEffect, useCallback } from "react";
import SearchIcon from "@mui/icons-material/Search";
import rebeca from "@/assets/rebeca.png";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMissedIcon from "@mui/icons-material/CallMissed";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";
import { supabase } from "@/lib/supabaseClient";
import VideoCall from "@/components/modals/videoCall";
import type { User } from "@supabase/supabase-js";

import { useParams, useLocation } from "react-router-dom";

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

type TypingStatus = {
  user_id: string;
  is_typing: boolean;
  updated_at: string;
};

// For entitlement checks
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

// ------------------ COMPONENT ------------------

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"Chats" | "Calls">("Chats");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { patientId } = useParams<{ patientId?: string }>();
  const location = useLocation();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [typingStatus, setTypingStatus] = useState<TypingStatus | null>(null);
  const selectedChat = chats.find((c) => c.id === selectedChatId);
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

  /**
   * 🔎 Helper: find the most recent active appointment between current OB-GYN and patient
   * - not Done/Cancelled
   * - not completed_manually
   * - for calls: remaining call seconds > 0
   * - for chat: remaining chat messages > 0
   */
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
      if (!data) return null;

      return data as AppointmentRow;
    },
    [currentUser?.id]
  );

  const handleStartCall = async (chatId: string) => {
    if (!currentUser) return;

    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const calleeId = chat.participants.find((p) => p !== currentUser.id);
    if (!calleeId) return;

    // ✅ NEW: enforce booking before creating the call row
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

      // 1) Reuse any active call row for this room
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

      // 2) Create a new row if none active — ✅ tie to appointment
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
              appointment_id: appt.id, // 🔗 critical for DB triggers
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
        // 3) Ensure a clean non-ended state when reusing
        await supabase
          .from("chat_calls")
          .update({ status: "ringing", ended_at: null })
          .eq("id", callId);
      }

      // 4) Build popup URL with callId + display data
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

      // 5) Open popup
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

  // ✅ Fetch calls
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

  const handleUnsendMessage = async (msgId: string, roomId: string) => {
    try {
      const { error, data } = await supabase
        .from("chat_messages")
        .update({ status: "unsent" })
        .eq("id", msgId)
        .select();

      if (error) throw error;

      setMessages((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] || []).map((m) =>
          m.id === msgId ? { ...m, ...data[0] } : m
        ),
      }));
    } catch (err) {
      console.error("Error unsending message:", err);
      alert("Failed to unsend message. You can only delete your own messages.");
    }
  };

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
          const call = payload.new;
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

  // ✅ Mark messages as seen
  useEffect(() => {
    if (!selectedChatId || !currentUser) return;

    const markSeen = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .update({
          seen: true,
          seen_at: new Date().toISOString(),
        })
        .eq("room_id", selectedChatId)
        .neq("sender_id", currentUser.id)
        .select();

      if (error) {
        console.error("❌ Error marking seen:", error.message);
        return;
      }

      if (data?.length) {
        setMessages((prev) => ({
          ...prev,
          [selectedChatId]: (prev[selectedChatId] || []).map((m) => {
            const updated = data.find((d) => d.id === m.id);
            return updated ? { ...m, ...updated } : m;
          }),
        }));
      }
    };

    markSeen();
  }, [selectedChatId, currentUser]);

  // ✅ Fetch + subscribe messages
  useEffect(() => {
    if (!selectedChatId) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          "id, sender_id, room_id, message, created_at, seen, seen_at, message_type, file_url, status"
        )
        .eq("room_id", selectedChatId)
        .order("created_at", { ascending: true });

      setLoadingMessages(false);

      if (error) {
        console.error("❌ Error fetching messages:", error.message);
        return;
      }

      setMessages((prev) => ({ ...prev, [selectedChatId]: data || [] }));
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${selectedChatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${selectedChatId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => ({
              ...prev,
              [selectedChatId]: [
                ...(prev[selectedChatId] || []),
                payload.new as ChatMessage,
              ],
            }));
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) => ({
              ...prev,
              [selectedChatId]: (prev[selectedChatId] || []).map((m) =>
                m.id === payload.new.id ? (payload.new as ChatMessage) : m
              ),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId]);

  // ✅ Typing subscription
  useEffect(() => {
    if (!selectedChatId) return;

    const channel = supabase
      .channel(`typing-${selectedChatId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_typing",
          filter: `room_id=eq.${selectedChatId}`,
        },
        (payload) => {
          setTypingStatus(payload.new as TypingStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId]);

  // ✅ Send message (text only) — attach appointment_id when available
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || !currentUser) return;

    const text = newMessage.trim();

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser.id,
      message: text,
      created_at: new Date().toISOString(),
      seen: false,
      seen_at: null,
      message_type: "text",
      room_id: "",
      status: "",
    };
    setMessages((prev) => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), optimisticMessage],
    }));
    setNewMessage("");

    // 🔗 Try to attach appointment_id so DB enforces chat quota specific to the booking
    let appointment_id: string | undefined;
    try {
      const chat = chats.find((c) => c.id === selectedChatId);
      const otherId = chat?.participants.find((p) => p !== currentUser.id);
      if (otherId) {
        const appt = await fetchActiveAppointmentFor(otherId);
        const remainingChats =
          Math.max(
            (appt?.chat_messages_limit ?? 0) - (appt?.chat_messages_used ?? 0),
            0
          ) || 0;
        if (appt && !appt.completed_manually && remainingChats > 0) {
          appointment_id = appt.id;
        }
      }
    } catch (e) {
      // ignore; DB triggers will still enforce limits
    }

    const { error } = await supabase.from("chat_messages").insert([
      {
        room_id: selectedChatId,
        sender_id: currentUser.id,
        message: text,
        message_type: "text",
        ...(appointment_id ? { appointment_id } : {}),
      },
    ]);

    if (error) {
      // DB trigger might say "Chat quota exhausted; please rebook"
      alert(error.message);
    }
  };

  // ✅ Update typing state
  const handleTyping = async (isTyping: boolean) => {
    if (!selectedChatId || !currentUser) return;
    await supabase.from("chat_typing").upsert(
      {
        room_id: selectedChatId,
        user_id: currentUser.id,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "room_id,user_id" }
    );
  };

  // ✅ File upload handler
  const handleUpload = async (file: File, type: "image" | "file") => {
    if (!file || !selectedChatId || !currentUser) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `${selectedChatId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("chat_attachments")
      .upload(filePath, file);

    if (uploadError) {
      console.error("❌ File upload error:", uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("chat_attachments")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    const { error: insertError } = await supabase.from("chat_messages").insert([
      {
        room_id: selectedChatId,
        sender_id: currentUser.id,
        message: type === "file" ? file.name : "",
        message_type: type,
        file_url: publicUrl,
      },
    ]);

    if (insertError) {
      console.error("❌ Error sending file message:", insertError.message);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                        <CallMissedIcon
                          className="text-red-500"
                          fontSize="small"
                        />
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

      {/* Chat Panel */}
      <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedChat.img}
                  alt={selectedChat.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="text-gray-900 font-semibold text-sm">
                    {selectedChat.name}
                  </div>
                  {typingStatus &&
                  typingStatus.is_typing &&
                  typingStatus.user_id !== currentUser?.id ? (
                    <div className="text-xs text-blue-500 animate-pulse">
                      typing...
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      Last active{" "}
                      {typingStatus?.updated_at
                        ? new Date(
                            typingStatus.updated_at
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "recently"}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[#E46B64]">
                <VideocamOutlinedIcon
                  onClick={() => handleStartCall(selectedChat.id)}
                  className="cursor-pointer"
                />
                <MoreHorizOutlinedIcon />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {loadingMessages ? (
                <div className="text-gray-400 text-sm">Loading messages...</div>
              ) : (
                (messages[selectedChat.id] || []).map((msg, idx, arr) => {
                  const isFromMe = msg.sender_id === currentUser?.id;
                  const bubbleColor = isFromMe
                    ? "bg-[#E46B64] text-white"
                    : "bg-gray-100 text-gray-800";
                  const time = new Date(msg.created_at);
                  const prev = idx > 0 ? new Date(arr[idx - 1].created_at) : null;

                  const showSeparator =
                    !prev ||
                    time.toDateString() !== prev.toDateString() ||
                    (time.getTime() - prev.getTime()) / (1000 * 60) > 30;

                  if (msg.message_type === "call") {
                    return (
                      <div key={msg.id} className="flex justify-center my-4">
                        <div className="px-4 py-2 rounded-lg bg-gray-50 text-xs text-gray-600 border">
                          {msg.message.includes("missed") ? (
                            <span className="text-red-500">❌ Missed Call</span>
                          ) : (
                            <span className="text-green-600">
                              📞 Video Call Ended
                            </span>
                          )}
                          <div className="text-[10px] text-gray-400 mt-1">
                            {time.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id}>
                      {showSeparator && (
                        <div className="flex justify-center my-2">
                          <span className="text-[11px] text-gray-400 bg-white px-3 rounded-full shadow-sm">
                            {time.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div
                        className={`group flex ${
                          isFromMe ? "justify-end" : "justify-start"
                        } items-start gap-3`}
                      >
                        {!isFromMe && (
                          <img
                            src={selectedChat.img}
                            alt="profile"
                            className="w-8 h-8 rounded-full object-cover mt-1"
                          />
                        )}

                        <div className="flex flex-col max-w-xs relative">
                          <div
                            className={`px-4 py-2 rounded-2xl break-words shadow-sm animate-fadeIn relative ${bubbleColor}`}
                          >
                            {msg.status === "unsent" ? (
                              <p className="italic text-gray-500 text-sm">
                                {isFromMe
                                  ? "You unsent a message"
                                  : `${selectedChat.name || "User"} unsent a message`}
                              </p>
                            ) : msg.message_type !== "text" && msg.file_url ? (
                              msg.file_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                                <img
                                  src={msg.file_url ?? undefined}
                                  alt="uploaded"
                                  className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer"
                                  onClick={() =>
                                    msg.file_url &&
                                    window.open(msg.file_url, "_blank")
                                  }
                                />
                              ) : (
                                <a
                                  href={msg.file_url ?? undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm hover:underline"
                                >
                                  📄{" "}
                                  <span className="truncate max-w-[150px]">
                                    {msg.message || "File"}
                                  </span>
                                </a>
                              )
                            ) : (
                              <p>{msg.message}</p>
                            )}
                          </div>

                          {msg.status === "active" && (
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 ${
                                isFromMe ? "right-full mr-1" : "left-full ml-1"
                              } hidden group-hover:flex items-center`}
                            >
                              <div className="relative group/menu">
                                <MoreHorizOutlinedIcon className="cursor-pointer text-gray-500 hover:text-[#E46B64]" />
                                <div
                                  className={`absolute mt-2 w-36 rounded-2xl shadow-md border border-gray-100
                                  bg-white/95 backdrop-blur-sm z-50
                                  ${isFromMe ? "right-0 origin-top-right" : "left-0 origin-top-left"}
                                  after:content-[''] after:absolute after:w-0 after:h-0 
                                  after:border-8 after:border-transparent after:top-0
                                  ${
                                    isFromMe
                                      ? "after:right-4 after:border-b-white after:-translate-y-full"
                                      : "after:left-4 after:border-b-white after:-translate-y-full"
                                  }
                                  opacity-0 scale-95 pointer-events-none
                                  group-hover/menu:opacity-100 group-hover/menu:scale-100 group-hover/menu:pointer-events-auto
                                  transition-all duration-200 ease-out`}
                                >
                                  {isFromMe && (
                                    <button
                                      onClick={() =>
                                        handleUnsendMessage(msg.id, selectedChat.id)
                                      }
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 
                                      hover:bg-[#E46B64]/10 hover:text-[#E46B64] 
                                      transition-colors rounded-t-2xl"
                                    >
                                      Unsend
                                    </button>
                                  )}
                                  <button
                                    onClick={() => console.log("report", msg.id)}
                                    className={`w-full text-left px-4 py-2 text-sm text-gray-700 
                                    hover:bg-[#E46B64]/10 hover:text-[#E46B64] 
                                    transition-colors ${isFromMe ? "rounded-b-2xl" : "rounded-2xl"}`}
                                  >
                                    Report
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-300 px-4 py-3 flex items-center gap-3">
              <label className="cursor-pointer">
                <AttachFileOutlinedIcon className="text-gray-400" />
                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    e.target.files && handleUpload(e.target.files[0], "file")
                  }
                />
              </label>
              <label className="cursor-pointer">
                <InsertPhotoOutlinedIcon className="text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    e.target.files && handleUpload(e.target.files[0], "image")
                  }
                />
              </label>

              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping(true);
                }}
                onBlur={() => handleTyping(false)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E46B64]"
              />
              <button
                onClick={handleSendMessage}
                className="bg-[#E46B64] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#d55a54] transition"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a chat to start messaging
          </div>
        )}
      </div>

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
