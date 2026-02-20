import axiosClient from "./axiosClient";

const bankAccountService = {
  getAll: () => {
    return axiosClient.get("/bank-accounts");
  },

  getById: (id) => {
    return axiosClient.get(`/bank-accounts/${id}`);
  },

  create: (data) => {
    return axiosClient.post("/bank-accounts", data);
  },

  update: (id, data) => {
    return axiosClient.put(`/bank-accounts/${id}`, data);
  },

  delete: (id) => {
    return axiosClient.delete(`/bank-accounts/${id}`);
  },
};

export default bankAccountService;
