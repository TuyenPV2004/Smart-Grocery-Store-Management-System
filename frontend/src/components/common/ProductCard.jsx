import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiHeart, FiShoppingCart } from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { getImageUrl } from "../../utils/imageUrl";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);

  const isOutOfStock = product.status === "OUT_OF_STOCK";
  let discountedPrice = product.sellPrice || 0;
  let hasDiscount = false;
  let discountDisplay = "";

  if (product.activePromotion && product.status === "ACTIVE") {
    hasDiscount = true;
    if (product.activePromotion.discountType === "PERCENTAGE") {
      discountedPrice =
        discountedPrice -
        (discountedPrice * product.activePromotion.discountValue) / 100;
      discountDisplay = `-${product.activePromotion.discountValue}%`;
    } else {
      discountedPrice = Math.max(discountedPrice - product.activePromotion.discountValue, 0);
      discountDisplay = `-${formatCurrency(product.activePromotion.discountValue)}`;
    }
  }

  const handleAddToCart = () => {
    if (!user) {
      toast.warning("Please sign in to add products to your cart.");
      navigate("/login");
      return;
    }
    addToCart(product);
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/75 bg-white/92 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)]">
      {product.status !== "ACTIVE" ? (
        <div className="absolute left-3 top-3 z-30">
          <span className="rounded-full bg-rose-500 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
            {isOutOfStock ? "Out of stock" : "Unavailable"}
          </span>
        </div>
      ) : null}

      {hasDiscount ? (
        <div className="absolute right-3 top-3 z-30">
          <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {discountDisplay}
          </span>
        </div>
      ) : null}

      <div className="relative aspect-[1.08/1] overflow-hidden bg-[#eef5ea] transition-colors group-hover:bg-[#e5efde]">
        <div className="absolute inset-x-5 top-5 h-20 rounded-full bg-white/50 blur-2xl" />
        <img
          src={getImageUrl(product.thumbnail, "https://via.placeholder.com/300x300?text=No+Image")}
          alt={product.name}
          loading="lazy"
          className={`relative z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isOutOfStock ? "opacity-50 grayscale" : ""
          }`}
        />

        <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-slate-950/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Link
            to={`/products/${product.id}`}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition-all hover:scale-105 hover:bg-emerald-700 hover:text-white"
            title="View details"
            aria-label="View product details"
          >
            <FiEye size={18} />
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition-all hover:scale-105 hover:bg-rose-500 hover:text-white"
            title="Favorite"
            aria-label="Favorite product"
          >
            <FiHeart size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3
          className="mb-1.5 line-clamp-2 min-h-[40px] text-[15px] font-medium leading-snug text-slate-900 transition-colors group-hover:text-emerald-700"
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <p className="text-lg font-medium tabular-nums text-emerald-700">
              {formatCurrency(discountedPrice)}
            </p>
            {hasDiscount ? (
              <p className="text-xs tabular-nums text-slate-400 line-through">
                {formatCurrency(product.sellPrice)}
              </p>
            ) : product.importPrice > 0 ? (
              <p className="text-xs tabular-nums text-slate-400 line-through">
                {formatCurrency(product.sellPrice * 1.2)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all active:scale-95 ${
              isOutOfStock
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-emerald-700 text-white shadow-emerald-100 hover:bg-emerald-800"
            }`}
            disabled={isOutOfStock}
            title={isOutOfStock ? "Out of stock" : "Add to cart"}
            aria-label={isOutOfStock ? "Product is out of stock" : "Add to cart"}
          >
            <FiShoppingCart size={18} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
