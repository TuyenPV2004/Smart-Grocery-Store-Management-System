import axiosClient from "./axiosClient";

const dashboardService = {
  getStats: async () => {
    return await axiosClient.get("/dashboard/stats");
  },
};

export default dashboardService;
