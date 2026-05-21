import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiCheckCircle as CheckCheck,
  FiDownload as Download,
  FiLoader as Loader2,
  FiUnlock as LockOpen,
  FiMessageCircle as MessageCircle,
  FiSearch as Search,
  FiSend as SendHorizonal,
  FiTrash2 as Trash2,
  FiUserCheck as UserCheck,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useAuth } from "../../context/useAuth";
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

const sortConversations = (conversations) =>
  [...conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

const applyConversationFilter = (conversations, keyword, scope, staffKey) => {
  const normalizedKeyword = (keyword || "").trim().toLowerCase();
  const normalizedScope = scope || "ALL";

  return sortConversations(
    (Array.isArray(conversations) ? conversations : []).filter((conversation) => {
      const matchesKeyword =
        !normalizedKeyword ||
        conversation.customerDisplayName?.toLowerCase().includes(normalizedKeyword) ||
        conversation.customerKey?.toLowerCase().includes(normalizedKeyword) ||
        conversation.assignedStaffDisplayName?.toLowerCase().includes(normalizedKeyword);

      const matchesScope =
        normalizedScope === "ALL" ||
        (normalizedScope === "UNASSIGNED" && !conversation.assignedStaffKey) ||
        (normalizedScope === "MINE" && conversation.assignedStaffKey === staffKey) ||
        (normalizedScope === "ACTIVE" && !conversation.resolved) ||
        (normalizedScope === "RESOLVED" && conversation.resolved);

      return matchesKeyword && matchesScope;
    }),
  );
};

const upsertConversation = (conversations, summary) => {
  const next = [...conversations];
  const index = next.findIndex(
    (conversation) => conversation.conversationId === summary.conversationId,
  );

  if (index >= 0) {
    next[index] = { ...next[index], ...summary };
  } else {
    next.unshift(summary);
  }

  return sortConversations(next);
};

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
      <span>Typing...</span>
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

const ConversationBadge = ({ conversation, currentStaffKey }) => {
  if (conversation.resolved) {
    return (
      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700">
        Closed
      </span>
    );
  }

  if (!conversation.assignedStaffKey) {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
        Unassigned
      </span>
    );
  }

  if (conversation.assignedStaffKey === currentStaffKey) {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
        Assigned to you
      </span>
    );
  }

  return (
    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
      {conversation.assignedStaffDisplayName || "Claimed"}
    </span>
  );
};

