import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiCheckCircle, FiLoader, FiXCircle } from "react-icons/fi";
import { Button, PageContainer, PageShell, SurfaceCard } from "../../components/ui";
import { useCart } from "../../context/useCart";
import paymentService from "../../services/paymentService";

const VNPayReturnPage = () => {
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing payment result...");
  const [orderDetails, setOrderDetails] = useState(null);
  const location = useLocation();
  const { clearCart } = useCart();

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "Not available";
    const date = new Date(dateValue);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}/${date.getFullYear()}, ${date.toLocaleTimeString("en-US")}`;
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        const queryParams = location.search;
        if (!queryParams) {
          setStatus("failed");
          setMessage("Payment information was not found.");
          return;
        }

        const response = await paymentService.vnpayReturn(queryParams);
        const result = response.data || {};

        setMessage(result.message || "Unable to determine payment status.");
        setOrderDetails({
          code: result.orderCode,
          amount: result.finalAmount,
          orderStatus: result.orderStatus,
          paymentStatus: result.paymentStatus,
          paidAt: result.paymentConfirmedAt,
          expiresAt: result.paymentExpiresAt,
          transactionNo: result.paymentTransactionNo,
        });

        localStorage.removeItem("pendingVnpayOrderCode");
        if (result.status === "success") {
          clearCart();
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (error) {
        console.error("Error processing VNPAY callback:", error);
        const backendMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "A system error occurred while verifying the payment.";
        localStorage.removeItem("pendingVnpayOrderCode");
        setStatus("failed");
        setMessage(backendMessage);
      }
    };

    processPaymentReturn();
  }, [clearCart, location.search]);

  const isSuccess = status === "success";
  const isFailed = status === "failed";

  return (
    <PageShell className="flex min-h-screen items-center py-10">
      <PageContainer className="max-w-xl">
        <SurfaceCard className="p-8 text-center">
          {status === "processing" ? (
            <StateBlock
              icon={<FiLoader className="h-14 w-14 animate-spin text-emerald-700" />}
              title="Processing payment"
              message={message}
            />
          ) : null}

          {isSuccess ? (
            <StateBlock
              icon={<FiCheckCircle className="h-20 w-20 text-emerald-700" />}
              title="Payment successful"
              message={message}
            />
          ) : null}

          {isFailed ? (
            <StateBlock
              icon={<FiXCircle className="h-20 w-20 text-rose-600" />}
              title="Payment failed"
              message={message}
            />
          ) : null}

          {status !== "processing" && orderDetails ? (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-left">
              <ReceiptRow label="Order code" value={orderDetails.code || "---"} />
              {isSuccess ? (
                <>
                  <ReceiptRow label="Amount" value={formatCurrency(orderDetails.amount)} strong />
                  <ReceiptRow label="Order status" value={orderDetails.orderStatus || "---"} />
                  <ReceiptRow label="Payment status" value={orderDetails.paymentStatus || "---"} />
                  <ReceiptRow label="Transaction no." value={orderDetails.transactionNo || "---"} />
                  <ReceiptRow label="Confirmed at" value={formatDateTime(orderDetails.paidAt)} />
                </>
              ) : (
                <>
                  <ReceiptRow label="Order status" value={orderDetails.orderStatus || "---"} />
                  {orderDetails.expiresAt ? (
                    <ReceiptRow label="Expires at" value={formatDateTime(orderDetails.expiresAt)} />
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {isSuccess ? (
            <div className="mt-6 grid gap-3">
              <Button as={Link} to="/order-history">View order history</Button>
              <Button as={Link} to="/products" variant="secondary">Continue shopping</Button>
            </div>
          ) : null}

          {isFailed ? (
            <div className="mt-6 grid gap-3">
              <Button as={Link} to="/cart" variant="danger">Back to cart</Button>
              <Button as={Link} to="/order-history" variant="secondary">View my orders</Button>
            </div>
          ) : null}
        </SurfaceCard>
      </PageContainer>
    </PageShell>
  );
};

const StateBlock = ({ icon, title, message }) => (
  <div className="flex flex-col items-center py-4">
    <div className="mb-5 flex items-center justify-center">{icon}</div>
    <h1 className="text-2xl font-medium text-slate-900">{title}</h1>
    <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
  </div>
);

const ReceiptRow = ({ label, value, strong = false }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 py-2 last:border-b-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className={`text-right text-sm ${strong ? "font-semibold text-emerald-700" : "font-medium text-slate-900"}`}>
      {value}
    </span>
  </div>
);

export default VNPayReturnPage;
