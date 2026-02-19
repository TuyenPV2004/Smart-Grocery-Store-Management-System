import axiosClient from "./axiosClient";

const priceService = {
  updateProductPrice: (productId, newPrice) => {
    return axiosClient.put(`/products/${productId}/price`, { newPrice });
  },

  updateSellPrice: (productId, newPrice) => {
    return axiosClient.post(
      `/products/${productId}/sell-price`,
      {},
      {
        params: { newPrice },
      },
    );
  },

  getPriceHistory: (productId) => {
    return axiosClient.get(`/products/${productId}/price-history`);
  },
};

export default priceService;
