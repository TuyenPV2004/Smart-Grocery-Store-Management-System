import axiosClient from "./axiosClient";

const orderService = {
  create: (data) => axiosClient.post("/orders", data),
  getAll: () => axiosClient.get("/orders"),
};

export default orderService;
