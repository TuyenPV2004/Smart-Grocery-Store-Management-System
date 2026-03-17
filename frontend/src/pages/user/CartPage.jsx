import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/orderService";
import paymentService from "../../services/paymentService";
import bankAccountService from "../../services/bankAccountService";
import voucherService from "../../services/voucherService";
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  QrCode,
  X,
  CheckCircle,
  Loader2,
  User,
  XCircle,
} from "lucide-react";

const bankOptions = [
  {
    name: "Ngân hàng Quân đội",
    code: "MB",
    logo: "https://api.vietqr.io/img/MB.png",
    brand: "MB Bank",
  },
  {
    name: "Ngân hàng TMCP Công Thương Việt Nam",
    code: "ICB",
    logo: "https://rabbitcare.vn/_next/image?url=https%3A%2F%2Fstorage.googleapis.com%2Fround-fold%2FVietinbank_logo_40f464dd33%2FVietinbank_logo_40f464dd33.jpg&w=3840&q=25",
    brand: "VietinBank",
  },
  {
    name: "Ngân hàng TMCP Phát triển TP. Hồ Chí Minh",
    code: "HDB",
    logo: "https://api.vietqr.io/img/HDB.png",
    brand: "HDBank",
  },
  {
    name: "Ngân hàng TMCP Đại Dương",
    code: "OJB",
    logo: "https://api.vietqr.io/img/OJB.png",
    brand: "OceanBank",
  },
  {
    name: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
    code: "VPB",
    logo: "https://api.vietqr.io/img/VPB.png",
    brand: "VPBank",
  },
  {
    name: "Ngân hàng TMCP Xuất nhập khẩu Việt Nam",
    code: "EIB",
    logo: "https://api.vietqr.io/img/EIB.png",
    brand: "Eximbank",
  },
  {
    name: "Ngân hàng TMCP Đông Nam Á",
    code: "SEAB",
    logo: "https://api.vietqr.io/img/SEAB.png",
    brand: "SeABank",
  },
  {
    name: "Ngân hàng TMCP Sài Gòn",
    code: "SCB",
    logo: "https://api.vietqr.io/img/SCB.png",
    brand: "Saigonbank",
  },
  {
    name: "Ngân hàng TMCP Tiên Phong",
    code: "TPB",
    logo: "https://api.vietqr.io/img/TPB.png",
    brand: "TPBank",
  },
];

