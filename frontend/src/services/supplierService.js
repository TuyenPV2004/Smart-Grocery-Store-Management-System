import axiosClient from "./axiosClient";

const supplierService = {
  getAll: () => axiosClient.get("/suppliers"),
  create: (data, logoFile) => {
    if (!logoFile) return axiosClient.post("/suppliers", data);

    const formData = new FormData();
    formData.append("supplier", JSON.stringify(data));
    formData.append("logo", logoFile);
    return axiosClient.post("/suppliers", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, data, logoFile) => {
    if (!logoFile) return axiosClient.put(`/suppliers/${id}`, data);

    const formData = new FormData();
    formData.append("supplier", JSON.stringify(data));
    formData.append("logo", logoFile);
    return axiosClient.put(`/suppliers/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  toggleStatus: (id) => axiosClient.patch(`/suppliers/${id}/status`),
  delete: (id) => axiosClient.delete(`/suppliers/${id}`),
};

export default supplierService;
