import axiosClient from "./axiosClient";

const paymentService = {
  createPayment: (orderId) => {
    return axiosClient.get(`/payment/create_payment/${orderId}`);
  },
  vnpayReturn: (queryParams) => {
    return axiosClient.get(`/payment/vnpay_return${queryParams}`);
  },
};

export default paymentService;
