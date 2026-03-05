import axiosClient from "./axiosClient";

const dashboardService = {
  getStats: async (days = 7) => {
    return await axiosClient.get("/dashboard/stats", {
      params: { days },
    });
  },
};

export default dashboardService;
