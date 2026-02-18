import axiosClient from "./axiosClient";

const stockService = {
  // Get stock summary (all products with aggregated quantities)
  getSummary: (status) => {
    const params = status ? { status } : {};
    return axiosClient.get("/stocks/summary", { params });
  },

  // Get dashboard statistics
  getDashboardStats: () => axiosClient.get("/stocks/dashboard"),

  // Get batches with expiry status (FEFO ordered)
  getBatchesWithExpiry: (status) => {
    const params = status ? { status } : {};
    return axiosClient.get("/stocks/batches/expiry", { params });
  },

  // Get stock card history for a product
  getStockCard: (productId) => axiosClient.get(`/stocks/card/${productId}`),
};

export default stockService;
