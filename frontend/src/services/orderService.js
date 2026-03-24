import axiosClient from "./axiosClient";

const orderService = {
  create: (data) => axiosClient.post("/orders", data),
  getAll: () => axiosClient.get("/orders"),
  exportExcel: (id) =>
    axiosClient.get(`/orders/${id}/export`, { responseType: "blob" }),
  getMyOrders: () => axiosClient.get("/orders/my-orders"),
  cancelOrder: (id) => axiosClient.patch(`/orders/${id}/cancel`),
  updateStatus: (id, status) =>
    axiosClient.patch(`/orders/${id}/status`, null, { params: { status } }),
};

export default orderService;
