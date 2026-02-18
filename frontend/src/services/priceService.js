import axiosClient from "./axiosClient";

const priceService = {
  updateProductPrice: (productId, newPrice) => {
    return axiosClient.put(`/products/${productId}/price`, { newPrice });
  },

  getPriceHistory: (productId) => {
    return axiosClient.get(`/products/${productId}/price-history`);
  },
};

export default priceService;