const findBank = (bankName) => {
  if (!bankName) return null;
  const normalized = bankName.toLowerCase();
  return bankOptions.find(
    (b) =>
      normalized.includes(b.name.toLowerCase()) ||
      normalized.includes(b.brand.toLowerCase()) ||
      b.name.toLowerCase().includes(normalized) ||
      b.brand.toLowerCase().includes(normalized),
  );
};

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartTotal,
    clearCart,
    getProductPrice,
  } = useCart();
  const { user } = useAuth(); // Lấy thông tin user đang đăng nhập
  const navigate = useNavigate();

  // State cho Modal Thanh toán
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [generatedOrderCode, setGeneratedOrderCode] = useState("");
  const [selectedQR, setSelectedQR] = useState(null);
  const [waitingOrder, setWaitingOrder] = useState(null);
  const [waitingSeconds, setWaitingSeconds] = useState(300);
  const [finalizingStatus, setFinalizingStatus] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  // Thêm State Cho Voucher
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  const generateOrderCode = () => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    const dd = now.getDate().toString().padStart(2, "0");
    const hh = now.getHours().toString().padStart(2, "0");
    const min = now.getMinutes().toString().padStart(2, "0");
    const ss = now.getSeconds().toString().padStart(2, "0");
    return `ORD${yy}${mm}${dd}${hh}${min}${ss}`;
  };

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const res = await bankAccountService.getAll();
        const activeAccounts = res.data.filter(
          (acc) => acc.status === "ACTIVE",
        );
        setBankAccounts(activeAccounts);
      } catch (error) {
        console.error("Lỗi tải danh sách ngân hàng:", error);
      }
    };
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (!waitingOrder || finalResult) return;

    const interval = setInterval(() => {
      setWaitingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalizeOrder("CANCELLED", true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [waitingOrder, finalResult]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/100x100?text=No+Image";
    if (path.startsWith("http")) return path;
    return `http://localhost:8080/${path}`;
  };

  const calculateDiscount = () => {
    if (!appliedVoucher) return 0;
    let discount = 0;
    if (appliedVoucher.discountType === "PERCENTAGE") {
      discount = (cartTotal * appliedVoucher.discountValue) / 100;
      if (
        appliedVoucher.maxDiscountAmount &&
        discount > appliedVoucher.maxDiscountAmount
      ) {
        discount = appliedVoucher.maxDiscountAmount;
      }
    } else {
      discount = appliedVoucher.discountValue;
    }
    return discount > cartTotal ? cartTotal : discount;
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsApplyingVoucher(true);
    setVoucherError("");
    setAppliedVoucher(null);
    try {
      const res = await voucherService.validate(voucherCode.trim());
      const resVoucher = res.data;
      if (resVoucher.minOrderValue && cartTotal < resVoucher.minOrderValue) {
        setVoucherError(
          `Đơn hàng cần đạt tối thiểu ${formatCurrency(resVoucher.minOrderValue)}`,
        );
        return;
      }
      setAppliedVoucher(resVoucher);
      toast.success("Áp dụng mã giảm giá thành công!");
    } catch (error) {
      setVoucherError(
        error.response?.data || "Mã giảm giá không hợp lệ hoặc đã hết hạn",
      );
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherError("");
  };

  const cartDiscount = calculateDiscount();
  const finalTotal = cartTotal - cartDiscount;

  const formatCountdown = (seconds) => {
    const mm = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const ss = (seconds % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const resetWaitingFlow = () => {
    setTimeout(() => {
      setWaitingOrder(null);
      setWaitingSeconds(300);
      setFinalResult(null);
    }, 1200);
  };

  const handleFinalizeOrder = async (status, isAutoCancel = false) => {
    if (!waitingOrder?.id) return;

    setFinalizingStatus(true);
    try {
      await orderService.updateStatus(waitingOrder.id, status);
      setFinalResult(status);

      if (status === "COMPLETED") {
        clearCart();
        setOrderSuccess(true);
        toast.success("Thanh toán hoàn thành");
      } else if (!isAutoCancel) {
        toast.info("Đơn hàng đã hủy");
      }

      resetWaitingFlow();
    } catch (error) {
      toast.error(error.response?.data || "Không thể cập nhật trạng thái đơn");
    } finally {
      setFinalizingStatus(false);
    }
  };

  const handleCreateVNPAYPayment = async (orderId) => {
    try {
      const res = await paymentService.createPayment(orderId);
      if (res.data && res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        toast.error("Không lấy được URL thanh toán từ hệ thống.");
      }
    } catch (error) {
      console.error("Lỗi khi tạo URL thanh toán VNPAY:", error);
      toast.error(
        "Có lỗi xảy ra khi tạo mã thanh toán VNPAY. Vui lòng thử lại!",
      );
      setIsProcessing(false);
    }
  };

  // Hàm xử lý khi ấn Xác nhận thanh toán
  const handleConfirmCheckout = async () => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để thanh toán!");
      navigate("/login");
      return;
    }

    setIsProcessing(true);

    // Chuẩn bị dữ liệu gửi lên backend khớp với OrderRequest.java
    const orderData = {
      customerName: user.fullName || user.username || "Khách hàng",
      customerPhone: user.phone || "Đang cập nhật",
      paymentMethod: "CHUYEN_KHOAN", // Phương thức chuyển khoản
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

      // Thành công tạo đơn, gọi VNPAY URL
      const orderCreated = res.data;
      await handleCreateVNPAYPayment(orderCreated.id);

      // setWaitingOrder(res.data);
      // setWaitingSeconds(300);
      // setFinalResult(null);
      // setShowCheckoutModal(false);
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      toast.error("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
      setIsProcessing(false);
    }
  };

  // Giao diện khi chưa đăng nhập
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-emerald-100 flex flex-col items-center justify-center p-4 font-poppins">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-500">
          <User size={48} />
        </div>
        <h2 className="text-2xl font-medium text-slate-800 mb-2">
          Yêu cầu đăng nhập
        </h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          Bạn cần đăng nhập tài khoản hệ thống để truy cập giỏ hàng và thanh
          toán.
        </p>
        <Link
          to="/login"
          className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          Quay về trang đăng nhập
        </Link>
      </div>
    );
  }

  // Giao diện khi giỏ hàng trống
  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-emerald-100 flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-2xl font-medium text-slate-800 mb-2">
          Giỏ hàng trống
        </h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          Chưa có sản phẩm nào trong giỏ hàng của bạn. Hãy dạo một vòng cửa hàng
          để chọn nhé!
        </p>
        <Link
          to="/products"
          className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-lg shadow-green-200"
        >
          Tiếp tục mua sắm
        </Link>
        <Link
          to="/order-history"
          className="mt-3 px-8 py-3 bg-white text-green-700 border border-green-200 rounded-xl font-medium hover:bg-green-50 transition-all"
        >
          Xem lịch sử đơn hàng
        </Link>
      </div>
    );
  }

  // Giao diện thông báo Đặt hàng thành công
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-emerald-100 flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-2xl font-medium text-slate-800 mb-2">
          Đặt hàng thành công!
        </h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          Cảm ơn bạn đã mua sắm. Đơn hàng của bạn đang được xử lý và sẽ sớm giao
          đến bạn.
        </p>
        <Link
          to="/products"
          className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-lg shadow-green-200"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-emerald-100 pt-6 pb-12 px-4 sm:px-6 font-poppins relative">
      <div className="max-w-6xl mx-auto">
        {/* Header Giỏ hàng + Stepper */}
        <div className="flex items-center mb-8 gap-4">
          <h1 className="text-2xl font-medium text-slate-900">
            Giỏ hàng của bạn
          </h1>
          <span className="bg-green-100 text-green-700 font-medium px-3 py-1 rounded-full text-sm">
            {cartItems.length} sản phẩm
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Danh sách sản phẩm */}
          <div className="lg:col-span-7 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.product.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4 sm:items-center"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-xl flex-shrink-0 overflow-hidden border border-slate-100">
                  <img
                    src={getImageUrl(item.product.thumbnail)}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between min-h-[100px]">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-medium text-slate-800 text-lg line-clamp-2">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 bg-rose-500 text-white hover:bg-rose-600 rounded-full transition-all shrink-0 shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="mb-2">
                    <p className="text-slate-500 text-sm">
                      Đơn vị: {item.product.unit}
                    </p>
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100 w-fit">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-green-600 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium text-slate-700">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-green-600"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900 text-lg">
                        {formatCurrency(
                          getProductPrice(item.product) * item.quantity,
                        )}
                      </p>
                      {item.product.sellPrice >
                        getProductPrice(item.product) && (
                        <p className="text-xs text-slate-400 line-through mt-1">
                          {formatCurrency(
                            item.product.sellPrice * item.quantity,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={clearCart}
              className="text-rose-500 font-medium hover:text-rose-700 hover:underline px-2"
            >
              Xóa tất cả
            </button>
          </div>

          {/* Tổng đơn hàng (Cột phải) */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sticky top-24">
              <h3 className="text-xl font-medium text-slate-800 mb-6">
                Tổng đơn hàng
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-500">
                  <span>Tạm tính</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Giảm giá</span>
                  <span className="font-medium text-rose-500">
                    {formatCurrency(cartDiscount)}
                  </span>
                </div>
                <div className="h-px bg-slate-100 my-4"></div>

                {/* Voucher Section */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium text-slate-700 text-sm uppercase placeholder:normal-case"
                      placeholder="Nhập mã ưu đãi"
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      disabled={!!appliedVoucher || isApplyingVoucher}
                    />
                    {appliedVoucher ? (
                      <button
                        onClick={handleRemoveVoucher}
                        className="px-4 bg-rose-50 text-rose-600 rounded-xl font-medium hover:bg-rose-100 transition-all text-sm shrink-0"
                      >
                        Hủy
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyVoucher}
                        disabled={isApplyingVoucher || !voucherCode.trim()}
                        className="px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all text-sm shrink-0 disabled:opacity-50"
                      >
                        {isApplyingVoucher ? "..." : "Áp dụng"}
                      </button>
                    )}
                  </div>
                  {voucherError && (
                    <p className="text-rose-500 text-xs font-medium mt-2">
                      {voucherError}
                    </p>
                  )}
                  {appliedVoucher && (
                    <p className="text-green-600 text-xs font-medium mt-2">
                      Đã áp dụng mã: {appliedVoucher.code}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <span className="font-medium text-slate-800">Tổng cộng</span>
                  <span className="text-2xl font-medium text-green-600">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Nút Kích hoạt Modal Thanh toán -> Đổi thành chuyển hướng */}
              <button
                onClick={() => {
                  if (!user) {
                    toast.warning("Vui lòng đăng nhập để thanh toán!");
                    navigate("/login");
                    return;
                  }
                  navigate("/checkout", {
                    state: {
                      appliedVoucher,
                      cartDiscount,
                    },
                  });
                }}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95 flex items-center justify-center gap-2"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full screen QR Modal */}
      {selectedQR && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedQR(null)}
        >
          <div className="relative animate-in zoom-in-95 duration-200 flex flex-col items-center">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute -top-12 -right-4 text-white hover:text-red-400 p-2 transition-colors z-[120] bg-black/40 rounded-full"
            >
              <X size={28} />
            </button>
            <div
              className="bg-white p-6 rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedQR}
                alt="QR Code Full"
                className="w-80 md:w-96 md:h-96 h-80 object-contain rounded-xl"
              />
              <p className="text-center font-medium text-slate-600 mt-4">
                Quét mã để chuyển khoản
              </p>
            </div>
          </div>
        </div>
      )}

      {waitingOrder && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 text-center">
            <p className="text-sm text-slate-500 mb-2">
              Mã đơn: {waitingOrder.code}
            </p>
            <h3 className="text-2xl font-semibold text-slate-900 mb-1">
              Chờ thanh toán
            </h3>
            <p className="text-sm text-slate-500">
              Vui lòng hoàn tất chuyển khoản trong vòng 5 phút
            </p>

            {!finalResult ? (
              <>
                <div className="w-24 h-24 mx-auto my-5 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <p className="text-slate-600 mb-1">Thời gian còn lại</p>
                <p className="text-3xl font-bold text-indigo-600 mb-5">
                  {formatCountdown(waitingSeconds)}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleFinalizeOrder("COMPLETED")}
                    disabled={finalizingStatus}
                    className="py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60"
                  >
                    {finalizingStatus ? "Đang xử lý..." : "Hoàn thành"}
                  </button>
                  <button
                    onClick={() => handleFinalizeOrder("CANCELLED")}
                    disabled={finalizingStatus}
                    className="py-2.5 rounded-xl bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 disabled:opacity-60"
                  >
                    Hủy
                  </button>
                </div>
              </>
            ) : finalResult === "COMPLETED" ? (
              <div className="py-8 flex flex-col items-center gap-3 text-green-600">
                <CheckCircle size={56} />
                <p className="text-lg font-medium">Thanh toán hoàn thành</p>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center gap-3 text-rose-600">
                <XCircle size={56} />
                <p className="text-lg font-medium">Đơn hàng đã hủy</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
