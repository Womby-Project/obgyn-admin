// components/RightChatPanel.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { supabase } from "@/lib/supabaseClient";

type ChatMessage = {
  status: string; // "active" | "unsent" | etc.
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

type TypingStatus = {
  user_id: string;
  is_typing: boolean;
  updated_at: string;
};

type Props = {
  roomId: string;
  chatName?: string;
  chatImg?: string;
  currentUserId?: string;
  onStartCall?: () => void;
};

// e.g., "October 18, 2025 11:24 AM"
const fmtDateTime = (d: Date) =>
  `${d.toLocaleString("en-US", { month: "long" })} ${d.getDate()}, ${d.getFullYear()} ${d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}`;

export default function RightChatPanel({
  roomId,
  chatName = "Patient",
  chatImg = "/default-avatar.png",
  currentUserId,
  onStartCall,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [typingStatus, setTypingStatus] = useState<TypingStatus | null>(null);

  // Track the most recent optimistic message to merge on realtime INSERT
  const lastOptimisticRef = useRef<{
    id: string;
    sender_id: string;
    message: string;
    created_at: string;
  } | null>(null);

  // ✅ Fetch messages (initial)
  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          "id, sender_id, room_id, message, created_at, seen, seen_at, message_type, file_url, status"
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (mounted) setLoading(false);
      if (error) {
        console.error("❌ Error fetching messages:", error.message);
        return;
      }
      if (mounted) setMessages(data || []);
    };

    fetchMessages();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  // ✅ Subscribe realtime + de-duplicate safe merge
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const incoming = payload.new as ChatMessage;

            setMessages((prev) => {
              // 1) If already present by id, ignore
              if (prev.some((m) => m.id === incoming.id)) return prev;

              // 2) Try to merge with the most recent optimistic temp message
              const tempIdx = prev.findIndex(
                (m) =>
                  m.id.startsWith("temp-") &&
                  m.sender_id === incoming.sender_id &&
                  m.message === incoming.message &&
                  Math.abs(
                    new Date(m.created_at).getTime() -
                      new Date(incoming.created_at).getTime()
                  ) < 10000 // within 10 seconds
              );

              if (tempIdx >= 0) {
                const cloned = [...prev];
                cloned[tempIdx] = incoming; // replace temp with real
                return cloned;
              }

              // 3) Fallback guard: avoid near-duplicate text from same sender within 5s
              const isNearDup = prev.some(
                (m) =>
                  m.sender_id === incoming.sender_id &&
                  m.message === incoming.message &&
                  Math.abs(
                    new Date(m.created_at).getTime() -
                      new Date(incoming.created_at).getTime()
                  ) < 5000
              );
              if (isNearDup) return prev;

              // 4) Otherwise append
              return [...prev, incoming];
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as ChatMessage;
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // ✅ Mark seen when viewing
  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const markSeen = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .update({
          seen: true,
          seen_at: new Date().toISOString(),
        })
        .eq("room_id", roomId)
        .neq("sender_id", currentUserId)
        .select();

    if (error) {
        console.error("❌ Error marking seen:", error.message);
        return;
      }
      if (data?.length) {
        setMessages((prev) =>
          prev.map((m) => {
            const u = data.find((d) => d.id === m.id);
            return u ? { ...m, ...u } : m;
          })
        );
      }
    };

    markSeen();
  }, [roomId, currentUserId]);

  // ✅ Typing indicator
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`typing-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_typing",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setTypingStatus(payload.new as TypingStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleTyping = async (isTyping: boolean) => {
    if (!roomId || !currentUserId) return;
    await supabase.from("chat_typing").upsert(
      {
        room_id: roomId,
        user_id: currentUserId,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "room_id,user_id" }
    );
  };

  // ✅ Send text with optimistic update + safe merge (fixes duplication bug)
  const handleSend = async () => {
    if (!newMessage.trim() || !roomId || !currentUserId) return;

    const text = newMessage.trim();
    const nowISO = new Date().toISOString();

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      message: text,
      created_at: nowISO,
      seen: false,
      seen_at: null,
      message_type: "text",
      room_id: roomId,
      status: "active",
      file_url: null,
    };

    lastOptimisticRef.current = {
      id: optimistic.id,
      sender_id: optimistic.sender_id,
      message: optimistic.message,
      created_at: optimistic.created_at,
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert([
      {
        room_id: roomId,
        sender_id: currentUserId,
        message: text,
        message_type: "text",
      },
    ]);

    if (error) {
      // Rollback optimistic if rejected
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      alert(error.message);
    }
  };

  // ✅ Unsend (only own messages)
  const handleUnsend = async (msgId: string) => {
    const { error, data } = await supabase
      .from("chat_messages")
      .update({ status: "unsent" })
      .eq("id", msgId)
      .select();

    if (error) {
      console.error("Error unsending message:", error.message);
      alert("Failed to unsend message. You can only delete your own messages.");
      return;
    }
    const updated = data?.[0];
    if (updated) {
      setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)));
    }
  };

  // ✅ Upload (image or file)
  const handleUpload = async (file: File, type: "image" | "file") => {
    if (!file || !roomId || !currentUserId) return;

    const fileExt = file.name.split(".").pop();
       const filePath = `${roomId}/${Date.now()}.${fileExt}`;

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
        room_id: roomId,
        sender_id: currentUserId,
        message: type === "file" ? file.name : "",
        message_type: type,
        file_url: publicUrl,
      },
    ]);

    if (insertError) {
      console.error("❌ Error sending file message:", insertError.message);
    }
  };

  // ---------- Single combined separator (date + time) ----------
  const itemsWithSeparators = useMemo(() => {
    const out: Array<
      | { kind: "sep"; key: string; label: string }
      | { kind: "msg"; key: string; msg: ChatMessage }
    > = [];

    let lastSepMs: number | null = null;
    let lastSepDay: string | null = null;

    messages.forEach((m, i) => {
      const t = new Date(m.created_at);
      const ms = t.getTime();
      const dayKey = t.toDateString();

      const needsDayChangeSep = dayKey !== lastSepDay;
      const needsGapSep =
        lastSepMs === null
          ? true
          : Math.abs(ms - lastSepMs) > 30 * 60 * 1000; // > 30 minutes

      if (needsDayChangeSep || needsGapSep) {
        out.push({
          kind: "sep",
          key: `sep-${ms}-${i}`,
          label: fmtDateTime(t), // "October 18, 2025 11:24 AM"
        });
        lastSepMs = ms;
        lastSepDay = dayKey;
      }

      out.push({ kind: "msg", key: m.id, msg: m });
    });

    return out;
  }, [messages]);

  const otherTyping =
    typingStatus &&
    typingStatus.is_typing &&
    typingStatus.user_id !== currentUserId;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src={chatImg}
            alt={chatName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 text-sm">{chatName}</span>
            <span className="text-xs text-gray-500">
              {otherTyping ? "typing..." : "online"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[#E46B64]">
          <VideocamOutlinedIcon
            className="cursor-pointer"
            onClick={onStartCall}
          />
          <MoreHorizOutlinedIcon className="text-gray-500" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="text-gray-400 text-sm">Loading messages...</div>
        ) : (
          itemsWithSeparators.map((item) => {
            if (item.kind === "sep") {
              return (
                <div key={item.key} className="flex items-center justify-center">
                  <span className="text-[11px] text-gray-500 bg-white px-3 rounded-full shadow-sm">
                    {item.label /* e.g., October 18, 2025 11:24 AM */}
                  </span>
                </div>
              );
            }

            const msg = item.msg;
            const isFromMe = msg.sender_id === currentUserId;
            const bubbleColor = isFromMe
              ? "bg-[#E46B64] text-white"
              : "bg-gray-100 text-gray-800";

            return (
              <div
                key={item.key}
                className={`flex ${isFromMe ? "justify-end" : "justify-start"} items-start gap-3`}
              >
                {!isFromMe && (
                  <img
                    src={chatImg}
                    alt="profile"
                    className="w-8 h-8 rounded-full object-cover mt-1"
                  />
                )}

                <div className="group flex flex-col max-w-sm md:max-w-md lg:max-w-lg relative">
                  <div
                    className={`px-4 py-2 rounded-2xl break-words shadow-sm animate-fadeIn relative ${bubbleColor}`}
                  >
                    {msg.status === "unsent" ? (
                      <p className="italic opacity-90 text-sm">
                        {isFromMe ? "You unsent a message" : `${chatName} unsent a message`}
                      </p>
                    ) : msg.message_type !== "text" && msg.file_url ? (
                      msg.file_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                        <img
                          src={msg.file_url ?? undefined}
                          alt="uploaded"
                          className="max-w-[260px] max-h-[260px] rounded-lg object-cover cursor-pointer"
                          onClick={() =>
                            msg.file_url && window.open(msg.file_url, "_blank")
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
                          <span className="truncate max-w-[180px]">
                            {msg.message || "File"}
                          </span>
                        </a>
                      )
                    ) : (
                      <p>{msg.message}</p>
                    )}
                  </div>

                  {/* No per-message timestamp here — separator already shows date+time */}
                  {/* Actions */}
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
                              onClick={() => handleUnsend(msg.id)}
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
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        <label className="cursor-pointer">
          <AttachFileOutlinedIcon className="text-gray-500" />
          <input
            type="file"
            hidden
            onChange={(e) =>
              e.target.files && handleUpload(e.target.files[0], "file")
            }
          />
        </label>
        <label className="cursor-pointer">
          <InsertPhotoOutlinedIcon className="text-gray-500" />
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
          placeholder="Start chatting with your patient"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping(true);
          }}
          onBlur={() => handleTyping(false)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E46B64]"
        />
        <EmojiEmotionsIcon className="text-gray-500" />
        <button
          onClick={handleSend}
          className="bg-[#E46B64] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#d55a54] transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
