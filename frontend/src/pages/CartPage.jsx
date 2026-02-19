import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } =
    useCart();

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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 font-poppins">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/products"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-medium text-slate-900">
            Giỏ hàng của bạn
          </h1>
          <span className="bg-green-100 text-green-700 font-medium px-3 py-1 rounded-full text-sm">
            {cartItems.length} sản phẩm
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.product.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4 sm:items-center"
              >
                {/* Product Image */}
                <div className="w-24 h-24 bg-slate-50 rounded-xl flex-shrink-0 overflow-hidden border border-slate-100">
                  <img
                    src={getImageUrl(item.product.thumbnail)}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info & Controls */}
                <div className="flex-1 flex flex-col justify-between min-h-[100px]">
                  {/* Row 1: Name and Delete */}
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-medium text-slate-800 text-lg line-clamp-2">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 bg-rose-500 text-white hover:bg-rose-500 hover:text-white rounded-full transition-all shrink-0 shadow-sm"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Row 2: Unit */}
                  <div className="mb-2">
                    <p className="text-slate-500 text-sm">
                      Đơn vị: {item.product.unit}
                    </p>
                  </div>

                  {/* Row 3: Quantity Controls and Total Price */}
                  <div className="flex items-end justify-between mt-auto">
                    {/* Quantity Controls */}
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

                    {/* Total Price */}
                    <p className="font-medium text-slate-900 text-lg">
                      {formatCurrency(item.product.sellPrice * item.quantity)}
                    </p>
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

          {/* Checkout Summary */}
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
                  <span className="font-medium text-slate-900">0 ₫</span>
                </div>
                <div className="h-px bg-slate-100 my-4"></div>
                <div className="flex justify-between items-end">
                  <span className="font-medium text-slate-800">Tổng cộng</span>
                  <span className="text-2xl font-medium text-green-600">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>

              <button className="w-full py-4 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95 flex items-center justify-center gap-2">
                Thanh toán ngay
              </button>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">Đã bao gồm thuế GTGT</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
