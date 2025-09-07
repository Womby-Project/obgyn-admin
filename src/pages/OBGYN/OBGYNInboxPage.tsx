import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import rebeca from "@/assets/rebeca.png";
import lim from "@/assets/lim.png";

import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMissedIcon from "@mui/icons-material/CallMissed";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

// ------------------ TYPES ------------------

type ChatUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_avatar_url?: string | null;
  profile_picture_url?: string | null;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  seen?: boolean;
  seen_at?: string | null;
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
};

type TypingStatus = {
  user_id: string;
  is_typing: boolean;
  updated_at: string;
};

// ------------------ DUMMY CALLS ------------------

const dummyCalls = [
  {
    id: 1,
    name: "Rebeca Lim",
    img: lim,
    type: "missed",
    video: false,
    time: "Today, 3:10 PM",
  },
  {
    id: 2,
    name: "Emma Wilson",
    img: rebeca,
    type: "received",
    video: true,
    time: "Today, 1:55 PM",
  },
];

// ------------------ COMPONENT ------------------

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"Chats" | "Calls">("Chats");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [typingStatus, setTypingStatus] = useState<TypingStatus | null>(null);

  const calls = dummyCalls.filter((call) =>
    call.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedChat = chats.find((c) => c.id === selectedChatId);

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

  // ✅ Fetch chats
  useEffect(() => {
    if (!currentUser) return;

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
            const other = isObgyn
              ? (room.patient as ChatUser | null)
              : (room.obgyn as ChatUser | null);

            const latestMsg = room.chat_messages?.length
              ? [...room.chat_messages].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )[0]
              : null;

            return {
              id: room.id,
              name: other
                ? `${other.first_name ?? ""} ${other.last_name ?? ""}`.trim()
                : "Unknown",
              img:
                other?.profile_avatar_url ||
                (isObgyn
                  ? room.obgyn?.profile_avatar_url
                  : room.patient?.profile_avatar_url) ||
                rebeca,
              message: latestMsg?.message || "No messages yet",
              time: latestMsg
                ? new Date(latestMsg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "",
            };
          }) || [];

        setChats(formattedChats);
      } catch (err) {
        console.error("❌ Error fetching chats:", err);
      }
    };

    fetchChats();
  }, [currentUser]);

  // ✅ Mark messages as seen
  useEffect(() => {
    if (!selectedChatId || !currentUser) return;

    const markSeen = async () => {
      await supabase
        .from("chat_messages")
        .update({
          seen: true,
          seen_at: new Date().toISOString(),
        })
        .eq("room_id", selectedChatId)
        .neq("sender_id", currentUser.id);
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
        .select("id, sender_id, message, created_at, seen, seen_at")
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

    // Live subscription for new + updated messages
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

  // ✅ Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || !currentUser) return;

    const text = newMessage.trim();

    // Optimistic UI update
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser.id,
      message: text,
      created_at: new Date().toISOString(),
      seen: false,
      seen_at: null,
    };
    setMessages((prev) => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), optimisticMessage],
    }));
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert([
      {
        room_id: selectedChatId,
        sender_id: currentUser.id,
        message: text,
      },
    ]);

    if (error) {
      console.error("❌ Error sending message:", error.message);
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
              className={`w-1/2 pb-2 text-[15px] font-bold transition-colors ${activeTab === tab ? "text-gray-700" : "text-gray-500"
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
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition ${selectedChatId === chat.id ? "bg-gray-200" : ""
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
                  <div className="text-xs text-gray-500 truncate">
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
                <VideocamOutlinedIcon
                  className="text-gray-400"
                  fontSize="small"
                />
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
                    typingStatus.user_id !== currentUser?.id && (
                      <div className="text-xs text-gray-500">typing...</div>
                    )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[#E46B64]">
                <VideocamOutlinedIcon />
                <MoreHorizOutlinedIcon />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="text-gray-400 text-sm">Loading messages...</div>
              ) : (
                (messages[selectedChat.id] || []).map((msg) => {
                  const isFromMe = msg.sender_id === currentUser?.id;
                  const bubbleColor = isFromMe
                    ? "bg-[#E46B64] text-white"
                    : "bg-gray-100 text-gray-800";
                  const time = new Date(msg.created_at).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  );

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isFromMe ? "justify-end" : "justify-start"
                        }`}
                    >
                      <div className="flex flex-col items-end max-w-xs">
                        <div
                          className={`px-4 py-2 rounded-xl break-words ${bubbleColor}`}
                        >
                          {msg.message}
                        </div>
                        {isFromMe && msg.seen && msg.seen_at && (
                          <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400">
                            <DoneAllIcon
                              style={{ color: "#E46B64" }}
                              fontSize="small"
                            />
                            <span className="text-gray-900">
                              Seen{" "}
                              {new Date(msg.seen_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-3 border-t border-gray-300 px-4 py-3">
              {[AttachFileOutlinedIcon, InsertPhotoOutlinedIcon, CameraAltOutlinedIcon].map(
                (Icon, idx) => (
                  <Icon key={idx} className="text-[#E46B64] cursor-pointer" />
                )
              )}
              <input
                type="text"
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping(true);
                }}
                onBlur={() => handleTyping(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                    handleTyping(false);
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border rounded-full border-gray-300 outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="bg-[#E46B64] text-white px-4 py-2 rounded-full"
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
    </div>
  );
}
