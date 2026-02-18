import axiosClient from "./axiosClient";

const inventoryService = {
  create: (data) => {
    return axiosClient.post("/inventory", data);
  },
  getHistory: (params) => {
    return axiosClient.get("/inventory", { params });
  },
  createImportNote: (data) => {
    return axiosClient.post("/inventory/import", data);
  },
  createExport: (data) => axiosClient.post('/inventory/export', data),
  getAll: () => {
    return axiosClient.get("/inventory");
  },
  exportExcel: (id) => {
    return axiosClient.get(`/inventory/${id}/export`, {
      responseType: "blob",
    });
  },
  getById: (id) => {
    return axiosClient.get(`/inventory/${id}`);
  },
  delete: (id) => {
    return axiosClient.delete(`/inventory/${id}`);
  },
};

export default inventoryService;
