import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiArrowRight,
  FiHeart,
  FiLoader,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiTruck,
} from "react-icons/fi";
import { FaHome, FaShoppingCart } from "react-icons/fa";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/image-gallery.css";
import ProductCard from "../../components/common/ProductCard";
import { Button, EmptyState, PageContainer, PageHeader, PageShell, StatusBadge, SurfaceCard } from "../../components/ui";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import productService from "../../services/productService";
import { fetchStockLookup, hydrateProductStock, hydrateProductsStock } from "../../services/stockAvailabilityService";
import { getImageUrl } from "../../utils/imageUrl";

const ARTICLE_CARDS = [
  {
    badge: "Shopping tips",
    title: "How to choose fresh groceries",
    description: "Simple cues for checking freshness, color, texture, and packaging before you add items to cart.",
    image: "https://cdn.tgdd.vn//News/1443302//cach-chon-sua-cong-thuc-phu-hop-cho-tre-3-845x479.jpg",
    url: "https://www.avakids.com/me-va-be/cach-chon-sua-cong-thuc-phu-hop-cho-tre-1443302",
  },
  {
    badge: "Storage",
    title: "Keep seafood and meat fresh longer",
    description: "Storage habits that help preserve flavor and reduce waste after your delivery arrives.",
    image: "https://giadinh.mediacdn.vn/thumb_w/640/296230595582509056/2025/3/18/hs3-17422715838861107342096.jpg",
    url: "https://giadinh.suckhoedoisong.vn/5-meo-bao-quan-hai-san-tuoi-lau-khong-bi-mat-vi-172250312155805609.htm",
  },
  {
    badge: "Meal ideas",
    title: "Fast meals with vegetables",
    description: "Build quick weekday meals from fresh vegetables, mushrooms, fruits, and pantry basics.",
    image: "https://cdn.tgdd.vn/Files/2021/02/23/1329736/thuc-don-giam-can-7-ngay-tu-rau-cu-qua-ma-chi-em-nao-cung-me-202112301215164181.jpg",
    url: "https://www.bachhoaxanh.com/kinh-nghiem-hay/thuc-don-giam-can-7-ngay-tu-rau-cu-qua-ma-chi-em-nao-cung-me-1329736",
  },
  {
    badge: "Offers",
    title: "Shop smarter with bundles",
    description: "Combine essentials and promotions to control your grocery budget without reducing quality.",
    image: "https://cdn.tgdd.vn//News/1508028//cach-lam-kem-sua-chua-dau-800x564.jpg",
    url: "https://www.avakids.com/me-va-be/cach-lam-kem-sua-chua-1508028",
  },
];

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productRes, productsRes, stockLookup] = await Promise.all([
          productService.get(id),
          productService.getAll({ status: "ACTIVE", pageSize: 1000 }),
          fetchStockLookup(),
        ]);

        setProduct(hydrateProductStock(productRes.data, stockLookup));
        const productList = productsRes.data?.content || productsRes.data || [];
        setAllProducts(Array.isArray(productList) ? hydrateProductsStock(productList, stockLookup) : []);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const galleryItems = useMemo(() => {
    if (!product) return [];
    const primary = product.thumbnail ? [getImageUrl(product.thumbnail)] : [];
    const extra = (product.images || []).map((image) => getImageUrl(image.imageUrl));
    return [...primary, ...extra].map((image) => ({
      original: image,
      thumbnail: image,
      originalClass: "aspect-square w-full object-cover",
      thumbnailClass: "h-20 w-20 object-cover",
    }));
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product || !Array.isArray(allProducts)) return [];

    const currentId = Number(product.id);
    const currentBrand = (product.brand || "").trim().toLowerCase();
    const currentSupplierId = product.supplier?.id;
    const currentLabelIds = new Set((product.labels || []).map((label) => label.id));

    const scored = allProducts
      .filter((candidate) => Number(candidate.id) !== currentId && candidate.status === "ACTIVE")
      .map((candidate) => {
        let score = 0;
        if (currentBrand && (candidate.brand || "").trim().toLowerCase() === currentBrand) score += 3;
        if (currentSupplierId && Number(candidate.supplier?.id) === Number(currentSupplierId)) score += 2;
        score += (candidate.labels || []).filter((label) => currentLabelIds.has(label.id)).length * 2;
        return { product: candidate, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);

    return (scored.length ? scored : allProducts.filter((candidate) => Number(candidate.id) !== currentId)).slice(0, 10);
  }, [product, allProducts]);

  const stockQuantity = Number(product?.stockQuantity || 0);
  const isOutOfStock = product?.status === "OUT_OF_STOCK" || stockQuantity <= 0;

  const handleAddToCart = () => {
    if (!user) {
      toast.warning("Please sign in to add products to your cart.");
      navigate("/login");
      return;
    }

    if (isOutOfStock) {
      toast.warning("This product is out of stock.");
      return;
    }

    if (quantity > stockQuantity) {
      toast.warning(`Only ${stockQuantity} item(s) available.`);
      return;
    }

    if (product) {
      addToCart(product, quantity);
      toast.success("Product added to cart.");
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));

  const breadcrumbProductName = product?.name ? `${product.name.slice(0, 30)}...` : "Product";

  if (loading) {
    return (
      <PageShell className="flex items-center justify-center">
        <FiLoader className="h-12 w-12 animate-spin text-emerald-700" />
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell className="flex items-center justify-center p-4">
        <PageContainer className="max-w-xl">
          <EmptyState
            title="Product not found"
            description="The product may have been removed or is no longer available."
            action={<Button type="button" onClick={() => navigate("/products")}>Back to products</Button>}
          />
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell className="py-8">
      <PageContainer>
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link to="/" className="flex items-center gap-1.5 text-black hover:text-slate-900">
            <FaHome className="text-emerald-700" size={16} />
            Home
          </Link>
          <span className="font-semibold text-black">&gt;</span>
          <Link to="/products" className="text-black hover:text-slate-900">Products</Link>
          <span className="font-semibold text-black">&gt;</span>
          <span className="text-emerald-700">{breadcrumbProductName}</span>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] xl:gap-14">
          <div className="relative">
            {isOutOfStock ? (
              <div className="absolute left-4 top-4 z-10">
                <StatusBadge tone="rose">Out of stock</StatusBadge>
              </div>
            ) : null}

            {galleryItems.length > 0 ? (
              <div className="gallery-wrapper mx-auto max-w-[480px] overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white lg:mx-0 xl:max-w-[500px]">
                <style>
                  {`
                    .gallery-wrapper .image-gallery-slide-wrapper { aspect-ratio: 1 / 1; }
                    .gallery-wrapper .image-gallery-swipe,
                    .gallery-wrapper .image-gallery-slides,
                    .gallery-wrapper .image-gallery-slide { height: 100% !important; }
                    .gallery-wrapper .image-gallery-image {
                      width: 100% !important;
                      height: 100% !important;
                      object-fit: contain;
                      padding: 1.5rem;
                      display: block;
                    }
                    .gallery-wrapper .image-gallery-thumbnail {
                      border-radius: 0.75rem;
                      overflow: hidden;
                    }
                    .gallery-wrapper .image-gallery-thumbnail.active,
                    .gallery-wrapper .image-gallery-thumbnail:hover {
                      border: 2px solid #15803d;
                    }
                  `}
                </style>
                <ImageGallery
                  items={galleryItems}
                  showPlayButton={false}
                  showFullscreenButton={false}
                  thumbnailPosition="bottom"
                />
              </div>
            ) : (
              <div className="mx-auto flex aspect-square max-w-[480px] items-center justify-center rounded-[1.5rem] border border-slate-100 bg-slate-50 text-5xl font-semibold text-slate-200 lg:mx-0 xl:max-w-[500px]">
                IMG
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-4">
              <StatusBadge tone="emerald">{product.brand || "Grocery Store"}</StatusBadge>
            </div>

            <h1 className="text-3xl font-medium leading-tight text-slate-950">
              {product.name}
            </h1>

            <div className="mt-5 flex items-end gap-2">
              <span className="text-3xl font-medium tabular-nums text-emerald-700">
                {formatCurrency(product.sellPrice)}
              </span>
              <span className="pb-1 text-sm font-medium text-slate-500">
                / {product.unit}
              </span>
            </div>

            <p className="mt-6 text-base leading-8 text-slate-500">
              {product.description ||
                "Fresh grocery item selected for everyday meals and convenient home delivery."}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <div className="flex w-fit items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="flex h-12 w-12 items-center justify-center text-slate-600 transition-colors hover:text-emerald-700"
                  aria-label="Decrease quantity"
                >
                  <FiMinus size={18} />
                </button>
                <span className="w-16 text-center text-lg font-medium text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="flex h-12 w-12 items-center justify-center text-slate-600 transition-colors hover:text-emerald-700"
                  disabled={isOutOfStock || quantity >= stockQuantity}
                  aria-label="Increase quantity"
                >
                  <FiPlus size={18} />
                </button>
              </div>

              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-4 text-base"
              >
                <FaShoppingCart size={21} />
                Add to cart
              </Button>

              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                aria-label="Favorite product"
              >
                <FiHeart size={22} />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
              <TrustCard icon={FiTruck} label="Delivery" value="2-4 hours" tone="blue" />
              <TrustCard icon={FiShield} label="Quality" value="Fresh pick" tone="emerald" />
              <TrustCard icon={FiRefreshCw} label="Return" value="24-hour support" tone="amber" />
            </div>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-medium text-slate-900">Similar products</h2>
          </div>

          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          ) : (
            <SurfaceCard className="text-slate-500">No related products available.</SurfaceCard>
          )}
        </section>

        <section className="mt-14">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-medium text-slate-900">Related articles</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Useful guides for choosing, storing, and cooking fresh groceries.
              </p>
            </div>
            <Link to="/products" className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              View products
              <FiArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {ARTICLE_CARDS.map((article) => (
              <article
                key={article.title}
                className="group h-full overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/90 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)]"
              >
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </a>
                <div className="flex min-h-[220px] flex-col p-5">
                  <StatusBadge tone="emerald" className="mb-3 w-fit">
                    {article.badge}
                  </StatusBadge>
                  <h3 className="line-clamp-2 text-lg font-medium leading-snug text-slate-900">
                    {article.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                    {article.description}
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Read more
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </PageContainer>
    </PageShell>
  );
};

const TrustCard = ({ icon: Icon, label, value, tone }) => {
  const toneClass = {
    blue: "border-sky-100 bg-sky-50 text-sky-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${toneClass[tone]}`}>
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-transparent">
        {React.createElement(Icon, { size: 20 })}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-sm leading-5 text-current/80">{value}</p>
      </div>
    </div>
  );
};

export default ProductDetailPage;
