import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CircleCheck, XCircle, Loader2 } from "lucide-react";
import paymentService from "../../services/paymentService";

const VNPayReturnPage = () => {
  const [status, setStatus] = useState("processing"); // processing, success, failed
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");
  const [orderDetails, setOrderDetails] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const formatDateTime = (vnpDate) => {
    if (!vnpDate || vnpDate.length !== 14) return vnpDate;
    const year = vnpDate.substring(0, 4);
    const month = vnpDate.substring(4, 6);
    const day = vnpDate.substring(6, 8);
    const hour = vnpDate.substring(8, 10);
    const minute = vnpDate.substring(10, 12);
    const second = vnpDate.substring(12, 14);
    return `${hour}:${minute}:${second} ${day}/${month}/${year}`;
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
        if (response.data.status === "success") {
          setStatus("success");
          setMessage("Thanh toán đơn hàng thành công!");

          const params = new URLSearchParams(queryParams);
          const rawAmount = params.get("vnp_Amount");
          const parsedAmount = rawAmount ? Number(rawAmount) / 100 : 0;
          
          setOrderDetails({
            code: params.get("vnp_TxnRef"),
            time: formatDateTime(params.get("vnp_PayDate")),
            amount: isNaN(parsedAmount) ? 0 : parsedAmount,
          });
        } else {
          setStatus("failed");
          setMessage("Thanh toán thất bại hoặc đã bị dở dang.");
        }
      } catch (error) {
        console.error("Lỗi khi xử lý callback VNPAY:", error);
        setStatus("failed");
        setMessage("Có lỗi hệ thống xảy ra trong quá trình xác thực thanh toán.");
      }
    };

    processPaymentReturn();
  }, [location]);

  return (
    <div className="bg-[#F8FAFC] flex flex-col items-center pt-8 p-4 font-poppins pb-24">
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
              <CircleCheck size={80} className="fill-green-500 text-white rounded-full p-2" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              Thanh toán thành công!
            </h2>
            <p className="text-slate-500 mb-6">{message}</p>

            {orderDetails && (
              <div className="bg-slate-50 p-4 rounded-xl w-full text-left mb-6 border border-slate-100">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 text-sm">Mã đơn hàng:</span>
                  <span className="font-semibold text-slate-800">{orderDetails.code}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 text-sm">Số tiền:</span>
                  <span className="font-semibold text-slate-800 font-medium text-emerald-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(orderDetails.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Thời gian:</span>
                  <span className="font-semibold text-slate-800">{orderDetails.time}</span>
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
              <XCircle size={80} className="fill-rose-500 text-white rounded-full p-2" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              Thanh toán thất bại
            </h2>
            <p className="text-slate-500 mb-8">{message}</p>
            <div className="flex flex-col w-full gap-3">
              <Link
                to="/cart"
                className="w-full py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-all shadow-md shadow-rose-200"
              >
                Quay lại giỏ hàng
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VNPayReturnPage;