const CustomerChatPage = () => {
  const { user } = useAuth();
  const currentStaffKey = user?.username || user?.email || "";
  const isAdmin = user?.role === "ADMIN";

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageMap, setMessageMap] = useState({});
  const [typingMap, setTypingMap] = useState({});
  const [draft, setDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [scope, setScope] = useState("ALL");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingSentRef = useRef(false);
  const filtersRef = useRef({ keyword: "", scope: "ALL", staffKey: "" });
  const selectedConversationIdRef = useRef(null);

  useEffect(() => {
    filtersRef.current = { keyword, scope, staffKey: currentStaffKey };
  }, [keyword, scope, currentStaffKey]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.conversationId === selectedConversationId,
      ) || null,
    [conversations, selectedConversationId],
  );

  const currentMessages = messageMap[selectedConversationId] || [];
  const isMine = selectedConversation?.assignedStaffKey === currentStaffKey;
  const canClaim =
    Boolean(selectedConversationId) &&
    (!selectedConversation?.assignedStaffKey || isAdmin);
  const canRelease =
    Boolean(selectedConversation?.assignedStaffKey) && (isMine || isAdmin);
  const canManageStatus =
    Boolean(selectedConversationId) &&
    (!selectedConversation?.assignedStaffKey || isMine || isAdmin);
  const canReply =
    Boolean(selectedConversationId) &&
    (!selectedConversation?.assignedStaffKey || isMine || isAdmin);

  const syncSelection = (nextConversations) => {
    setSelectedConversationId((prev) => {
      if (prev && nextConversations.some((item) => item.conversationId === prev)) {
        return prev;
      }
      return nextConversations[0]?.conversationId || null;
    });
  };

  useEffect(() => {
    syncSelection(conversations);
  }, [conversations]);

  const loadConversations = async (overrideKeyword = keyword, overrideScope = scope) => {
    try {
      const res = await chatService.getConversations({
        keyword: overrideKeyword || undefined,
        scope: overrideScope || "ALL",
      });
      const nextConversations = Array.isArray(res.data) ? res.data : [];
      setConversations(nextConversations);
      syncSelection(nextConversations);
    } catch {
      toast.error("Could not load conversations");
    }
  };

  useEffect(() => {
    loadConversations();
  }, [keyword, scope]);

  useEffect(() => {
    let isMounted = true;

    const connect = async () => {
      try {
        const socket = await chatService.connect();
        if (!isMounted) {
          socket.close();
          return;
        }

        wsRef.current = socket;

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "ADMIN_SNAPSHOT") {
              const nextConversations = applyConversationFilter(
                data.payload?.conversations,
                filtersRef.current.keyword,
                filtersRef.current.scope,
                filtersRef.current.staffKey,
              );
              setConversations(nextConversations);
              syncSelection(nextConversations);
            }

            if (data.type === "MESSAGE") {
              const incomingMessage = data.payload;
              setMessageMap((prev) => ({
                ...prev,
                [incomingMessage.conversationId]: mergeMessages(
                  prev[incomingMessage.conversationId] || [],
                  [incomingMessage],
                ),
              }));
              setTypingMap((prev) => ({
                ...prev,
                [incomingMessage.conversationId]: false,
              }));

              const isCustomerMessage =
                incomingMessage.senderRole === "CUSTOMER" ||
                incomingMessage.senderRole === "GUEST";
              const isCurrentConversation =
                incomingMessage.conversationId === selectedConversationIdRef.current;

              if (isCustomerMessage && !isCurrentConversation) {
                toast.info(
                  `${incomingMessage.senderDisplayName || "Customer"}: ${incomingMessage.content}`,
                  {
                    toastId: `chat-message-${incomingMessage.id}`,
                    autoClose: 5000,
                  },
                );
              }
            }

            if (data.type === "CONVERSATION_STATE") {
              setConversations((prev) =>
                applyConversationFilter(
                  upsertConversation(prev, data.payload),
                  filtersRef.current.keyword,
                  filtersRef.current.scope,
                  filtersRef.current.staffKey,
                ),
              );
            }

            if (data.type === "TYPING" && data.payload?.conversationId) {
              setTypingMap((prev) => ({
                ...prev,
                [data.payload.conversationId]: Boolean(data.payload?.typing),
              }));
            }

            if (data.type === "ERROR" && data.payload?.message) {
              toast.error(data.payload.message);
            }
          } catch (error) {
            console.error("Admin chat parse error:", error);
          }
        };

        socket.onclose = () => {
          if (!isMounted) return;
          reconnectRef.current = window.setTimeout(() => {
            connect();
          }, 2500);
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch {
        if (!isMounted) return;
        reconnectRef.current = window.setTimeout(() => {
          connect();
        }, 2500);
      }
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
      } catch {
        toast.error("Could not load messages");
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
    if (!selectedConversationId || !canReply) {
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
  }, [draft, selectedConversationId, canReply]);

  const handleSendMessage = () => {
    if (!draft.trim() || !selectedConversationId) return;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error("Chat connection interrupted");
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

  const handleConversationAction = async (executor, successMessage) => {
    if (!selectedConversationId) return;

    setActionLoading(true);
    try {
      const res = await executor(selectedConversationId);
      setConversations((prev) =>
        applyConversationFilter(
          upsertConversation(prev, res.data),
          filtersRef.current.keyword,
          filtersRef.current.scope,
          filtersRef.current.staffKey,
        ),
      );
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data || "Could not update conversation");
    } finally {
      setActionLoading(false);
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
      "CHAT HISTORY",
      `Customer: ${customerName}`,
      `Staff: ${adminName}`,
      `Exported time: ${exportedAt.label}`,
      "",
      ...currentMessages.map((message) => {
        const senderName = message.senderDisplayName || "Anonymous";
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

    const result = await Swal.fire({
      title: "Delete conversation?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

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
      toast.success("Conversation deleted successfully");
    } catch {
      toast.error("Could not delete conversation");
    }
  };

  return (
    <div className="admin-page-shell admin-page-shell--chat min-h-screen p-6 font-poppins antialiased text-slate-600">
      <div className="mx-auto flex max-w-7xl gap-6">
        <div className="w-[360px] rounded-[2rem] border border-slate-100 bg-white/95 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-slate-900">
              Customer Chat
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor, claim, and respond to customers in real-time
            </p>
          </div>

          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search by customer or staff member..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-green-400 focus:bg-white"
              />
            </div>

            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-green-400 focus:bg-white"
            >
              <option value="ALL">All conversations</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="MINE">My conversations</option>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Closed</option>
            </select>
          </div>

          <div className="space-y-3">
            {conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No matching conversations
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
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
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

                    <div className="mt-2">
                      <ConversationBadge
                        conversation={conversation}
                        currentStaffKey={currentStaffKey}
                      />
                    </div>

                    {conversation.assignedStaffDisplayName && (
                      <p className="mt-2 text-xs text-slate-500">
                        Assigned: {conversation.assignedStaffDisplayName}
                      </p>
                    )}

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
                {selectedConversation?.customerDisplayName || "Customer"}
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
                {selectedConversation && (
                  <ConversationBadge
                    conversation={selectedConversation}
                    currentStaffKey={currentStaffKey}
                  />
                )}
              </div>
              {selectedConversation?.assignedStaffDisplayName && (
                <p className="mt-2 text-xs text-slate-500">
                  Assigned staff: {selectedConversation.assignedStaffDisplayName}
                </p>
              )}
            </div>

            {selectedConversationId && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {canClaim && (
                  <button
                    type="button"
                    onClick={() =>
                      handleConversationAction(
                        chatService.claimConversation,
                        "Claimed conversation successfully",
                      )
                    }
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-all hover:bg-green-100 disabled:opacity-60"
                  >
                    <UserCheck size={16} />
                    Claim
                  </button>
                )}

                {canRelease && (
                  <button
                    type="button"
                    onClick={() =>
                      handleConversationAction(
                        chatService.releaseConversation,
                        "Released conversation successfully",
                      )
                    }
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-60"
                  >
                    <LockOpen size={16} />
                    Release
                  </button>
                )}

                {canManageStatus && !selectedConversation?.resolved && (
                  <button
                    type="button"
                    onClick={() =>
                      handleConversationAction(
                        chatService.resolveConversation,
                        "Closed conversation successfully",
                      )
                    }
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-all hover:bg-indigo-100 disabled:opacity-60"
                  >
                    <CheckCheck size={16} />
                    Close conversation
                  </button>
                )}

                {canManageStatus && selectedConversation?.resolved && (
                  <button
                    type="button"
                    onClick={() =>
                      handleConversationAction(
                        chatService.reopenConversation,
                        "Reopened conversation successfully",
                      )
                    }
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-60"
                  >
                    <LockOpen size={16} />
                    Reopen
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportConversation}
                  className="flex h-10 w-10 items-center justify-center text-slate-600 transition-all hover:text-green-700"
                  aria-label="Export chat history"
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConversation}
                  className="flex h-10 w-10 items-center justify-center text-slate-500 transition-all hover:text-red-600"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {!canReply && selectedConversationId && (
            <div className="border-b border-amber-100 bg-amber-50 px-6 py-3 text-sm text-amber-700">
              This conversation is being handled by {selectedConversation?.assignedStaffDisplayName}. You can only view it until it is released or claimed.
            </div>
          )}

          {selectedConversation?.resolved && (
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600">
              This conversation is closed. Send a new message or click "Reopen" to continue.
            </div>
          )}

          <div
            ref={messagesEndRef}
            className="flex-1 space-y-4 overflow-y-auto bg-slate-50/40 px-6 py-5"
          >
            {!selectedConversationId ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                <MessageCircle size={34} className="mb-3 text-slate-300" />
                Select a conversation to start chatting
              </div>
            ) : loadingMessages ? (
              <div className="flex h-full items-center justify-center gap-2 text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Loading messages...
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
                placeholder="Type a message..."
                disabled={!selectedConversationId || !canReply}
                className="min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-green-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!draft.trim() || !selectedConversationId || !canReply}
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
