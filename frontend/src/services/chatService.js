import axiosClient from "./axiosClient";

const HTTP_BASE_URL = "http://localhost:8080";

const getSocketBaseUrl = () => HTTP_BASE_URL.replace(/^http/, "ws");

const buildSocketUrl = () => {
  const token = localStorage.getItem("token");
  if (token) {
    return `${getSocketBaseUrl()}/ws/chat?token=${encodeURIComponent(token)}`;
  }

  let guestId = localStorage.getItem("chat_guest_id");
  if (!guestId) {
    guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("chat_guest_id", guestId);
  }

  return `${getSocketBaseUrl()}/ws/chat?guestId=${encodeURIComponent(guestId)}`;
};

const chatService = {
  connect: () => new WebSocket(buildSocketUrl()),
  getConversations: () => axiosClient.get("/chat/conversations"),
  getConversationMessages: (conversationId) =>
    axiosClient.get(`/chat/conversations/${conversationId}/messages`),
  deleteConversation: (conversationId) =>
    axiosClient.delete(`/chat/conversations/${conversationId}`),
};

export default chatService;
