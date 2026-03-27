import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/orderService";
import voucherService from "../../services/voucherService";

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartTotal,
    clearCart,
    getProductPrice,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [selectedVoucherOption, setSelectedVoucherOption] = useState(null);
  const [voucherConditionTarget, setVoucherConditionTarget] = useState(null);

  useEffect(() => {
    const reconcilePendingPayment = async () => {
      if (!user) return;

      const pendingOrderCode = localStorage.getItem("pendingVnpayOrderCode");
      if (!pendingOrderCode) return;

      try {
        const res = await orderService.getByCode(pendingOrderCode);
        const order = res.data;

        if (order?.paymentStatus === "PAID" || order?.status === "COMPLETED") {
          clearCart();
          localStorage.removeItem("pendingVnpayOrderCode");
        } else if (
          ["FAILED", "CANCELLED", "EXPIRED"].includes(order?.paymentStatus) ||
          order?.status === "CANCELLED"
        ) {
          localStorage.removeItem("pendingVnpayOrderCode");
        }
      } catch (error) {
        localStorage.removeItem("pendingVnpayOrderCode");
      }
    };

    reconcilePendingPayment();
  }, [clearCart, user]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/100x100?text=No+Image";
    if (path.startsWith("http")) return path;
    return `http://localhost:8080/${path}`;
  };

  const formatVoucherDiscount = (voucher) => {
    if (!voucher) return "";
    return voucher.discountType === "PERCENTAGE"
      ? `Giảm ${voucher.discountValue}%`
      : `Giảm ${formatCurrency(voucher.discountValue || 0)}`;
  };

  const formatVoucherExpiry = (date) => {
    if (!date) return "Không xác định";
    return new Date(date).toLocaleString("vi-VN");
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

  const applyVoucherByCode = async (code) => {
    if (!code?.trim()) return false;

    setIsApplyingVoucher(true);
    setVoucherError("");
    setAppliedVoucher(null);

    try {
      const res = await voucherService.validate(code.trim());
      const voucher = res.data;

      if (voucher.minOrderValue && cartTotal < voucher.minOrderValue) {
        setVoucherError(
          `Đơn hàng cần đạt tối thiểu ${formatCurrency(voucher.minOrderValue)}`,
        );
        return false;
      }

      setVoucherCode(voucher.code);
      setAppliedVoucher(voucher);
      toast.success("Áp dụng mã giảm giá thành công!");
      return true;
    } catch (error) {
      setVoucherError(
        error.response?.data || "Mã giảm giá không hợp lệ hoặc đã hết hạn",
      );
      return false;
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleApplyVoucher = async () => {
    await applyVoucherByCode(voucherCode);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherError("");
  };

  const handleOpenVoucherModal = async () => {
    setShowVoucherModal(true);
    setSelectedVoucherOption(appliedVoucher?.code || null);
    setVoucherError("");
    setIsLoadingVouchers(true);

    try {
      const res = await voucherService.getActive();
      setAvailableVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error("Không thể tải danh sách voucher");
      setAvailableVouchers([]);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const handleToggleVoucherOption = (voucherCodeValue) => {
    setSelectedVoucherOption((prev) =>
      prev === voucherCodeValue ? null : voucherCodeValue,
    );
  };

  const handleConfirmVoucherSelection = async () => {
    if (!selectedVoucherOption) {
      handleRemoveVoucher();
      setShowVoucherModal(false);
      return;
    }

    const success = await applyVoucherByCode(selectedVoucherOption);
    if (success) {
      setShowVoucherModal(false);
    }
  };

  const cartDiscount = calculateDiscount();
  const finalTotal = cartTotal - cartDiscount;

  if (!user) {
    return (
      <div className="app-page-bg min-h-screen flex flex-col items-center justify-center p-4 font-poppins">
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

  if (cartItems.length === 0) {
    return (
      <div className="app-page-bg min-h-screen flex flex-col items-center justify-center p-4">
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

  return (
    <div className="app-page-bg min-h-screen pt-6 pb-12 px-4 sm:px-6 font-poppins relative">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8 gap-4">
          <h1 className="text-2xl font-medium text-slate-900">
            Giỏ hàng của bạn
          </h1>
          <span className="bg-green-100 text-green-700 font-medium px-3 py-1 rounded-full text-sm">
            {cartItems.length} sản phẩm
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                      {item.product.sellPrice > getProductPrice(item.product) && (
                        <p className="text-xs text-slate-400 line-through mt-1">
                          {formatCurrency(item.product.sellPrice * item.quantity)}
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
                <div className="h-px bg-slate-100 my-4" />

                <div className="mb-4">
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleOpenVoucherModal}
                      className="w-[88px] text-center text-xs font-medium text-indigo-600 transition-all hover:text-indigo-800 hover:underline"
                    >
                      Voucher
                    </button>
                  </div>

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
                className="w-full rounded-xl bg-green-600 py-3 text-white font-medium hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95 flex items-center justify-center gap-2"
              >
                Tiến hành checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {showVoucherModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setShowVoucherModal(false)}
          />
          <div className="relative z-[141] w-full max-w-lg rounded-[22px] border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  Chọn voucher giảm giá
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Chọn voucher phù hợp cho đơn hàng hiện tại
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto px-4 py-3">
              {isLoadingVouchers ? (
                <div className="flex min-h-[240px] items-center justify-center gap-2 text-slate-500">
                  <Loader2 size={18} className="animate-spin" />
                  Đang tải voucher...
                </div>
              ) : availableVouchers.length === 0 ? (
                <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
                  Hiện chưa có voucher khả dụng
                </div>
              ) : (
                <div className="space-y-2.5">
                  {availableVouchers.map((voucher) => {
                    const isSelected = selectedVoucherOption === voucher.code;
                    return (
                      <div
                        key={voucher.id}
                        className="rounded-2xl border border-slate-200 bg-white p-3 transition-all"
                      >
                        <div className="flex min-h-[92px] items-stretch gap-2.5">
                          <div className="flex min-w-[96px] flex-1 items-center justify-center px-2 py-2 text-center">
                            <p className="text-sm font-semibold text-slate-900 break-all">
                              {voucher.code}
                            </p>
                          </div>

                          <div className="flex-[1.45] rounded-xl bg-white px-1 py-0.5">
                            <div className="mb-1.5 flex items-start justify-between gap-2">
                              <div className="space-y-1.5">
                                <p className="text-xs font-medium text-slate-800">
                                  {formatVoucherDiscount(voucher)}
                                </p>
                                <p className="text-xs font-medium text-slate-800">
                                  {voucher.discountType === "PERCENTAGE" &&
                                  voucher.maxDiscountAmount
                                    ? formatCurrency(
                                        voucher.maxDiscountAmount || 0,
                                      )
                                    : "Không giới hạn"}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleVoucherOption(voucher.code)
                                }
                                className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white transition-all"
                                aria-label={
                                  isSelected
                                    ? "Bỏ chọn voucher"
                                    : "Chọn voucher"
                                }
                              >
                                <span
                                  className={`h-3 w-3 rounded-full ${
                                    isSelected
                                      ? "bg-indigo-600"
                                      : "bg-transparent"
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="space-y-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setVoucherConditionTarget(voucher)
                                }
                                className="text-[11px] font-medium text-indigo-600 transition-all hover:text-indigo-800 hover:underline"
                              >
                                Xem điều kiện
                              </button>
                              <p className="text-xs font-medium text-slate-800">
                                {formatVoucherExpiry(voucher.endDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-4 py-3.5">
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmVoucherSelection}
                disabled={isApplyingVoucher}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:opacity-60"
              >
                {isApplyingVoucher ? "Đang áp dụng..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {voucherConditionTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setVoucherConditionTarget(null)}
          />
          <div className="relative z-[151] w-full max-w-lg rounded-[28px] border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Điều kiện voucher
                </p>
                <h3 className="mt-1 text-xl font-medium text-slate-900">
                  {voucherConditionTarget.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVoucherConditionTarget(null)}
                className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">Mức giảm</span>
                <span className="text-right font-medium text-slate-900">
                  {formatVoucherDiscount(voucherConditionTarget)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">Đơn tối thiểu</span>
                <span className="text-right font-medium text-slate-900">
                  {formatCurrency(voucherConditionTarget.minOrderValue || 0)}
                </span>
              </div>
              {voucherConditionTarget.discountType === "PERCENTAGE" &&
                voucherConditionTarget.maxDiscountAmount && (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Giảm tối đa</span>
                    <span className="text-right font-medium text-slate-900">
                      {formatCurrency(
                        voucherConditionTarget.maxDiscountAmount || 0,
                      )}
                    </span>
                  </div>
                )}
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">Hạn sử dụng</span>
                <span className="text-right font-medium text-slate-900">
                  {formatVoucherExpiry(voucherConditionTarget.endDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
