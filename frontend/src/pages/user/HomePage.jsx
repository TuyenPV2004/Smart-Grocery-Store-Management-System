import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiClock,
  FiCreditCard,
  FiHeadphones,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import ProductCard from "../../components/common/ProductCard";

const HERO_FEATURES = [
  {
    icon: FiHeadphones,
    title: "Customer Service",
  },
  {
    icon: FiTruck,
    title: "Local Delivery",
  },
  {
    icon: FiAward,
    title: "Special Promo Codes",
  },
];

const HOME_INFO_STRIP = [
  {
    icon: FiTruck,
    title: "Miễn phí giao hàng",
    desc: "Cho đơn từ 500k",
  },
  {
    icon: FiAward,
    title: "Tươi mới mỗi ngày",
    desc: "Nhập hàng theo ca",
  },
  {
    icon: FiCreditCard,
    title: "Thanh toán an toàn",
    desc: "Hỗ trợ nhiều phương thức",
  },
  {
    icon: FiHeadphones,
    title: "Hỗ trợ 24/7",
    desc: "Tư vấn nhanh khi cần",
  },
];

const CATEGORY_PRESETS = [
  {
    key: "vegetables",
    title: "Vegetables",
    match: ["rau", "cu", "nam", "trai cay", "hoa qua", "vegetable"],
    color: "#DDEFD8",
    imageSrc: "/category-images/vegetables.png",
  },
  {
    key: "frozen",
    title: "Frozen",
    match: ["dong lanh", "frozen", "ice cream", "yogurt", "kem"],
    color: "#F8DCE6",
    imageSrc: "/category-images/meat.png",
  },
  {
    key: "bakery",
    title: "Bakery",
    match: ["bakery", "bread", "banh", "cake", "pastry"],
    color: "#F3E6C8",
    imageSrc: "/category-images/noodles.png",
  },
  {
    key: "dairy",
    title: "Dairy",
    match: ["sua", "milk", "dairy", "cheese", "butter"],
    color: "#DDEAFB",
    imageSrc: "/category-images/milk.png",
  },
  {
    key: "meat-seafood",
    title: "Meat & Seafood",
    match: ["thit", "trung", "hai san", "seafood", "meat"],
    color: "#DFF2E8",
    imageSrc: "/category-images/meat.png",
  },
];

const RELATED_POST_IMAGES = [
  "https://cdn.tgdd.vn//News/1443302//cach-chon-sua-cong-thuc-phu-hop-cho-tre-3-845x479.jpg",
  "https://giadinh.mediacdn.vn/thumb_w/640/296230595582509056/2025/3/18/hs3-17422715838861107342096.jpg",
  "https://cdn.tgdd.vn/Files/2021/02/23/1329736/thuc-don-giam-can-7-ngay-tu-rau-cu-qua-ma-chi-em-nao-cung-me-202112301215164181.jpg",
  "https://cdn.tgdd.vn//News/1508028//cach-lam-kem-sua-chua-dau-800x564.jpg",
];

const RELATED_POST_URLS = [
  "https://www.avakids.com/me-va-be/cach-chon-sua-cong-thuc-phu-hop-cho-tre-1443302",
  "https://giadinh.suckhoedoisong.vn/5-meo-bao-quan-hai-san-tuoi-lau-khong-bi-mat-vi-172250312155805609.htm",
  "https://www.bachhoaxanh.com/kinh-nghiem-hay/thuc-don-giam-can-7-ngay-tu-rau-cu-qua-ma-chi-em-nao-cung-me-1329736",
  "https://www.avakids.com/me-va-be/cach-lam-kem-sua-chua-1508028",
];

