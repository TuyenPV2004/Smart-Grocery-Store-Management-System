import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Loader2,
  MessageCircle,
  SendHorizonal,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import chatService from "../../services/chatService";

const mergeMessages = (prev, next) => {
  const map = new Map();
  [...prev, ...next].forEach((message) => {
    map.set(message.id, message);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
};

const formatMessageTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatExportMessageTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

const formatExportTime = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return {
    label: `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`,
    file: `${parts.day}-${parts.month}-${parts.year}_${parts.hour}h${parts.minute}m${parts.second}s`,
  };
};

const sanitizeFileName = (value) =>
  (value || "unknown")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\s]+/g, "_")
    .replace(/^_+|_+$/g, "");

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

const CustomerChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageMap, setMessageMap] = useState({});
  const [typingMap, setTypingMap] = useState({});
  const [draft, setDraft] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingSentRef = useRef(false);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.conversationId === selectedConversationId,
      ) || null,
    [conversations, selectedConversationId],
  );

  const currentMessages = messageMap[selectedConversationId] || [];

  const loadConversations = async () => {
    try {
      const res = await chatService.getConversations();
      const nextConversations = Array.isArray(res.data) ? res.data : [];
      setConversations(nextConversations);
      setSelectedConversationId((prev) => {
        if (prev && nextConversations.some((item) => item.conversationId === prev)) {
          return prev;
        }
        return nextConversations[0]?.conversationId || null;
      });
    } catch (error) {
      toast.error("Không thể tải danh sách cuộc trò chuyện");
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      const socket = chatService.connect();
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "ADMIN_SNAPSHOT") {
            const nextConversations = Array.isArray(data.payload?.conversations)
              ? data.payload.conversations
              : [];
            setConversations(nextConversations);
            setSelectedConversationId((prev) => {
              if (prev && nextConversations.some((item) => item.conversationId === prev)) {
                return prev;
              }
              return nextConversations[0]?.conversationId || null;
            });
          }

          if (data.type === "MESSAGE") {
            setMessageMap((prev) => ({
              ...prev,
              [data.payload.conversationId]: mergeMessages(
                prev[data.payload.conversationId] || [],
                [data.payload],
              ),
            }));
            setTypingMap((prev) => ({
              ...prev,
              [data.payload.conversationId]: false,
            }));
          }

          if (data.type === "TYPING" && data.payload?.conversationId) {
            setTypingMap((prev) => ({
              ...prev,
              [data.payload.conversationId]: Boolean(data.payload?.typing),
            }));
          }
        } catch (error) {
          console.error("Admin chat parse error:", error);
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        reconnectRef.current = window.setTimeout(connect, 2500);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedConversationId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await chatService.getConversationMessages(selectedConversationId);
        setMessageMap((prev) => ({
          ...prev,
          [selectedConversationId]: mergeMessages(
            prev[selectedConversationId] || [],
            Array.isArray(res.data) ? res.data : [],
          ),
        }));
      } catch (error) {
        toast.error("Không thể tải tin nhắn");
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversationId]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
  }, [currentMessages, selectedConversationId, typingMap]);

  const sendTypingState = (typing) => {
    if (
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      !selectedConversationId
    ) {
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "TYPING",
        conversationId: selectedConversationId,
        typing,
      }),
    );
    typingSentRef.current = typing;
  };

  useEffect(() => {
    if (!selectedConversationId) {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      typingSentRef.current = false;
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
  }, [draft, selectedConversationId]);

  const handleSendMessage = () => {
    if (!draft.trim() || !selectedConversationId) return;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error("Kết nối chat đang gián đoạn");
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "CHAT",
        conversationId: selectedConversationId,
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

  const handleExportConversation = () => {
    if (!selectedConversation) return;

    const adminName =
      user?.fullName || user?.name || user?.username || user?.email || "admin";
    const customerName =
      selectedConversation.customerDisplayName ||
      selectedConversation.customerKey ||
      "user";
    const exportedAt = formatExportTime();
    const fileName = `${sanitizeFileName(customerName)}_${sanitizeFileName(adminName)}_${exportedAt.file}.txt`;

    const content = [
      "LỊCH SỬ HỘI THOẠI",
      `Khách hàng: ${customerName}`,
      `Nhân viên: ${adminName}`,
      `Thời gian xuất: ${exportedAt.label}`,
      "",
      ...currentMessages.map((message) => {
        const senderName = message.senderDisplayName || "Ẩn danh";
        const sentAt = formatExportMessageTime(message.createdAt);
        return `[${sentAt}] ${senderName}: ${message.content}`;
      }),
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversationId) return;

    const confirmed = window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?");
    if (!confirmed) return;

    try {
      await chatService.deleteConversation(selectedConversationId);

      const nextConversations = conversations.filter(
        (conversation) => conversation.conversationId !== selectedConversationId,
      );
      setConversations(nextConversations);
      setMessageMap((prev) => {
        const next = { ...prev };
        delete next[selectedConversationId];
        return next;
      });
      setTypingMap((prev) => {
        const next = { ...prev };
        delete next[selectedConversationId];
        return next;
      });
      setSelectedConversationId(nextConversations[0]?.conversationId || null);
      setDraft("");
      typingSentRef.current = false;
      toast.success("Đã xóa cuộc trò chuyện");
    } catch (error) {
      toast.error("Không thể xóa cuộc trò chuyện");
    }
  };

  return (
    <div className="admin-page-shell min-h-screen p-6 font-poppins antialiased text-slate-600">
      <div className="mx-auto flex max-w-7xl gap-6">
        <div className="w-[320px] rounded-[2rem] border border-slate-100 bg-white/95 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-slate-900">
              Chat khách hàng
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi và phản hồi tin nhắn theo thời gian thực
            </p>
          </div>

          <div className="space-y-3">
            {conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Chưa có cuộc trò chuyện nào
              </div>
            ) : (
              conversations.map((conversation) => {
                const isActive =
                  conversation.conversationId === selectedConversationId;
                return (
                  <button
                    key={conversation.conversationId}
                    type="button"
                    onClick={() =>
                      setSelectedConversationId(conversation.conversationId)
                    }
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                      isActive
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {conversation.customerDisplayName}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                          {conversation.customerRole}
                        </p>
                      </div>
                      <span
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${
                          conversation.customerOnline
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {conversation.lastMessage}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedConversation?.customerDisplayName || "Khách hàng"}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    selectedConversation?.customerOnline
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                />
                <span className="text-xs text-slate-500">
                  {selectedConversation?.customerOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            {selectedConversationId && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportConversation}
                  className="flex h-10 w-10 items-center justify-center text-slate-600 transition-all hover:text-green-700"
                  aria-label="Xuất hội thoại dạng text"
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConversation}
                  className="flex h-10 w-10 items-center justify-center text-slate-500 transition-all hover:text-red-600"
                  aria-label="Xóa cuộc trò chuyện"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div
            ref={messagesEndRef}
            className="flex-1 space-y-4 overflow-y-auto bg-slate-50/40 px-6 py-5"
          >
            {!selectedConversationId ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                <MessageCircle size={34} className="mb-3 text-slate-300" />
                Chọn một cuộc trò chuyện để bắt đầu phản hồi khách hàng
              </div>
            ) : loadingMessages ? (
              <div className="flex h-full items-center justify-center gap-2 text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Đang tải tin nhắn...
              </div>
            ) : (
              currentMessages.map((message) => {
                const isCustomerMessage =
                  message.senderRole === "CUSTOMER" ||
                  message.senderRole === "GUEST";
                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isCustomerMessage ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                        isCustomerMessage
                          ? "bg-white text-slate-700"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      <p className="mb-1 text-xs font-medium opacity-70">
                        {message.senderDisplayName}
                      </p>
                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={`mt-2 text-[11px] ${
                          isCustomerMessage ? "text-slate-400" : "text-white/75"
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {typingMap[selectedConversationId] && <TypingIndicator />}
          </div>

          <div className="border-t border-slate-100 bg-white px-6 py-4">
            <div className="flex items-end gap-3">
              <textarea
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập phản hồi cho khách hàng..."
                disabled={!selectedConversationId}
                className="min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-green-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!draft.trim() || !selectedConversationId}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white transition-all hover:bg-green-700 disabled:opacity-50"
              >
                <SendHorizonal size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerChatPage;
