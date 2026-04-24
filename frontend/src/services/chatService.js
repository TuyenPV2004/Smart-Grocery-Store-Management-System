import axiosClient from "./axiosClient";

const HTTP_BASE_URL = import.meta.env.VITE_GATEWAY_BASE_URL || "http://localhost:8088";

const getSocketBaseUrl = () => HTTP_BASE_URL.replace(/^http/, "ws");

const createSocketTicket = async () => {
  const guestToken = localStorage.getItem("chat_guest_token");
  const guestDisplayName = localStorage.getItem("chat_guest_display_name");

  const response = await axiosClient.post("/chat/socket-ticket", {
    guestToken,
    guestDisplayName,
  });

  if (response.data?.guestToken) {
    localStorage.setItem("chat_guest_token", response.data.guestToken);
  }

  if (response.data?.guestDisplayName) {
    localStorage.setItem("chat_guest_display_name", response.data.guestDisplayName);
  }

  return response.data;
};

const chatService = {
  connect: async () => {
    const ticketData = await createSocketTicket();
    return new WebSocket(
      `${getSocketBaseUrl()}/ws/chat?ticket=${encodeURIComponent(ticketData.ticket)}`,
    );
  },
  getConversations: (params) => axiosClient.get("/chat/conversations", { params }),
  getConversationMessages: (conversationId) =>
    axiosClient.get(`/chat/conversations/${conversationId}/messages`),
  claimConversation: (conversationId) =>
    axiosClient.post(`/chat/conversations/${conversationId}/claim`),
  releaseConversation: (conversationId) =>
    axiosClient.post(`/chat/conversations/${conversationId}/release`),
  resolveConversation: (conversationId) =>
    axiosClient.post(`/chat/conversations/${conversationId}/resolve`),
  reopenConversation: (conversationId) =>
    axiosClient.post(`/chat/conversations/${conversationId}/reopen`),
  deleteConversation: (conversationId) =>
    axiosClient.delete(`/chat/conversations/${conversationId}`),
};

export default chatService;
