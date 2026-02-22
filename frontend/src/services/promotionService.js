import axiosClient from "./axiosClient";

const promotionService = {
  getAll: () => axiosClient.get("/promotions"),
  getById: (id) => axiosClient.get(`/promotions/${id}`),
  create: (data) => axiosClient.post("/promotions", data),
  update: (id, data) => axiosClient.put(`/promotions/${id}`, data),
  delete: (id) => axiosClient.delete(`/promotions/${id}`),
};

export default promotionService;
