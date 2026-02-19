import axiosClient from "./axiosClient";

const orderService = {
  create: (data) => axiosClient.post("/orders", data),
};

export default orderService;