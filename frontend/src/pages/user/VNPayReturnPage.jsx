import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CircleCheck, Loader2, XCircle } from "lucide-react";
import { useCart } from "../../context/CartContext";
import paymentService from "../../services/paymentService";

const VNPayReturnPage = () => {
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");
  const [orderDetails, setOrderDetails] = useState(null);
  const location = useLocation();
  const { clearCart } = useCart();

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "Không xác định";
    return new Date(dateValue).toLocaleString("vi-VN");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));
  };

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        const queryParams = location.search;
        if (!queryParams) {
          setStatus("failed");
          setMessage("Không tìm thấy thông tin thanh toán");
          return;
        }

        const response = await paymentService.vnpayReturn(queryParams);
        const result = response.data || {};

        setMessage(result.message || "Không thể xác định trạng thái thanh toán");
        setOrderDetails({
          code: result.orderCode,
          amount: result.finalAmount,
          orderStatus: result.orderStatus,
          paymentStatus: result.paymentStatus,
          paidAt: result.paymentConfirmedAt,
          expiresAt: result.paymentExpiresAt,
          transactionNo: result.paymentTransactionNo,
        });

        if (result.status === "success") {
          clearCart();
          localStorage.removeItem("pendingVnpayOrderCode");
          setStatus("success");
        } else {
          localStorage.removeItem("pendingVnpayOrderCode");
          setStatus("failed");
        }
      } catch (error) {
        console.error("Lỗi khi xử lý callback VNPAY:", error);
        const backendMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Có lỗi hệ thống xảy ra trong quá trình xác thực thanh toán.";
        localStorage.removeItem("pendingVnpayOrderCode");
        setStatus("failed");
        setMessage(backendMessage);
      }
    };

    processPaymentReturn();
  }, [clearCart, location.search]);

  return (
    <div className="bg-gradient-to-b from-emerald-50 via-slate-50 to-emerald-100 flex flex-col items-center pt-8 p-4 font-poppins pb-24">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center mt-2">
        {status === "processing" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
            <h2 className="text-xl font-medium text-slate-800">Đang xử lý</h2>
            <p className="text-slate-500 mt-2">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="mb-6">
              <CircleCheck
                size={80}
                className="fill-green-500 text-white rounded-full p-2"
              />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              Thanh toán thành công!
            </h2>
            <p className="text-slate-500 mb-6">{message}</p>

            {orderDetails && (
              <div className="bg-slate-50 p-4 rounded-xl w-full text-left mb-6 border border-slate-100 space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 text-sm">Mã đơn hàng:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {orderDetails.code || "---"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 text-sm">Số tiền:</span>
                  <span className="font-semibold text-emerald-600 text-right">
                    {formatCurrency(orderDetails.amount)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 text-sm">Trạng thái đơn:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {orderDetails.orderStatus || "---"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 text-sm">
                    Trạng thái thanh toán:
                  </span>
                  <span className="font-semibold text-slate-800 text-right">
                    {orderDetails.paymentStatus || "---"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 text-sm">Mã giao dịch:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {orderDetails.transactionNo || "---"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 text-sm">Xác nhận lúc:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {formatDateTime(orderDetails.paidAt)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col w-full gap-3">
              <Link
                to="/order-history"
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-md shadow-green-200"
              >
                Xem lịch sử đơn hàng
              </Link>
              <Link
                to="/products"
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="mb-6">
              <XCircle
                size={80}
                className="fill-rose-500 text-white rounded-full p-2"
              />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              Thanh toán không thành công
            </h2>
            <p className="text-slate-500 mb-6">{message}</p>

            {orderDetails?.code && (
              <div className="bg-slate-50 p-4 rounded-xl w-full text-left mb-6 border border-slate-100 space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 text-sm">Mã đơn hàng:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {orderDetails.code}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 text-sm">Trạng thái đơn:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {orderDetails.orderStatus || "---"}
                  </span>
                </div>
                {orderDetails.expiresAt && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 text-sm">Hết hạn lúc:</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {formatDateTime(orderDetails.expiresAt)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col w-full gap-3">
              <Link
                to="/cart"
                className="w-full py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-all shadow-md shadow-rose-200"
              >
                Quay lại giỏ hàng
              </Link>
              <Link
                to="/order-history"
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
              >
                Xem đơn hàng của tôi
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VNPayReturnPage;