const normalizeCategoryName = (name = "") =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getCategoryPreset = (name, index) => {
  const normalizedName = normalizeCategoryName(name);
  return (
    CATEGORY_PRESETS.find((item) =>
      item.match.some((keyword) => normalizedName.includes(keyword)),
    ) || CATEGORY_PRESETS[index % CATEGORY_PRESETS.length]
  );
};

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const popularCategories = CATEGORY_PRESETS.map((preset) => ({
    id: `preset-${preset.key}`,
    name: preset.title,
    color: preset.color,
    imageSrc: preset.imageSrc,
    link: "/products",
  }));

  const relatedPosts = popularCategories.slice(0, 4).map((category, index) => ({
    id: `post-${category.id}-${index}`,
    badge: ["Mẹo mua sắm", "Bảo quản", "Gợi ý món ăn", "Ưu đãi"][index],
    title: [
      `Cách chọn ${category.name}`,
      `Bảo quản ${category.name} đúng cách`,
      `Thực đơn nhanh với ${category.name}`,
      `Mua ${category.name} tiết kiệm hơn`,
    ][index],
    description:
      "Gợi ý hữu ích giúp bạn chọn thực phẩm tươi, bảo quản tốt hơn và chuẩn bị bữa ăn tiện lợi cho gia đình.",
    imageSrc: RELATED_POST_IMAGES[index] || category.imageSrc,
    link: RELATED_POST_URLS[index] || category.link,
  }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productService.getAll({ pageSize: 8 }),
          categoryService.getTree(),
        ]);
        setProducts(productsRes.data?.content || productsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="font-poppins min-h-screen app-page-bg">
      <section className="px-4 pt-10 sm:px-6 lg:px-10 lg:pt-12">
        <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="grid gap-5 lg:grid-rows-[300px_repeat(3,1fr)]">
            <Link
              to="/products"
              className="group relative min-h-[210px] overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
            >
              <img
                src="/category-images/vegetables.png"
                alt="Rau củ tươi"
                className="absolute inset-0 h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-5 text-white"></div>
            </Link>

            {HERO_FEATURES.map((item, index) => {
              const bgColors = ["#E6D29E", "#EAD8B8", "#DDD8C5"];
              return (
                <article
                  key={item.title}
                  className="flex items-center justify-start gap-3 min-h-[110px] rounded-xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                  style={{ backgroundColor: bgColors[index] }}
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center text-black">
                    <item.icon size={24} />
                  </span>
                  <h3 className="text-sm font-medium text-black">
                    {item.title}
                  </h3>
                </article>
              );
            })}
          </aside>

          <div className="relative min-h-[620px] overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2400&auto=format&fit=crop"
              alt="Khách hàng chọn thực phẩm tươi"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/18 to-emerald-950/30" />
            <div className="relative z-10 flex h-full min-h-[620px] flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12">
              <div className="max-w-xl pt-4 text-white">
                <p className="mb-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semimedium backdrop-blur-md">
                  Grocery Store Fresh Market
                </p>
                <h1 className="text-4xl font-medium leading-tight tracking-tight sm:text-5xl xl:text-6xl">
                  Thực phẩm tươi cho căn bếp hiện đại
                </h1>
                <p className="mt-5 max-w-lg text-base leading-8 text-white/82 sm:text-lg">
                  Mua rau củ, thịt cá, sữa và đồ dùng hằng ngày trong một giỏ
                  hàng gọn gàng, giao nhanh đúng khung giờ bạn chọn.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-medium text-emerald-800 shadow-lg transition-all hover:bg-emerald-50 active:scale-95"
                  >
                    Mua sắm ngay
                    <FiArrowRight size={18} />
                  </Link>
                  <Link
                    to="/promotions"
                    className="inline-flex items-center rounded-2xl border border-white/35 px-6 py-3.5 text-sm font-medium text-white transition-all hover:bg-white/10"
                  >
                    Xem khuyến mãi
                  </Link>
                </div>
              </div>

              <div className="grid max-w-md grid-cols-3 gap-3 text-white">
                {[
                  ["2h", "Giao nhanh"],
                  ["98%", "Hài lòng"],
                  ["500+", "Mặt hàng"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/15 bg-white/12 p-4 backdrop-blur-md"
                  >
                    <p className="text-2xl font-medium">{value}</p>
                    <p className="mt-1 text-xs font-medium text-white/70">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-6 right-6 top-6 z-20 hidden w-[330px] rounded-[2rem] border border-white/45 bg-white/28 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] backdrop-blur-xl xl:block">
              <div className="flex h-full flex-col">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semimedium text-white/78">
                        Đánh giá khách hàng
                      </p>
                      <div className="mt-3 flex gap-1 text-amber-300">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <FiStar key={index} size={15} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="text-4xl font-medium tracking-tight">98%</p>
                  </div>

                  <div className="my-5 h-px bg-white/35" />

                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=160&auto=format&fit=crop"
                      alt="Khách hàng"
                      className="h-12 w-12 rounded-full border-2 border-white/60 object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">Minh Anh</p>
                      <p className="mt-1 text-xs leading-5 text-white/74">
                        Đơn rau củ rất tươi, đóng gói sạch và giao đúng giờ.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/18 text-white transition-colors hover:bg-white/28"
                        aria-label="Đánh giá trước"
                      >
                        <FiArrowLeft size={17} />
                      </button>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-800 transition-colors hover:bg-emerald-50"
                        aria-label="Đánh giá sau"
                      >
                        <FiArrowRight size={17} />
                      </button>
                    </div>
                    <span className="text-xs font-semimedium text-white/70">
                      1 / 4
                    </span>
                  </div>

                  <Link
                    to="/products"
                    className="mt-5 flex w-full items-center justify-center rounded-2xl bg-white py-3 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-50"
                  >
                    Khám phá cửa hàng
                  </Link>
                </div>

                <div className="mt-auto rounded-[1.5rem] border border-white/35 bg-white/86 p-5 text-center text-slate-900 shadow-xl">
                  <FiClock className="mx-auto text-emerald-700" size={26} />
                  <h2 className="mt-3 text-xl font-medium leading-snug">
                    Đặt trước bữa tối trong 60 giây
                  </h2>
                  <Link
                    to="/products"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
                  >
                    Tạo giỏ hàng
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-3 border border-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: "#7a9c5c" }}>
        {HOME_INFO_STRIP.map((item) => (
          <article
            key={item.title}
            className="flex items-center justify-center gap-4 px-4 py-3 text-center"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center text-white">
              <item.icon size={22} />
            </span>
            <div>
              <h3 className="text-sm font-medium text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-white/80">{item.desc}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-4 space-y-12 pb-12 pt-8 sm:px-6 lg:px-10">
        <div className="space-y-6 md:space-y-8">
          <section>
            <div className="flex items-end justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-medium text-slate-900 mb-2">
                  Categories
                </h2>
              </div>
              <Link
                to="/products"
                className="shrink-0 text-green-600 font-semimedium hover:text-green-700 flex items-center gap-1.5 group"
              >
                Veiw All
                <FiArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>

            <div className="-mx-6 px-6 overflow-x-auto pb-4 md:mx-0 md:px-0 md:overflow-visible md:pb-0">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                {popularCategories.map((category) => (
                  <Link
                    to={category.link}
                    key={category.id}
                    className="group cursor-pointer"
                  >
                    <article className="flex flex-col gap-2 transition-all duration-500 ease-out group-hover:-translate-y-2">
                      <div
                        className="relative aspect-[1.08/1] w-full overflow-hidden rounded-[12px] shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                        style={{ backgroundColor: category.color }}
                      >
                        <div className="absolute inset-x-5 top-4 h-20 rounded-full bg-white/35 blur-2xl" />
                        <div className="relative flex h-full items-center justify-center p-4">
                          <div className="absolute bottom-4 h-16 w-[74%] rounded-full bg-black/10 blur-xl transition-transform duration-500 group-hover:scale-110" />
                          <img
                            src={category.imageSrc}
                            alt={category.name}
                            className="relative z-10 h-[84%] w-[84%] object-contain drop-shadow-[0_18px_24px_rgba(15,23,42,0.14)] transition-transform duration-500 group-hover:scale-[1.06]"
                          />
                        </div>
                      </div>

                      <div
                        className="flex min-h-[52px] w-full items-center justify-center rounded-[12px] px-4 py-2 text-center shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                        style={{ backgroundColor: category.color }}
                      >
                        <p className="line-clamp-2 text-sm font-semibold tracking-tight text-slate-900 md:text-base">
                          {category.name}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-400 md:hidden">
              <span>Kéo ngang để xem thêm</span>
              <FiArrowRight size={16} />
            </div>
          </section>

          <section>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-medium text-slate-900">
                  Suggested for you
                </h2>
              </div>
              <Link
                to="/products"
                className="text-green-600 font-medium hover:text-green-700 flex items-center gap-1 group"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.length > 0
                ? products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                : !loading && (
                    <div className="col-span-4 text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                      <p className="text-slate-500">Chưa có sản phẩm nào.</p>
                    </div>
                  )}
              {loading &&
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl h-[350px] animate-pulse"
                    />
                  ))}
            </div>
          </section>
        </div>

        <section className="py-2">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left - Cinematic Hero (~70%) */}
              <div className="lg:col-span-9 lg:-ml-12">
                <div className="relative h-[520px] rounded-[28px] overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop"
                    alt="Tractor on farmland at golden hour"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <button
                    type="button"
                    aria-label="Play video"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur border border-white/30 text-white hover:scale-105 transition-transform"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="ml-1">
                      <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                    </svg>
                  </button>
                  <h2 className="absolute left-6 bottom-6 z-20 max-w-[70%] text-white text-2xl sm:text-3xl md:text-4xl font-semibold">
                    See how we naturally produce our products
                  </h2>
                </div>
              </div>

              {/* Right - Vertical Newsletter Card (~30%) */}
              <div className="lg:col-span-3 flex lg:-mr-12">
                <div className="relative w-full rounded-[28px] overflow-hidden shadow-lg h-[520px]">
                  <img
                    src="/category-images/vegetables.png"
                    alt="Harvest imagery"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50" />
                    <div className="relative z-10 flex h-full flex-col items-center justify-end pb-6 px-6">
                      <p className="text-white text-center text-lg font-semibold mb-4">
                        Subscribe our newsletter to get more offer!
                      </p>
                      <div className="w-full max-w-sm">
                        <div className="flex items-center gap-3">
                          <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 rounded-full px-4 py-3 outline-none bg-white/90 text-slate-900 placeholder:text-slate-500"
                          />
                          <button
                            type="submit"
                            className="h-12 w-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md"
                            aria-label="Subscribe"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-medium text-slate-900 mb-2">
                Bài viết liên quan
              </h2>
              <p className="text-slate-500 font-medium">
                Các bài viết gợi ý phù hợp với bạn
              </p>
            </div>
            <Link
              to="/products"
              className="shrink-0 text-green-600 font-semimedium hover:text-green-700 flex items-center gap-1.5 group"
            >
              Xem sản phẩm
              <FiArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {relatedPosts.map((post) => (
              <article
                key={post.id}
                className="group h-full bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <a href={post.link} target="_blank" rel="noopener noreferrer">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.imageSrc}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </a>

                <div className="p-5 flex min-h-[230px] flex-col">
                  <span className="w-fit rounded-md bg-emerald-50 text-emerald-700 px-1 py-0.5 text-[11px] font-semimedium leading-none mb-3">
                    {post.badge}
                  </span>

                  <h3 className="text-lg font-medium text-slate-900 leading-snug mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">
                    {post.description}
                  </p>

                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto text-green-600 font-semimedium text-sm hover:text-green-700 flex items-center gap-1"
                  >
                    Đọc thêm
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
