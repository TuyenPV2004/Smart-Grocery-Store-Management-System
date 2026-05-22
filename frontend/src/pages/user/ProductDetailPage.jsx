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
import { IoIosSend } from "react-icons/io";
import { FaHome, FaShoppingCart, FaStar } from "react-icons/fa";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/image-gallery.css";
import ProductCard from "../../components/common/ProductCard";
import { Button, EmptyState, PageContainer, PageHeader, PageShell, StatusBadge, SurfaceCard } from "../../components/ui";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import productService from "../../services/productService";
import reviewService from "../../services/reviewService";
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
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyLoadingId, setReplyLoadingId] = useState(null);
  const [activeAdminReplyId, setActiveAdminReplyId] = useState(null);
  const [activeUserReplyId, setActiveUserReplyId] = useState(null);
  const [userReplyDrafts, setUserReplyDrafts] = useState({});
  const [userReplyLoadingId, setUserReplyLoadingId] = useState(null);

  const isAdminUser = user?.role === "ADMIN" || user?.role === "STAFF" || user?.roles?.some((role) => role === "ADMIN" || role === "STAFF");

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

  const fetchReviews = async () => {
    try {
      const res = await reviewService.getByProduct(id);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      setReviews([]);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchEligibility = async () => {
      if (!id || !user || isAdminUser) {
        setCanReview(false);
        return;
      }

      try {
        const res = await reviewService.getEligibility(id);
        setCanReview(Boolean(res.data?.canReview));
      } catch {
        setCanReview(false);
      }
    };

    fetchEligibility();
  }, [id, user, isAdminUser]);

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

  const reviewTree = useMemo(() => {
    const byParent = new Map();
    reviews.forEach((review) => {
      const parentKey = review.parentReviewId ? String(review.parentReviewId) : "root";
      byParent.set(parentKey, [...(byParent.get(parentKey) || []), review]);
    });
    return { roots: byParent.get("root") || [], byParent };
  }, [reviews]);

  const hasStockQuantity = product?.stockQuantity !== null && product?.stockQuantity !== undefined;
  const stockQuantity = Number(product?.stockQuantity || 0);
  const isOutOfStock = product?.status === "OUT_OF_STOCK" || (hasStockQuantity && stockQuantity <= 0);

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

    if (hasStockQuantity && quantity > stockQuantity) {
      toast.warning(`Only ${stockQuantity} item(s) available.`);
      return;
    }

    if (product) {
      addToCart(product, quantity);
      toast.success("Product added to cart.");
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!reviewComment.trim()) {
      toast.warning("Please enter your comment.");
      return;
    }

    setReviewLoading(true);
    try {
      await reviewService.create(id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      toast.success("Review submitted.");
      setReviewComment("");
      setReviewRating(5);
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data || error.message || "Unable to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReply = async (reviewId) => {
    const reply = replyDrafts[reviewId]?.trim();
    if (!reply) {
      toast.warning("Please enter a reply.");
      return;
    }

    setReplyLoadingId(reviewId);
    try {
      await reviewService.reply(reviewId, { reply });
      toast.success("Reply saved.");
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: "" }));
      setActiveAdminReplyId(null);
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data || error.message || "Unable to save reply.");
    } finally {
      setReplyLoadingId(null);
    }
  };

  const handleSubmitUserReply = async (review) => {
    const reply = userReplyDrafts[review.id]?.trim();
    if (!reply) {
      toast.warning("Vui lòng nhập nội dung trả lời.");
      return;
    }

    setUserReplyLoadingId(review.id);
    try {
      await reviewService.create(id, {
        parentReviewId: review.id,
        rating: review.rating || 5,
        comment: reply,
      });
      toast.success("Đã gửi trả lời.");
      setUserReplyDrafts((prev) => ({ ...prev, [review.id]: "" }));
      setActiveUserReplyId(null);
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data || error.message || "Unable to submit reply.");
    } finally {
      setUserReplyLoadingId(null);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));

  const breadcrumbProductName = product?.name ? `${product.name.slice(0, 30)}...` : "Product";
  const renderReviewReplies = (parentId, depth = 0) => {
    const replies = reviewTree.byParent.get(String(parentId)) || [];
    if (!replies.length) return null;

    return (
      <div className="mt-4 space-y-3 border-l-2 border-emerald-100 pl-4">
        {replies.map((reply) => (
          <div key={reply.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{reply.customerName || reply.username}</p>
                <div className="mt-1 flex gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar key={star} className={star <= reply.rating ? "text-amber-400" : "text-slate-200"} />
                  ))}
                </div>
              </div>
              <span className="shrink-0 text-xs font-medium text-slate-400">
                {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString("vi-VN") : ""}
              </span>
            </div>
            <p className="mt-3 leading-7 text-slate-600">{reply.comment}</p>

            {canReview && !isAdminUser ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setActiveUserReplyId((current) => (current === reply.id ? null : reply.id))}
                  className="text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
                >
                  Trả lời
                </button>

                {activeUserReplyId === reply.id ? (
                  <div className="mt-3 relative flex items-center rounded-2xl border !border-black bg-white focus-within:!border-black focus-within:!shadow-none focus-within:!ring-0 focus-within:!ring-transparent">
                    <textarea
                      value={userReplyDrafts[reply.id] || ""}
                      onChange={(event) =>
                        setUserReplyDrafts((prev) => ({ ...prev, [reply.id]: event.target.value }))
                      }
                      rows={2}
                      className="min-h-[44px] flex-1 resize-none bg-transparent pl-4 pr-12 py-3 text-sm text-slate-800 placeholder:text-slate-400/80 outline-none focus:!shadow-none focus:!ring-0 focus:!ring-transparent border-0 focus:border-transparent focus:outline-none"
                      placeholder="Nhập trả lời của bạn..."
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmitUserReply(reply)}
                      disabled={userReplyLoadingId === reply.id}
                      className="absolute right-3 flex h-8 w-8 items-center justify-center text-green-600 hover:text-green-700 disabled:opacity-30 transition-colors focus:outline-none focus:ring-0"
                      aria-label="Send reply"
                    >
                      {userReplyLoadingId === reply.id ? <FiLoader className="h-4 w-4 animate-spin" /> : <IoIosSend size={22} />}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {depth < 4 ? renderReviewReplies(reply.id, depth + 1) : null}
          </div>
        ))}
      </div>
    );
  };

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
                  disabled={isOutOfStock || (hasStockQuantity && quantity >= stockQuantity)}
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

        <section className="mt-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-medium text-slate-900">Product reviews</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Feedback from customers who bought this product.
              </p>
            </div>
            {reviews.length ? (
              <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                <FaStar className="text-amber-500" />
                {(reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)}
                <span className="text-slate-500">({reviews.length})</span>
              </div>
            ) : null}
          </div>

          {canReview ? (
            <SurfaceCard className="mb-6">
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Your rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl transition-colors ${star <= reviewRating ? "text-amber-400" : "text-slate-200 hover:text-amber-300"}`}
                        aria-label={`${star} star`}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Comment</span>
                  <div className="relative flex rounded-2xl border !border-black bg-white focus-within:!border-black focus-within:!shadow-none focus-within:!ring-0 focus-within:!ring-transparent">
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      rows={4}
                      className="w-full resize-none bg-transparent pl-4 pr-12 py-3 text-sm text-slate-800 outline-none focus:!shadow-none focus:!ring-0 focus:!ring-transparent border-0 focus:border-transparent focus:outline-none"
                      placeholder="Share your experience with this product..."
                    />
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center text-green-600 hover:text-green-700 disabled:opacity-30 transition-colors focus:outline-none focus:ring-0"
                      aria-label="Submit review"
                    >
                      {reviewLoading ? <FiLoader className="h-4 w-4 animate-spin" /> : <IoIosSend size={22} />}
                    </button>
                  </div>
                </label>
              </form>
            </SurfaceCard>
          ) : !user ? (
            <SurfaceCard className="mb-6 text-sm font-medium text-slate-500">
              Please sign in to review products you have purchased.
            </SurfaceCard>
          ) : null}

          {reviews.length ? (
            <div className="space-y-4">
              {reviewTree.roots.map((review) => {
                return (
                <SurfaceCard key={review.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{review.customerName || review.username}</p>
                      <div className="mt-1 flex gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar key={star} className={star <= review.rating ? "text-amber-400" : "text-slate-200"} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString("vi-VN") : ""}
                    </span>
                  </div>
                  <p className="mt-4 leading-7 text-slate-600">{review.comment}</p>

                  {review.adminReply ? (
                    <div className="relative mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 before:absolute before:-top-2 before:left-8 before:h-4 before:w-4 before:rotate-45 before:border-l before:border-t before:border-emerald-100 before:bg-emerald-50 before:content-['']">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="text-left">
                          <p className="text-sm font-semibold text-emerald-900">
                            {review.repliedBy || "Administrator"}
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                              Admin
                            </span>
                          </p>
                        </div>
                        {review.repliedAt ? (
                          <p className="shrink-0 text-xs font-medium text-emerald-700/70">
                            {new Date(review.repliedAt).toLocaleDateString("vi-VN")}
                          </p>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-emerald-900/80">{review.adminReply}</p>
                    </div>
                  ) : null}

                  {canReview && !isAdminUser ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveUserReplyId((current) => (current === review.id ? null : review.id))
                        }
                        className="text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
                      >
                        Trả lời
                      </button>

                      {activeUserReplyId === review.id ? (
                        <div className="mt-3 relative flex items-center rounded-2xl border !border-black bg-white focus-within:!border-black focus-within:!shadow-none focus-within:!ring-0 focus-within:!ring-transparent">
                          <textarea
                            value={userReplyDrafts[review.id] || ""}
                            onChange={(event) =>
                              setUserReplyDrafts((prev) => ({ ...prev, [review.id]: event.target.value }))
                            }
                            rows={2}
                            className="min-h-[44px] flex-1 resize-none bg-transparent pl-4 pr-12 py-3 text-sm text-slate-800 placeholder:text-slate-400/80 outline-none focus:!shadow-none focus:!ring-0 focus:!ring-transparent border-0 focus:border-transparent focus:outline-none"
                            placeholder="Nhập trả lời của bạn..."
                          />
                          <button
                            type="button"
                            onClick={() => handleSubmitUserReply(review)}
                            disabled={userReplyLoadingId === review.id}
                            className="absolute right-3 flex h-8 w-8 items-center justify-center text-green-600 hover:text-green-700 disabled:opacity-30 transition-colors focus:outline-none focus:ring-0"
                            aria-label="Send reply"
                          >
                            {userReplyLoadingId === review.id ? <FiLoader className="h-4 w-4 animate-spin" /> : <IoIosSend size={22} />}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {renderReviewReplies(review.id)}

                  {isAdminUser ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveAdminReplyId((current) => (current === review.id ? null : review.id))
                        }
                        className="text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
                      >
                        Trả lời
                      </button>

                      {activeAdminReplyId === review.id ? (
                        <div className="mt-3 relative flex items-center rounded-2xl border !border-black bg-white focus-within:!border-black focus-within:!shadow-none focus-within:!ring-0 focus-within:!ring-transparent">
                          <textarea
                            value={replyDrafts[review.id] ?? review.adminReply ?? ""}
                            onChange={(event) =>
                              setReplyDrafts((prev) => ({ ...prev, [review.id]: event.target.value }))
                            }
                            rows={2}
                            className="min-h-[44px] flex-1 resize-none bg-transparent pl-4 pr-12 py-3 text-sm text-slate-800 placeholder:text-slate-400/80 outline-none focus:!shadow-none focus:!ring-0 focus:!ring-transparent border-0 focus:border-transparent focus:outline-none"
                            placeholder="Reply to this review..."
                          />
                          <button
                            type="button"
                            onClick={() => handleReply(review.id)}
                            disabled={replyLoadingId === review.id}
                            className="absolute right-3 flex h-8 w-8 items-center justify-center text-green-600 hover:text-green-700 disabled:opacity-30 transition-colors focus:outline-none focus:ring-0"
                            aria-label="Reply to review"
                          >
                            {replyLoadingId === review.id ? <FiLoader className="h-4 w-4 animate-spin" /> : <IoIosSend size={22} />}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </SurfaceCard>
              );
              })}
            </div>
          ) : (
            <SurfaceCard className="text-slate-500">No reviews yet.</SurfaceCard>
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
