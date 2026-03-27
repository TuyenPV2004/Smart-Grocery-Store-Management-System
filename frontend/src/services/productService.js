import axiosClient from "./axiosClient";

const normalizeQueryParams = (params = {}) => {
  const normalized = { ...params };

  if (normalized.search && !normalized.keyword) {
    normalized.keyword = normalized.search;
  }

  if (normalized.pageSize && normalized.size == null) {
    normalized.size = normalized.pageSize;
  }

  delete normalized.search;
  delete normalized.pageSize;

  Object.keys(normalized).forEach((key) => {
    if (
      normalized[key] === "" ||
      normalized[key] === null ||
      normalized[key] === undefined
    ) {
      delete normalized[key];
    }
  });

  return normalized;
};

const productService = {
  getAll: (params) =>
    axiosClient.get("/products", { params: normalizeQueryParams(params) }),
  get: (id) => axiosClient.get(`/products/${id}`),
  create: (productData, imageFile) => {
    const formData = new FormData();
    formData.append("product", JSON.stringify(productData));
    if (imageFile) formData.append("image", imageFile);
    return axiosClient.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, productData, imageFile) => {
    const formData = new FormData();
    formData.append("product", JSON.stringify(productData));
    if (imageFile) formData.append("image", imageFile);
    return axiosClient.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  createQuickProduct: (data) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("barcode", data.barcode || "");
    formData.append("supplierId", data.supplierId || "");
    if (data.importPrice) formData.append("importPrice", data.importPrice);
    if (data.sku) formData.append("sku", data.sku);
    if (data.shelfLife) formData.append("shelfLife", data.shelfLife);

    if (data.imageFile) {
      formData.append("imageFile", data.imageFile);
    }

    return axiosClient.post("/products/quick", formData);
  },
  delete: (id) => axiosClient.delete(`/products/${id}`),

  getHistory: (id) => axiosClient.get(`/products/${id}/history`),

  getProductBySku: (sku) => axiosClient.get(`/products/sku/${sku}`),

  uploadImage: (productId, imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return axiosClient.post(`/products/${productId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteImage: (productId, imageId) =>
    axiosClient.delete(`/products/${productId}/images/${imageId}`),
};

export default productService;
