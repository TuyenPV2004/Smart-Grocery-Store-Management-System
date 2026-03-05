import { toast } from "react-toastify";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import productService from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "../../components/common/ProductCard";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/image-gallery.css";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productRes, productsRes] = await Promise.all([
          productService.get(id),
          productService.getAll({ status: "ACTIVE", pageSize: 1000 }),
        ]);

        const currentProduct = productRes.data;
        setProduct(currentProduct);
        if (currentProduct.thumbnail) {
          setMainImage(`http://localhost:8080/${currentProduct.thumbnail}`);
        }

        const productList = productsRes.data?.content || productsRes.data || [];
        setAllProducts(Array.isArray(productList) ? productList : []);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const relatedProducts = useMemo(() => {
    if (!product || !Array.isArray(allProducts) || allProducts.length === 0) {
      return [];
    }

    const currentId = Number(product.id);
    const currentBrand = (product.brand || "").trim().toLowerCase();
    const currentSupplierId = product.supplier?.id;
    const currentLabelIds = new Set((product.labels || []).map((l) => l.id));

    const scored = allProducts
      .filter((p) => Number(p.id) !== currentId && p.status === "ACTIVE")
      .map((p) => {
        let score = 0;

        if (
          currentBrand &&
          (p.brand || "").trim().toLowerCase() === currentBrand
        ) {
          score += 3;
        }

        if (
          currentSupplierId &&
          p.supplier?.id &&
          Number(p.supplier.id) === Number(currentSupplierId)
        ) {
          score += 2;
        }

        const sharedLabelCount = (p.labels || []).filter((l) =>
          currentLabelIds.has(l.id),
        ).length;
        if (sharedLabelCount > 0) {
          score += sharedLabelCount * 2;
        }

        return { product: p, score };
      });

    const withScore = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => item.product);

    if (withScore.length >= 4) {
      return withScore;
    }

    const fallback = allProducts
      .filter((p) => Number(p.id) !== currentId && p.status === "ACTIVE")
      .slice(0, 8);

    return withScore.length > 0 ? withScore : fallback;
  }, [product, allProducts]);

  const handleQuantityChange = (type) => {
    if (type === "decrease") {
      setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
    } else {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để có thể thêm sản phẩm vào giỏ hàng.");
      navigate("/login");
      return;
    }
    if (product) {
      addToCart(product, quantity);
      toast.success("Đã thêm vào giỏ hàng!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4">
        <h2 className="text-2xl font-medium text-slate-800">
          Không tìm thấy sản phẩm
        </h2>
        <button
          onClick={() => navigate("/products")}
          className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 font-poppins">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb / Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-green-600 mb-8 transition-colors group"
        >
          <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-all border border-slate-100">
            <ArrowLeft size={20} />
          </div>
          <span className="font-medium">Quay lại</span>
        </button>

        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left Column - Images */}
            <div className="space-y-6 relative">
              {/* Status Badge */}
              {product.status === "OUT_OF_STOCK" && (
                <div className="absolute top-6 left-6 z-10 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg shadow-red-500/30">
                  Hết hàng
                </div>
              )}

              {mainImage ? (
                <div className="gallery-wrapper rounded-[2rem] overflow-hidden border border-slate-100 bg-white">
                  <style>
                    {`
                      .image-gallery-thumbnail {
                        border-radius: 0.5rem;
                        overflow: hidden;
                        transition: all 0.2s;
                      }
                      .image-gallery-thumbnail.active,
                      .image-gallery-thumbnail:hover {
                        border: 2px solid #16a34a;
                      }
                      .image-gallery-icon {
                        color: rgba(255, 255, 255, 0.8);
                      }
                      .image-gallery-icon:hover {
                        color: #fff;
                      }

                      /* Cấu hình mũi tên chuyển ảnh */
                      .gallery-wrapper .image-gallery-left-nav,
                      .gallery-wrapper .image-gallery-right-nav {
                        opacity: 0;
                        transition: opacity 0.3s ease-in-out;
                      }

                      .gallery-wrapper .image-gallery-slide-wrapper:hover .image-gallery-left-nav,
                      .gallery-wrapper .image-gallery-slide-wrapper:hover .image-gallery-right-nav {
                        opacity: 1;
                      }

                      /* Giảm kích thước và tăng độ đậm mũi tên */
                      .gallery-wrapper .image-gallery-left-nav .image-gallery-svg,
                      .gallery-wrapper .image-gallery-right-nav .image-gallery-svg {
                        height: 48px;
                        width: 24px;
                        stroke-width: 4px; /* Tăng độ đậm */
                        stroke: currentColor;
                      }

                      /* Giảm khoảng cách giữa ảnh chính và ảnh phụ */
                      .image-gallery-thumbnails-wrapper.bottom {
                        margin-top: 8px !important;
                      }
                      .image-gallery-slide-wrapper {
                        margin-bottom: 0px !important;
                      }

                      /* Khung ảnh chính vuông (giống BHX), không còn dư trắng */
                      .gallery-wrapper .image-gallery-slide-wrapper {
                        aspect-ratio: 1 / 1;
                      }

                      /* Bảo đảm các lớp con ăn theo chiều cao khung */
                      .gallery-wrapper .image-gallery-swipe,
                      .gallery-wrapper .image-gallery-slides,
                      .gallery-wrapper .image-gallery-slide {
                        height: 100% !important;
                      }

                      /* Ảnh lấp khung */
                      .gallery-wrapper .image-gallery-image {
                        width: 100% !important;
                        height: 100% !important;
                        object-fit: cover; /* cover sẽ không bị khoảng trắng */
                        display: block;
                      }
                    `}
                  </style>
                  <ImageGallery
                    items={[
                      {
                        original: mainImage,
                        thumbnail: mainImage,
                        originalClass:
                          "aspect-square w-full object-cover rounded-t-[2rem]",
                        thumbnailClass: "h-20 w-20 object-cover",
                      },
                      ...(product.images || []).map((img) => ({
                        original: `http://localhost:8080/${img.imageUrl}`,
                        thumbnail: `http://localhost:8080/${img.imageUrl}`,
                        originalClass:
                          "aspect-square w-full object-cover rounded-t-[2rem]",
                        thumbnailClass: "h-20 w-20 object-cover",
                      })),
                    ]}
                    showPlayButton={false}
                    showFullscreenButton={false}
                    thumbnailPosition="bottom"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-center">
                  <div className="text-slate-300 flex flex-col items-center">
                    <span className="text-6xl font-black opacity-20 select-none">
                      IMG
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Info */}
            <div>
              <div className="mb-2">
                <span className="text-white font-medium tracking-wider text-sm uppercase bg-green-600 px-3 py-1 rounded-full">
                  {product.brand || "Grocery Store"}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-medium text-slate-900 mb-4 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-medium text-slate-900">
                    {product.sellPrice?.toLocaleString("vi-VN")}
                  </span>
                  <span className="text-lg font-medium text-slate-900 mb-1">
                    ₫ / {product.unit}
                  </span>
                </div>
              </div>

              <p className="text-slate-500 leading-relaxed mb-10 text-lg">
                {product.description ||
                  "Sản phẩm tươi ngon, được chọn lọc kỹ càng để đảm bảo chất lượng tốt nhất cho bữa ăn gia đình bạn."}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10 pb-10 border-b border-slate-100">
                {/* Quantity Selector */}
                <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 p-1 w-fit">
                  <button
                    onClick={() => handleQuantityChange("decrease")}
                    className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-500 transition-all active:scale-95 bg-white shadow-sm"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="w-16 text-center font-medium text-lg text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange("increase")}
                    className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-500 transition-all active:scale-95 bg-white shadow-sm"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.status === "OUT_OF_STOCK"}
                  className="flex-1 bg-green-600 text-white px-8 py-4 rounded-2xl font-medium text-lg shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={24} />
                  <span>Thêm vào giỏ hàng</span>
                </button>

                {/* Favorite Button */}
                <button className="w-16 h-16 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-95 shadow-sm">
                  <Heart size={24} />
                </button>
              </div>

              {/* Extra Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Truck,
                    label: "Giao hàng",
                    value: "2-4 giờ",
                    color:
                      "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-200",
                    iconColor: "text-blue-500",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Đảm bảo",
                    value: "tươi ngon",
                    color:
                      "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-200",
                    iconColor: "text-emerald-500",
                  },
                  {
                    icon: RotateCw,
                    label: "Đổi trả",
                    value: "trong 24h",
                    color:
                      "bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-200",
                    iconColor: "text-amber-500",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${item.color} shadow-sm hover:shadow-md cursor-default`}
                  >
                    <div
                      className={`p-2.5 rounded-full bg-white shadow-sm ${item.iconColor}`}
                    >
                      <item.icon size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-medium tracking-wider mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-medium text-slate-900">
              Sản phẩm tương tự
            </h2>
          </div>

          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-slate-500">
              Hiện chưa có sản phẩm liên quan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
