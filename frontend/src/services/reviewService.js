import axiosClient from "./axiosClient";

const reviewService = {
  getAll: () => axiosClient.get("/reviews"),
  getByProduct: (productId) => axiosClient.get(`/reviews/products/${productId}`),
  getEligibility: (productId) => axiosClient.get(`/reviews/products/${productId}/eligibility`),
  create: (productId, data) => axiosClient.post(`/reviews/products/${productId}`, data),
  reply: (reviewId, data) => axiosClient.patch(`/reviews/${reviewId}/reply`, data),
};

export default reviewService;
