import { toast } from "react-toastify";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Eye } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getImageUrl } from "../../utils/imageUrl";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const isOutOfStock = product.status === "OUT_OF_STOCK";

  // Calculate discounted price
  let discountedPrice = product.sellPrice;
  let hasDiscount = false;
  let discountDisplay = "";

  if (product.activePromotion && product.status === "ACTIVE") {
    hasDiscount = true;
    if (product.activePromotion.discountType === "PERCENTAGE") {
      discountedPrice =
        product.sellPrice -
        (product.sellPrice * product.activePromotion.discountValue) / 100;
      discountDisplay = `-${product.activePromotion.discountValue}%`;
    } else {
      discountedPrice =
        product.sellPrice - product.activePromotion.discountValue;
      if (discountedPrice < 0) discountedPrice = 0;
      discountDisplay = `-${formatCurrency(product.activePromotion.discountValue)}`;
    }
  }

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full relative">
      {/* Badge */}
      {product.status !== "ACTIVE" && (
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
              isOutOfStock ? "bg-rose-400 text-white" : "bg-rose-400 text-white"
            }`}
          >
            {isOutOfStock ? "Hết hàng" : "Ngừng kinh doanh"}
          </span>
        </div>
      )}

      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m11.5 15.5 3-3" />
              <path d="m21.5 9-1.5-1.5" />
              <path d="m3 3 1.5 1.5" />
              <path d="m8.5 21.5-1.5-1.5" />
              <path d="m9 10.5 3-3" />
              <path d="M4 11V4h7l10 10-7 7-10-10Z" />
            </svg>
            {discountDisplay}
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50 group-hover:bg-slate-100 transition-colors">
        <img
          src={getImageUrl(product.thumbnail, "https://via.placeholder.com/300x300?text=No+Image")}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            isOutOfStock ? "opacity-50 grayscale" : ""
          }`}
        />

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/5 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            to={`/products/${product.id}`}
            className="p-3 bg-white text-slate-700 rounded-full shadow-lg hover:bg-green-600 hover:text-white transition-all transform hover:scale-110"
            title="Xem chi tiết"
          >
            <Eye size={18} />
          </Link>
          <button
            className="p-3 bg-white text-slate-700 rounded-full shadow-lg hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110"
            title="Yêu thích"
          >
            <Heart size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="text-[15px] font-medium text-slate-800 line-clamp-2 mb-2 group-hover:text-green-600 transition-colors min-h-[44px]"
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="mt-auto pt-3 flex items-end justify-between border-t border-slate-50">
          <div>
            <p className="text-lg font-medium text-green-600">
              {formatCurrency(discountedPrice)}
            </p>
            {hasDiscount && (
              <p className="text-xs text-slate-400 line-through">
                {formatCurrency(product.sellPrice)}
              </p>
            )}
            {!hasDiscount && product.importPrice > 0 && (
              <p className="text-xs text-slate-400 line-through">
                {formatCurrency(product.sellPrice * 1.2)}
              </p>
            )}
          </div>

          <button
            onClick={() => {
              if (!user) {
                toast.warning(
                  "Vui lòng đăng nhập để có thể thêm sản phẩm vào giỏ hàng.",
                );
                navigate("/login");
                return;
              }
              addToCart(product);
            }}
            className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-95 ${
              isOutOfStock
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 shadow-green-100"
            }`}
            disabled={isOutOfStock}
            title={isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
