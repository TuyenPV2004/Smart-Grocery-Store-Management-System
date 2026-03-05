import axiosClient from "./axiosClient";

const dashboardService = {
  getStats: async (days = 7) => {
    return await axiosClient.get("/dashboard/stats", {
      params: { days },
    });
  },

  getTopProducts: async (days = 7, limit = 5) => {
    return await axiosClient.get("/dashboard/top-products", {
      params: { days, limit },
    });
  },

  getCategorySales: async (days = 7) => {
    return await axiosClient.get("/dashboard/category-sales", {
      params: { days },
    });
  },
};

export default dashboardService;
