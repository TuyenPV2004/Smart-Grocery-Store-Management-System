import axiosClient from "./axiosClient";

const voucherService = {
  getAll: () => axiosClient.get("/vouchers"),
  getActive: () => axiosClient.get("/vouchers/active"),
  validate: (code) => axiosClient.post(`/vouchers/validate?code=${code}`),
  create: (data) => axiosClient.post("/vouchers", data),
  update: (id, data) => axiosClient.put(`/vouchers/${id}`, data),
  delete: (id) => axiosClient.delete(`/vouchers/${id}`),
};

export default voucherService;
