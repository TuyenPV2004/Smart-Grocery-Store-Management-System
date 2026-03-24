import { useEffect, useRef, useState } from "react";
import { MessageCircle, SendHorizonal, X } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import chatService from "../services/chatService";

const formatMessageTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
      <span>Đang nhập tin nhắn</span>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-green-500 animate-bounce"
            style={{ animationDelay: `${index * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isStaffOnline, setIsStaffOnline] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const messagesRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingSentRef = useRef(false);
  const isAdminView = user?.role === "ADMIN" || user?.role === "STAFF";

  useEffect(() => {
    if (isAdminView) {
      return undefined;
    }

    let isMounted = true;

    const connect = () => {
      const socket = chatService.connect();
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "INIT_CUSTOMER") {
            setConversationId(data.payload?.conversationId || null);
            setMessages(Array.isArray(data.payload?.messages) ? data.payload.messages : []);
            setIsStaffOnline(Boolean(data.payload?.staffOnline));
            setIsStaffTyping(false);
          }

          if (data.type === "MESSAGE") {
            setMessages((prev) => [...prev, data.payload]);
            setIsStaffTyping(false);
          }

          if (data.type === "STAFF_STATUS") {
            setIsStaffOnline(Boolean(data.payload?.online));
          }

          if (data.type === "TYPING" && data.payload?.senderRole !== "CUSTOMER" && data.payload?.senderRole !== "GUEST") {
            setIsStaffTyping(Boolean(data.payload?.typing));
          }
        } catch (error) {
          console.error("Chat parse error:", error);
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        setIsConnected(false);
        reconnectRef.current = window.setTimeout(connect, 2500);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    setMessages([]);
    setConversationId(null);
    setIsStaffOnline(false);
    setIsStaffTyping(false);
    connect();

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      isMounted = false;
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAdminView, user?.role]);

  useEffect(() => {
    if (!isOpen || !messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [isOpen, messages, isStaffTyping]);

  const sendTypingState = (typing) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: "TYPING",
        conversationId,
        typing,
      }),
    );
    typingSentRef.current = typing;
  };

  useEffect(() => {
    if (!isOpen || !conversationId) {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (typingSentRef.current) {
        sendTypingState(false);
      }
      return;
    }

    if (!draft.trim()) {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (typingSentRef.current) {
        sendTypingState(false);
      }
      return;
    }

    if (!typingSentRef.current) {
      sendTypingState(true);
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      if (typingSentRef.current) {
        sendTypingState(false);
      }
    }, 1200);

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, draft, isOpen]);

  if (isAdminView) {
    return null;
  }

  const handleSendMessage = () => {
    if (!draft.trim()) return;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error("Kết nối chat đang gián đoạn");
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "CHAT",
        content: draft.trim(),
      }),
    );
    if (typingSentRef.current) {
      sendTypingState(false);
    }
    setDraft("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[340px] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-base font-semibold text-white shadow-sm">
                G
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Chat với nhân viên
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isConnected && isStaffOnline
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  />
                  <span className="text-xs text-slate-500">
                    {isConnected && isStaffOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng khung chat"
            >
              <X size={18} />
            </button>
          </div>

          <div
            ref={messagesRef}
            className="flex h-[320px] flex-col gap-3 overflow-y-auto bg-slate-50/60 px-4 py-4"
          >
            {messages.map((message) => {
              const isStaffMessage = message.senderRole !== "CUSTOMER" && message.senderRole !== "GUEST";
              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isStaffMessage ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isStaffMessage
                        ? "bg-white text-slate-700"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                    <p
                      className={`mt-2 text-[11px] ${
                        isStaffMessage ? "text-slate-400" : "text-white/75"
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            {isStaffTyping && <TypingIndicator />}
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn"
                className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-green-400 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white transition-all hover:bg-green-700 disabled:opacity-50"
                disabled={!draft.trim()}
                aria-label="Gửi tin nhắn"
              >
                <SendHorizonal size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-[0_14px_28px_rgba(22,163,74,0.35)] transition-all hover:scale-105 hover:bg-green-700"
        aria-label="Mở chat"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
};

export default ChatWidget;
