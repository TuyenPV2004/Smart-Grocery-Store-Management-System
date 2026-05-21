import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiCheck,
  FiInfo,
  FiLoader,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import {
  Button,
  EmptyState,
  ModalShell,
  PageContainer,
  PageHeader,
  PageShell,
  SurfaceCard,
} from "../../components/ui";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import orderService from "../../services/orderService";
import voucherService from "../../services/voucherService";
import { fetchStockLookup, getAvailableStock } from "../../services/stockAvailabilityService";
import { getImageUrl } from "../../utils/imageUrl";

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
  const [selectedCartItems, setSelectedCartItems] = useState([]);
  const [stockLookup, setStockLookup] = useState(null);

  const selectedCartCount = selectedCartItems.length;
  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedCartItems.includes(item.product.id)),
    [cartItems, selectedCartItems],
  );
  const selectedCartTotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + getProductPrice(item.product) * item.quantity, 0),
    [getProductPrice, selectedItems],
  );

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
      } catch {
        localStorage.removeItem("pendingVnpayOrderCode");
      }
    };

    reconcilePendingPayment();
  }, [clearCart, user]);

  useEffect(() => {
    if (cartItems.length > 0 && selectedCartItems.length === 0) {
      setSelectedCartItems(cartItems.map((item) => item.product.id));
    }
  }, [cartItems]);

  useEffect(() => {
    const loadStockAvailability = async () => {
      try {
        setStockLookup(await fetchStockLookup());
      } catch (error) {
        console.error("Failed to load stock availability:", error);
      }
    };

    if (cartItems.length > 0) loadStockAvailability();
  }, [cartItems.length]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));

  const formatVoucherDiscount = (voucher) => {
    if (!voucher) return "";
    return voucher.discountType === "PERCENTAGE"
      ? `${voucher.discountValue}% off`
      : `${formatCurrency(voucher.discountValue || 0)} off`;
  };

  const formatVoucherExpiry = (date) => {
    if (!date) return "No expiry date";
    return new Date(date).toLocaleString("en-US");
  };

  const calculateDiscount = () => {
    if (!appliedVoucher) return 0;

    let discount = 0;
    if (appliedVoucher.discountType === "PERCENTAGE") {
      discount = (selectedCartTotal * appliedVoucher.discountValue) / 100;
      if (
        appliedVoucher.maxDiscountAmount &&
        discount > appliedVoucher.maxDiscountAmount
      ) {
        discount = appliedVoucher.maxDiscountAmount;
      }
    } else {
      discount = appliedVoucher.discountValue;
    }

    return discount > selectedCartTotal ? selectedCartTotal : discount;
  };

  const applyVoucherByCode = async (code) => {
    if (!code?.trim()) return false;

    setIsApplyingVoucher(true);
    setVoucherError("");
    setAppliedVoucher(null);

    try {
      const res = await voucherService.validate(code.trim());
      const voucher = res.data;

      if (selectedCartCount === 0) {
        setVoucherError("Please select at least one product before applying a voucher.");
        return false;
      }

      if (voucher.minOrderValue && selectedCartTotal < voucher.minOrderValue) {
        setVoucherError(`Order minimum is ${formatCurrency(voucher.minOrderValue)}.`);
        return false;
      }

      setVoucherCode(voucher.code);
      setAppliedVoucher(voucher);
      toast.success("Voucher applied successfully.");
      return true;
    } catch (error) {
      setVoucherError(error.response?.data || "Voucher is invalid or expired.");
      return false;
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherError("");
  };

  const toggleCartItemSelection = (productId) => {
    setSelectedCartItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const selectAllCartItems = () => {
    setSelectedCartItems((prev) =>
      prev.length === cartItems.length ? [] : cartItems.map((item) => item.product.id),
    );
  };

  const clearSelectedCartItems = () => {
    selectedCartItems.forEach((productId) => removeFromCart(productId));
    setSelectedCartItems([]);
  };

  const handleOpenVoucherModal = async () => {
    setShowVoucherModal(true);
    setSelectedVoucherOption(appliedVoucher?.code || null);
    setVoucherError("");
    setIsLoadingVouchers(true);

    try {
      const res = await voucherService.getActive();
      setAvailableVouchers(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Could not load vouchers.");
      setAvailableVouchers([]);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const handleConfirmVoucherSelection = async () => {
    if (!selectedVoucherOption) {
      handleRemoveVoucher();
      setShowVoucherModal(false);
      return;
    }

    setVoucherCode(selectedVoucherOption);
    setShowVoucherModal(false);
    await applyVoucherByCode(selectedVoucherOption);
  };

  const cartDiscount = calculateDiscount();
  const finalTotal = selectedCartTotal - cartDiscount;

  if (!user) {
    return (
      <PageShell className="flex items-center justify-center p-4">
        <PageContainer className="max-w-xl">
          <EmptyState
            icon={FiUser}
            title="Sign in required"
            description="Please sign in to access your cart and checkout."
            action={<Button as={Link} to="/login">Go to sign in</Button>}
          />
        </PageContainer>
      </PageShell>
    );
  }

  if (cartItems.length === 0) {
    return (
      <PageShell className="flex items-center justify-center p-4">
        <PageContainer className="max-w-xl">
          <EmptyState
            icon={FiShoppingBag}
            title="Your cart is empty"
            description="Browse the store and add fresh groceries to your cart."
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button as={Link} to="/products">Continue shopping</Button>
                <Button as={Link} to="/order-history" variant="secondary">View order history</Button>
              </div>
            }
          />
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell className="py-8">
      <PageContainer className="max-w-6xl">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link to="/" className="flex items-center gap-1.5 text-black hover:text-slate-900">
            <FaHome className="text-emerald-700" size={16} />
            Home
          </Link>
          <span className="font-semibold text-black">&gt;</span>
          <span className="text-emerald-700">Cart</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={selectAllCartItems}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
              >
                {selectedCartCount === cartItems.length ? "Clear all selected" : "Select all"}
              </button>
              <button
                type="button"
                onClick={clearSelectedCartItems}
                disabled={selectedCartCount === 0}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear selected ({selectedCartCount})
              </button>
            </div>

            {cartItems.map((item) => {
              const isSelected = selectedCartItems.includes(item.product.id);
              const availableStock = getAvailableStock(item.product, stockLookup);
              const isUnavailable = availableStock <= 0;
              return (
              <SurfaceCard key={item.product.id} className={`flex gap-4 p-4 sm:items-center ${isSelected ? "ring-2 ring-emerald-500" : ""}`}>
                <button
                  type="button"
                  onClick={() => toggleCartItemSelection(item.product.id)}
                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white"
                  }`}
                  aria-label="Select cart item"
                >
                  {isSelected ? <FiCheck size={14} /> : null}
                </button>

                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-[#eef5ea]">
                  <img
                    src={getImageUrl(item.product.thumbnail, "https://via.placeholder.com/100x100?text=No+Image")}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-h-[100px] flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="line-clamp-2 text-lg font-medium text-slate-900">
                        {item.product.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Unit: {item.product.unit || "item"}
                      </p>
                      <p className={`mt-1 text-sm font-medium ${isUnavailable ? "text-rose-600" : "text-slate-500"}`}>
                        Available: {availableStock}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center text-rose-600 transition-colors hover:text-rose-700"
                      aria-label="Remove item"
                    >
                      <MdDelete size={19} />
                    </button>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="flex h-9 w-9 items-center justify-center text-slate-600 transition-colors hover:text-emerald-700 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="flex h-9 w-9 items-center justify-center text-slate-600 transition-colors hover:text-emerald-700"
                        disabled={item.quantity >= availableStock}
                        aria-label="Increase quantity"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-medium tabular-nums text-slate-900">
                        {formatCurrency(getProductPrice(item.product) * item.quantity)}
                      </p>
                      {item.product.sellPrice > getProductPrice(item.product) ? (
                        <p className="mt-1 text-xs tabular-nums text-slate-400 line-through">
                          {formatCurrency(item.product.sellPrice * item.quantity)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </SurfaceCard>
              );
            })}

          </div>

          <div className="lg:col-span-5">
            <SurfaceCard className="lg:sticky lg:top-28">
              <h2 className="mb-6 text-xl font-medium text-slate-900">Order summary</h2>

              <div className="mb-6 space-y-4">
                <SummaryRow label="Total" value={formatCurrency(cartTotal)} />
                <SummaryRow label="Selected total" value={formatCurrency(selectedCartTotal)} />
                <SummaryRow label="Discount" value={formatCurrency(cartDiscount)} tone="discount" />
              </div>

              <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-emerald-800">Voucher</span>
                  <button
                    type="button"
                    onClick={handleOpenVoucherModal}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    Browse
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="ui-input w-full uppercase placeholder:normal-case"
                    placeholder="Enter voucher code"
                    value={voucherCode}
                    onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                    disabled={!!appliedVoucher || isApplyingVoucher}
                  />
                  {appliedVoucher ? (
                    <Button type="button" variant="danger" onClick={handleRemoveVoucher}>
                      Remove
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => applyVoucherByCode(voucherCode)}
                      disabled={isApplyingVoucher || !voucherCode.trim()}
                    >
                      {isApplyingVoucher ? "..." : "Apply"}
                    </Button>
                  )}
                </div>
                {voucherError ? (
                  <p className="mt-2 text-xs font-medium text-rose-600">{voucherError}</p>
                ) : null}
                {appliedVoucher ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Applied voucher: {appliedVoucher.code}
                  </p>
                ) : null}
              </div>

              <div className="mb-6 flex items-end justify-between rounded-2xl bg-slate-950 p-4 text-white">
                <span className="font-medium">Final total</span>
                <span className="text-2xl font-medium tabular-nums">
                  {formatCurrency(finalTotal)}
                </span>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  if (selectedItems.length === 0) {
                    toast.warning("Please select at least one product to checkout.");
                    return;
                  }
                  const invalidItem = selectedItems.find(
                    (item) => item.quantity > getAvailableStock(item.product, stockLookup),
                  );
                  if (invalidItem) {
                    toast.warning(`${invalidItem.product.name} does not have enough stock.`);
                    return;
                  }
                  navigate("/checkout", {
                    state: {
                      appliedVoucher,
                      cartDiscount,
                      checkoutItems: selectedItems,
                    },
                  });
                }}
              >
                Continue to checkout
              </Button>
            </SurfaceCard>
          </div>
        </div>
      </PageContainer>

      {showVoucherModal ? (
        <ModalShell
          title="Choose a voucher"
          onClose={() => setShowVoucherModal(false)}
          footer={
            <Button type="button" onClick={handleConfirmVoucherSelection} disabled={isApplyingVoucher}>
              {isApplyingVoucher ? "Applying..." : "Confirm"}
            </Button>
          }
        >
          {isLoadingVouchers ? (
            <div className="flex min-h-[220px] items-center justify-center gap-2 text-slate-500">
              <FiLoader className="animate-spin" size={18} />
              Loading vouchers...
            </div>
          ) : availableVouchers.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">
              No vouchers available.
            </div>
          ) : (
            <div className="space-y-3">
              {availableVouchers.map((voucher) => {
                const isSelected = selectedVoucherOption === voucher.code;
                return (
                  <button
                    key={voucher.id}
                    type="button"
                    onClick={() =>
                      setSelectedVoucherOption((prev) =>
                        prev === voucher.code ? null : voucher.code,
                      )
                    }
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">{voucher.code}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatVoucherDiscount(voucher)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-4 text-xs">
                          <span className="text-slate-500">
                            Expires: {formatVoucherExpiry(voucher.endDate)}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setVoucherConditionTarget(voucher);
                            }}
                            className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-900 translate-x-8"
                          >
                            <FiInfo size={13} />
                            View conditions
                          </button>
                        </div>
                      </div>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <FiCheck size={14} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ModalShell>
      ) : null}

      {voucherConditionTarget ? (
        <ModalShell
          title={`Voucher conditions: ${voucherConditionTarget.code}`}
          onClose={() => setVoucherConditionTarget(null)}
        >
          <div className="space-y-3 rounded-2xl bg-slate-50 p-5 text-sm">
            <SummaryRow label="Discount" value={formatVoucherDiscount(voucherConditionTarget)} />
            <SummaryRow label="Minimum order" value={formatCurrency(voucherConditionTarget.minOrderValue || 0)} />
            {voucherConditionTarget.discountType === "PERCENTAGE" &&
            voucherConditionTarget.maxDiscountAmount ? (
              <SummaryRow label="Maximum discount" value={formatCurrency(voucherConditionTarget.maxDiscountAmount || 0)} />
            ) : null}
            <SummaryRow label="Expiry date" value={formatVoucherExpiry(voucherConditionTarget.endDate)} />
          </div>
        </ModalShell>
      ) : null}
    </PageShell>
  );
};

const SummaryRow = ({ label, value, tone }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className="text-slate-500">{label}</span>
    <span
      className={`text-right font-medium tabular-nums ${
        tone === "discount" ? "text-rose-600" : "text-slate-900"
      }`}
    >
      {value}
    </span>
  </div>
);

export default CartPage;
