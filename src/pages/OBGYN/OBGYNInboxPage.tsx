import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import lim from "@/assets/rebeca.png";
import rebeca from "@/assets/lim.png";

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

// Temporary dummy calls (until you have a calls table in Supabase)
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

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"Chats" | "Calls">("Chats");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const calls = dummyCalls.filter((call) =>
    call.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedChat = chats.find((c) => c.id === selectedChatId);

  // Fetch logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("❌ Error fetching user:", error);
        return;
      }
      setCurrentUser(data.user);
    };
    getUser();
  }, []);

  // Fetch chats the ob-gyn is in
  useEffect(() => {
    if (!currentUser) return;

    const fetchChats = async () => {
      const { data, error } = await supabase
        .from("chat_rooms")
        .select(
          `
          id,
          created_at,
          participants:chat_participants(user_id)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching chats:", error);
        return;
      }

      setChats(
        (data || []).map((room: any) => {
          // Placeholder — later join to patient_users / obgyn_users
          return {
            id: room.id,
            name: `Chat ${room.id.slice(0, 6)}`,
            img: rebeca,
            message: "Tap to view messages",
            time: new Date(room.created_at).toLocaleDateString(),
          };
        })
      );
    };

    fetchChats();
  }, [currentUser]);

  // Fetch messages when selecting a chat
  useEffect(() => {
    if (!selectedChatId) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, sender_id, message, created_at")
        .eq("chat_room_id", selectedChatId)
        .order("created_at", { ascending: true });

      setLoadingMessages(false);

      if (error) {
        console.error("❌ Error fetching messages:", error);
        return;
      }

      setMessages((prev) => ({ ...prev, [selectedChatId]: data || [] }));
    };

    fetchMessages();

    // ✅ subscribe to new messages in this room
    const channel = supabase
      .channel(`chat-${selectedChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_room_id=eq.${selectedChatId}`,
        },
        (payload) => {
          setMessages((prev) => ({
            ...prev,
            [selectedChatId]: [...(prev[selectedChatId] || []), payload.new],
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId]);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full">
      {/* Sidebar (Chats/Calls List) */}
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
                  selectedChatId === chat.id ? "bg-gray-200" : ""
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
                <VideocamOutlinedIcon className="text-gray-400" fontSize="small" />
              </div>
            ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedChat.img}
                  alt={selectedChat.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="text-gray-900 font-semibold text-sm">
                  {selectedChat.name}
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
                  const alignment = isFromMe ? "justify-end" : "justify-start";
                  const dotSide = isFromMe ? "left" : "right";
                  const bubbleColor = isFromMe
                    ? "bg-[#E46B64] text-white"
                    : "bg-gray-100 text-gray-800";
                  const time = new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={msg.id}>
                      <div className={`group flex items-start ${alignment}`}>
                        {dotSide === "left" && <MessageMenu />}
                        <div className="flex flex-col items-end">
                          <div
                            className={`px-4 py-2 rounded-xl max-w-xs break-words ${bubbleColor}`}
                          >
                            {msg.message}
                          </div>
                          {isFromMe && (
                            <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400">
                              <DoneAllIcon
                                style={{ color: "#E46B64" }}
                                fontSize="small"
                              />
                              <span className="text-gray-900">Seen {time}</span>
                            </div>
                          )}
                        </div>
                        {dotSide === "right" && <MessageMenu right />}
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
                className="flex-1 px-3 py-2 text-sm border rounded-full border-gray-300 outline-none"
              />
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

function MessageMenu({ right = false }: { right?: boolean }) {
  return (
    <div
      className={`relative ${right ? "ml-2" : "mr-2"} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
    >
      <MoreHorizOutlinedIcon className="text-gray-400 cursor-pointer" />
      <div
        className={`absolute top-full ${
          right ? "right-0" : "left-0"
        } mt-1 bg-white shadow-md rounded-md text-sm z-10 hidden group-hover:block`}
      >
        {["Report", "Remove", "Reply"].map((action, i) => (
          <button
            key={i}
            className="block px-4 py-2 w-full text-left hover:bg-gray-100"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
