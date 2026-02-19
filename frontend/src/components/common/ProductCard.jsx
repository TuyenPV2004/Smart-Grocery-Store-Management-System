import React from "react";
import { ShoppingCart, Heart, Eye } from "lucide-react";

const ProductCard = ({ product }) => {
  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/300x300?text=No+Image";
    if (path.startsWith("http")) return path;
    return `http://localhost:8080/${path}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const isOutOfStock = product.status === "OUT_OF_STOCK";

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full relative">
      {/* Badge */}
      {product.status !== "ACTIVE" && (
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isOutOfStock
                ? "bg-stone-100 text-stone-600"
                : "bg-rose-100 text-rose-600"
            }`}
          >
            {isOutOfStock ? "Hết hàng" : "Ngừng kinh doanh"}
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50 group-hover:bg-slate-100 transition-colors">
        <img
          src={getImageUrl(product.thumbnail)}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            isOutOfStock ? "opacity-50 grayscale" : ""
          }`}
        />

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/5 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            className="p-3 bg-white text-slate-700 rounded-full shadow-lg hover:bg-green-600 hover:text-white transition-all transform hover:scale-110"
            title="Xem nhanh"
          >
            <Eye size={18} />
          </button>
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
        <div className="mb-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            {product.brand || "Thương hiệu khác"}
          </p>
        </div>
        <h3
          className="text-[15px] font-medium text-slate-800 line-clamp-2 mb-2 group-hover:text-green-600 transition-colors min-h-[44px]"
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="mt-auto pt-3 flex items-end justify-between border-t border-slate-50">
          <div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(product.sellPrice)}
            </p>
            {product.importPrice > 0 && (
              <p className="text-xs text-slate-400 line-through">
                {formatCurrency(product.sellPrice * 1.2)}
              </p>
            )}
          </div>

          <button
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
