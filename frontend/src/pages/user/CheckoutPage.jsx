import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Loader2, QrCode } from "lucide-react";
import { toast } from "react-toastify";
import orderService from "../../services/orderService";
import paymentService from "../../services/paymentService";

const CheckoutPage = () => {
  const { cartItems, getProductPrice, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  // Kế thừa các giá trị state từ router (nếu được truyền sang)
  const appliedVoucher = location.state?.appliedVoucher || null;
  const cartDiscount = location.state?.cartDiscount || 0;
  const finalTotal = cartTotal - cartDiscount;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));
  };

  const handleConfirmCheckout = async () => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để thanh toán!");
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      toast.warning("Giỏ hàng của bạn đang trống!");
      navigate("/cart");
      return;
    }

    setIsProcessing(true);

    const orderData = {
      customerName: user.fullName || user.username || "Khách hàng",
      customerPhone: user.phone || "Đang cập nhật",
      paymentMethod: "CHUYEN_KHOAN", 
      pendingConfirmation: true,
      discount: cartDiscount,
      voucherCode: appliedVoucher ? appliedVoucher.code : "",
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: getProductPrice(item.product),
      })),
    };

    try {
      const res = await orderService.create(orderData);
      const orderCreated = res.data;
      
      const paymentRes = await paymentService.createPayment(orderCreated.id);
      if (paymentRes.data && paymentRes.data.paymentUrl) {
        window.location.href = paymentRes.data.paymentUrl;
      } else {
        toast.error("Không lấy được URL thanh toán từ hệ thống VNPAY.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      toast.error("Có lỗi xảy ra khi tạo mã đơn hàng. Vui lòng thử lại!");
      setIsProcessing(false);
    }
  };

  if (!user || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Đang điều hướng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-6 pb-12 px-4 sm:px-6 font-poppins relative">
      <div className="max-w-4xl mx-auto">
        {/* Header */}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Cột trái: Thông tin người nhận & Hướng dẫn */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-medium text-slate-800 mb-4 pb-4 border-b border-slate-100">
                Thông tin người mua
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-sm text-slate-500 font-medium block mb-1">
                    Tên người nhận
                  </label>
                  <p className="font-semibold text-slate-800 text-base">
                    {user?.fullName || user?.username || "Khách hàng"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-500 font-medium block mb-1">
                    Số điện thoại
                  </label>
                  <p className="font-semibold text-slate-800 text-base">
                    {user?.phone || "Cần cập nhật trong hồ sơ"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-700 font-medium mb-3">
                <QrCode size={20} />
                Hướng dẫn thanh toán
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Sau khi nhấn nút <strong className="font-semibold text-slate-800">"Thanh toán"</strong>, hệ thống sẽ bảo lưu đơn hàng của bạn và chuyển hướng sang cổng thanh toán điện tử an toàn VNPAY.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Vui lòng sử dụng ứng dụng ngân hàng trên điện thoại có hỗ trợ VNPAY-QR hoặc thẻ ATM nội địa hoặc thẻ quốc tế để hoàn tất việc chuyển khoản.
              </p>
            </div>
          </div>

          {/* Cột phải: Tóm tắt đơn hàng */}
          <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sticky top-6">
             <h2 className="text-lg font-medium text-slate-800 mb-4">
                Tóm tắt đơn hàng
             </h2>
             
             <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="flex-1 pr-4">
                         <span className="text-slate-800 font-medium line-clamp-2 leading-snug">{item.product.name}</span>
                         <span className="text-slate-500 mt-0.5 block">x{item.quantity}</span>
                      </div>
                      <span className="text-slate-800 font-medium whitespace-nowrap">
                         {formatCurrency(getProductPrice(item.product) * item.quantity)}
                      </span>
                   </div>
                ))}
             </div>

             <div className="border-t border-slate-100 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Tổng số sản phẩm</span>
                  <span className="font-medium text-slate-700">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Tạm tính</span>
                  <span className="font-medium text-slate-700">{formatCurrency(cartTotal)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Giảm giá {appliedVoucher ? `(${appliedVoucher.code})` : ''}</span>
                    <span className="font-medium">-{formatCurrency(cartDiscount)}</span>
                  </div>
                )}
             </div>

             <div className="bg-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-100 flex items-center justify-between">
                <div className="text-sm text-emerald-00 font-medium">Tổng cộng:</div>
                <div className="text-2xl font-medium text-emerald-600">
                   {formatCurrency(finalTotal)}
                </div>
             </div>

             <button
               onClick={handleConfirmCheckout}
               disabled={isProcessing}
               className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {isProcessing ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" />
                   Đang khởi tạo
                 </>
               ) : (
                 "Thanh toán"
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
