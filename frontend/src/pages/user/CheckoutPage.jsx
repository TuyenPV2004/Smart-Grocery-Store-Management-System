import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiCreditCard, FiLoader, FiShield, FiUser } from "react-icons/fi";
import { Button, PageContainer, PageShell, SurfaceCard } from "../../components/ui";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import orderService from "../../services/orderService";
import paymentService from "../../services/paymentService";

const CheckoutPage = () => {
  const { cartItems, getProductPrice, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const appliedVoucher = location.state?.appliedVoucher || null;
  const cartDiscount = location.state?.cartDiscount || 0;
  const finalTotal = cartTotal - cartDiscount;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));

  const handleConfirmCheckout = async () => {
    if (!user) {
      toast.warning("Please sign in before checkout.");
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      toast.warning("Your cart is empty.");
      navigate("/cart");
      return;
    }

    setIsProcessing(true);

    const orderData = {
      customerName: user.fullName || user.username || "Customer",
      customerPhone: user.phone || "Updating",
      paymentMethod: "CHUYEN_KHOAN",
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
      localStorage.setItem("pendingVnpayOrderCode", orderCreated.code);

      const paymentRes = await paymentService.createPayment(orderCreated.id);
      if (paymentRes.data?.paymentUrl) {
        window.location.href = paymentRes.data.paymentUrl;
        return;
      }

      localStorage.removeItem("pendingVnpayOrderCode");
      toast.error("Could not get the VNPAY payment URL.");
      setIsProcessing(false);
    } catch (error) {
      localStorage.removeItem("pendingVnpayOrderCode");
      console.error("Checkout error:", error);
      toast.error(error.response?.data || "Could not create the order. Please try again.");
      setIsProcessing(false);
    }
  };

  if (!user || cartItems.length === 0) {
    return (
      <PageShell className="flex items-center justify-center p-4">
        <div className="text-center">
          <FiLoader className="mx-auto mb-4 h-10 w-10 animate-spin text-emerald-700" />
          <p className="font-medium text-slate-500">Redirecting...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="py-8">
      <PageContainer className="max-w-6xl">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link to="/" className="text-black hover:text-slate-900">Home</Link>
          <span className="font-semibold text-black">&gt;</span>
          <Link to="/cart" className="text-black hover:text-slate-900">Cart</Link>
          <span className="font-semibold text-black">&gt;</span>
          <span className="text-emerald-700">Checkout</span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <SurfaceCard>
              <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <FiUser size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-medium text-slate-900">Buyer information</h2>
                  <p className="text-sm text-slate-500">Pulled from your account profile.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoBlock label="Full Name" value={user?.fullName || user?.username || "Customer"} />
                <InfoBlock label="Phone Number" value={user?.phone || "Please update your profile"} />
              </div>
            </SurfaceCard>

            <SurfaceCard className="border-emerald-100 bg-emerald-50/60">
              <div className="mb-3 flex items-center gap-2 font-medium text-emerald-800">
                <FiShield size={20} />
                Payment instructions
              </div>
              <p className="text-sm leading-7 text-slate-600">
                When you click <strong className="font-semibold text-slate-900">Pay with VNPAY</strong>,
                the system creates a pending order and redirects you to the VNPAY payment gateway.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                After VNPAY confirms the payment, your cart is synchronized with the final order status.
              </p>
            </SurfaceCard>
          </div>

          <SurfaceCard className="h-fit lg:col-span-5 lg:sticky lg:top-28">
            <h2 className="mb-4 text-lg font-medium text-slate-900">Order summary</h2>

            <div className="mb-6 max-h-[280px] space-y-3 overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex items-start justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-medium leading-snug text-slate-800">
                      {item.product.name}
                    </p>
                    <p className="mt-1 text-slate-500">Quantity: {item.quantity}</p>
                  </div>
                  <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">
                    {formatCurrency(getProductPrice(item.product) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-6 space-y-3 border-t border-slate-100 pt-4">
              <SummaryRow label="Total items" value={cartItems.reduce((acc, item) => acc + item.quantity, 0)} />
              <SummaryRow label="Total" value={formatCurrency(cartTotal)} />
              {cartDiscount > 0 ? (
                <SummaryRow
                  label={`Discount ${appliedVoucher ? `(${appliedVoucher.code})` : ""}`}
                  value={`-${formatCurrency(cartDiscount)}`}
                  tone="discount"
                />
              ) : null}
            </div>

            <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <span className="text-sm font-medium text-emerald-800">Final total</span>
              <span className="text-2xl font-medium tabular-nums text-emerald-700">
                {formatCurrency(finalTotal)}
              </span>
            </div>

            <Button
              type="button"
              onClick={handleConfirmCheckout}
              disabled={isProcessing}
              className="w-full py-4"
            >
              {isProcessing ? <FiLoader className="h-5 w-5 animate-spin" /> : <FiCreditCard className="h-5 w-5" />}
              {isProcessing ? "Initializing payment" : "Pay with VNPAY"}
            </Button>
          </SurfaceCard>
        </div>
      </PageContainer>
    </PageShell>
  );
};

const InfoBlock = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-1 font-medium text-slate-900">{value}</p>
  </div>
);

const SummaryRow = ({ label, value, tone }) => (
  <div className={`flex justify-between text-sm ${tone === "discount" ? "text-emerald-700" : "text-slate-500"}`}>
    <span>{label}</span>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
);

export default CheckoutPage;
