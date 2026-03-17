import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import ProductCard from "../../components/common/ProductCard";

// Banner thứ 2 dưới Features Section
const HOMEPAGE_BANNER_URL =
  "/category-images/web-banner-featuring-organic-vegetables-from-a-farm-supermarket_63353.jpg";

const toSvgDataUri = (svg) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const CATEGORY_ILLUSTRATIONS = {
  vegetables: toSvgDataUri(`
    <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="124" cy="156" rx="78" ry="15" fill="rgba(15,23,42,0.14)"/>
      <path d="M82 132C86 108 100 84 118 68C137 84 152 108 157 132H82Z" fill="#2E7D32"/>
      <path d="M70 132C74 103 90 78 112 60C126 73 137 95 140 132H70Z" fill="#4CAF50"/>
      <path d="M110 128C110 108 115 88 122 71C129 88 134 108 134 128H110Z" fill="#81C784"/>
      <path d="M145 140C143 122 149 101 163 89C175 104 181 122 182 140H145Z" fill="#66BB6A"/>
      <path d="M50 145C52 121 60 104 75 95C84 108 88 126 86 145H50Z" fill="#7CB342"/>
      <path d="M160 65C160 55 166 48 174 44C174 54 170 61 160 65Z" fill="#8BC34A"/>
      <path d="M175 69C172 58 176 49 184 43C187 54 184 64 175 69Z" fill="#AED581"/>
      <path d="M176 143C177 120 185 99 202 85C212 104 214 124 209 143H176Z" fill="#F57C00"/>
      <path d="M192 143C191 115 188 93 183 78" stroke="#2E7D32" stroke-width="5" stroke-linecap="round"/>
    </svg>
  `),
  fruits: toSvgDataUri(`
    <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="122" cy="156" rx="82" ry="15" fill="rgba(15,23,42,0.14)"/>
      <circle cx="86" cy="110" r="30" fill="#FF7043"/>
      <circle cx="124" cy="104" r="36" fill="#FFCA28"/>
      <circle cx="166" cy="112" r="28" fill="#8BC34A"/>
      <path d="M88 79C85 68 89 58 99 52C101 64 97 73 88 79Z" fill="#2E7D32"/>
      <path d="M122 66C120 52 127 42 140 38C141 52 136 61 122 66Z" fill="#43A047"/>
      <path d="M162 83C156 71 158 60 168 53C172 65 171 76 162 83Z" fill="#4CAF50"/>
      <circle cx="145" cy="132" r="12" fill="#7E57C2"/>
      <circle cx="158" cy="122" r="12" fill="#8E24AA"/>
      <circle cx="171" cy="132" r="12" fill="#6A1B9A"/>
      <circle cx="158" cy="145" r="12" fill="#7B1FA2"/>
      <path d="M158 118C156 111 158 105 164 100" stroke="#4E342E" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `),
  meat: toSvgDataUri(`
    <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="122" cy="155" rx="78" ry="14" fill="rgba(15,23,42,0.14)"/>
      <path d="M72 138C54 118 57 84 84 70C102 61 119 63 133 74C152 61 177 62 191 81C205 100 203 128 184 142C164 156 138 156 121 144C103 154 84 152 72 138Z" fill="#C62828"/>
      <path d="M94 130C83 118 85 98 99 88C109 81 121 80 130 86C141 78 155 80 164 90C174 101 173 119 160 130C147 141 130 141 120 133C109 140 100 137 94 130Z" fill="#FFCDD2"/>
      <path d="M160 78C166 67 177 60 192 60C189 73 180 82 160 78Z" fill="#8D6E63"/>
      <circle cx="168" cy="71" r="12" fill="#FFF3E0"/>
      <circle cx="168" cy="71" r="5" fill="#D7CCC8"/>
    </svg>
  `),
  seafood: toSvgDataUri(`
    <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="121" cy="156" rx="80" ry="14" fill="rgba(15,23,42,0.14)"/>
      <path d="M65 111C84 87 114 79 145 88C164 94 179 106 189 121C176 134 161 142 143 145C109 151 79 141 65 111Z" fill="#29B6F6"/>
      <path d="M186 121L214 98V144L186 121Z" fill="#0288D1"/>
      <path d="M88 114C95 101 111 96 124 101C114 109 101 116 88 114Z" fill="#B3E5FC"/>
      <circle cx="154" cy="108" r="4" fill="#0F172A"/>
      <path d="M52 136C55 120 66 108 82 103C79 118 70 132 52 136Z" fill="#26C6DA"/>
      <path d="M55 135C68 128 77 130 88 141" stroke="#0EA5E9" stroke-width="6" stroke-linecap="round"/>
    </svg>
  `),
  nuts: toSvgDataUri(`
    <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="121" cy="156" rx="80" ry="14" fill="rgba(15,23,42,0.14)"/>
      <path d="M83 139C68 126 68 102 83 88C97 75 117 78 129 92C141 78 162 76 176 90C190 104 189 128 174 140C160 152 141 152 129 142C116 151 96 150 83 139Z" fill="#8D4E2C"/>
      <path d="M93 132C83 123 83 108 92 99C102 90 117 92 126 101C136 91 152 91 161 100C170 109 170 124 161 132C151 141 136 141 127 133C117 141 102 141 93 132Z" fill="#B56A3B"/>
      <path d="M109 82C106 72 110 64 119 58C120 69 117 77 109 82Z" fill="#6D4C41"/>
      <path d="M145 85C143 74 148 66 157 61C159 72 155 80 145 85Z" fill="#795548"/>
    </svg>
  `),
  dairy: toSvgDataUri(`
    <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="121" cy="156" rx="82" ry="14" fill="rgba(15,23,42,0.14)"/>
      <path d="M95 69H138L148 96V146H85V96L95 69Z" fill="#FFFFFF"/>
      <path d="M95 69H138L144 83H89L95 69Z" fill="#C5E1A5"/>
      <rect x="100" y="101" width="34" height="25" rx="12.5" fill="#DCEDC8"/>
      <path d="M156 113L184 98L198 112V144H150L156 113Z" fill="#FFE082"/>
      <circle cx="168" cy="122" r="4" fill="#F9A825"/>
      <circle cx="180" cy="132" r="4" fill="#F9A825"/>
      <path d="M168 98C168 84 175 75 186 69C188 83 183 93 168 98Z" fill="#AED581"/>
    </svg>
  `),
};

const CATEGORY_PRESETS = [
  {
    key: "milk",
    title: "Sữa",
    subtitle: "Dinh dưỡng mỗi ngày",
    exactNames: ["sua"],
    match: ["sua", "milk", "dairy"],
    gradient: "from-green-600 via-lime-400 to-lime-300",
    glow: "from-white/40 via-white/20 to-white/0",
    illustration: CATEGORY_ILLUSTRATIONS.dairy,
  },
  {
    key: "protein-seafood",
    title: "Thịt, trứng, hải sản",
    subtitle: "Tươi ngon giàu đạm",
    exactNames: ["thit, trung, hai san"],
    match: ["thit", "trung", "hai san", "seafood", "meat"],
    gradient: "from-red-700 via-rose-500 to-orange-400",
    glow: "from-white/35 via-white/16 to-white/0",
    illustration: CATEGORY_ILLUSTRATIONS.meat,
  },
  {
    key: "produce",
    title: "Rau, củ, nấm, trái cây",
    subtitle: "Tươi xanh mỗi ngày",
    exactNames: ["rau, cu, nam, trai cay"],
    match: ["rau", "cu", "nam", "trai cay", "hoa qua", "vegetable"],
    gradient: "from-sky-600 via-cyan-500 to-teal-400",
    glow: "from-white/40 via-white/18 to-white/0",
    illustration: CATEGORY_ILLUSTRATIONS.vegetables,
  },
  {
    key: "ice-cream-yogurt",
    title: "Kem, sữa chua",
    subtitle: "Mát lạnh thơm béo",
    exactNames: ["kem, sua chua"],
    match: ["kem", "sua chua", "yogurt", "ice cream"],
    gradient: "from-lime-500 via-green-400 to-emerald-300",
    glow: "from-white/45 via-white/20 to-white/0",
    illustration: CATEGORY_ILLUSTRATIONS.dairy,
  },
  {
    key: "instant-noodles",
    title: "Mì gói",
    subtitle: "Nhanh gọn tiện lợi",
    exactNames: ["mi goi"],
    match: ["mi goi", "instant noodle", "noodle", "ramen"],
    gradient: "from-red-600 via-orange-500 to-amber-400",
    glow: "from-white/35 via-white/15 to-white/0",
    illustration: CATEGORY_ILLUSTRATIONS.nuts,
  },
  {
    key: "beverages",
    title: "Bia, nước giải khát",
    subtitle: "Giải nhiệt sảng khoái",
    exactNames: ["bia, nuoc giai khat"],
    match: ["bia", "nuoc giai khat", "drink", "beverage", "soft drink"],
    gradient: "from-blue-700 via-blue-500 to-sky-400",
    glow: "from-white/38 via-white/18 to-white/0",
    illustration: CATEGORY_ILLUSTRATIONS.seafood,
  },
];
const CATEGORY_IMAGE_OVERRIDES = {
  milk: "/category-images/milk.png",
  "protein-seafood": "/category-images/meat.png",
  produce: "/category-images/vegetables.png",
  "ice-cream-yogurt": "/category-images/yogurt.png",
  "instant-noodles": "/category-images/noodles.png",
  beverages: "/category-images/drink.png",
};

const normalizeCategoryName = (name = "") =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getCategoryPreset = (name, index) => {
  const normalizedName = normalizeCategoryName(name);
  const exactPreset = CATEGORY_PRESETS.find((item) =>
    item.exactNames?.includes(normalizedName),
  );

  const keywordPreset = CATEGORY_PRESETS.find((item) =>
    item.match.some((keyword) => normalizedName.includes(keyword)),
  );

  const preset =
    exactPreset ||
    keywordPreset ||
    CATEGORY_PRESETS[index % CATEGORY_PRESETS.length];

  return {
    ...preset,
    imageSrc: CATEGORY_IMAGE_OVERRIDES[preset.key] || preset.illustration,
  };
};

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const popularCategories =
    categories.length > 0
      ? categories.slice(0, 6).map((category, index) => {
          const preset = getCategoryPreset(category.name, index);

          return {
            id: category.id,
            name: category.name,
            subtitle: preset.subtitle,
            gradient: preset.gradient,
            glow: preset.glow,
            imageSrc: preset.imageSrc,
            link: `/products?category=${category.id}`,
          };
        })
      : CATEGORY_PRESETS.map((preset) => ({
          id: `fallback-${preset.key}`,
          name: preset.title,
          subtitle: preset.subtitle,
          gradient: preset.gradient,
          glow: preset.glow,
          imageSrc: CATEGORY_IMAGE_OVERRIDES[preset.key] || preset.illustration,
          link: "/products",
        }));

  const articleTemplates = [
    {
      badge: "Mẹo mua sắm",
      titlePrefix: "Cách chọn",
      description:
        "Bí quyết nhận biết sản phẩm tươi ngon, an toàn cho cả gia đình khi đi chợ online.",
    },
    {
      badge: "Bảo quản",
      titlePrefix: "Bảo quản",
      description:
        "Hướng dẫn lưu trữ đúng cách để giữ hương vị, dinh dưỡng và kéo dài độ tươi của thực phẩm.",
    },
    {
      badge: "Gợi ý món ăn",
      titlePrefix: "Thực đơn nhanh với",
      description:
        "Gợi ý món ngon dễ làm từ các sản phẩm đang bán, phù hợp cho bữa cơm bận rộn mỗi ngày.",
    },
    {
      badge: "Ưu đãi",
      titlePrefix: "Mua",
      description:
        "Cách kết hợp combo thông minh để tối ưu chi phí mà vẫn đầy đủ nhóm thực phẩm cần thiết.",
    },
  ];
  const RELATED_POST_URLS = [
    "https://www.avakids.com/me-va-be/cach-chon-sua-cong-thuc-phu-hop-cho-tre-1443302",
    "https://giadinh.suckhoedoisong.vn/5-meo-bao-quan-hai-san-tuoi-lau-khong-bi-mat-vi-172250312155805609.htm",
    "https://www.bachhoaxanh.com/kinh-nghiem-hay/thuc-don-giam-can-7-ngay-tu-rau-cu-qua-ma-chi-em-nao-cung-me-1329736",
    "https://www.avakids.com/me-va-be/cach-lam-kem-sua-chua-1508028",
    "https://www.bachhoaxanh.com/kinh-nghiem-hay/15-cach-lam-mi-tron-hao-hao-de-lam-sieu-ngon-tai-nha-1578703",
    "https://petal.vn/huong-dan-bao-quan-nuoc-uong-tai-gia-dinh-tot-nhat/",
    "http://winmilk.com.vn/tin-tuc/4-mon-an-dinh-duong-de-lam-tu-sua-cho-ca-gia-dinh-4.html",
    "https://www.bachhoaxanh.com/kinh-nghiem-hay/cach-lua-chon-hai-san-tuoi-ngon-chat-luong-va-an-toan-1112991",
  ];
  const RELATED_POST_READ_MORE_URLS = [
    "https://www.avakids.com/me-va-be/cach-chon-sua-cong-thuc-phu-hop-cho-tre-1443302",
    "https://giadinh.suckhoedoisong.vn/5-meo-bao-quan-hai-san-tuoi-lau-khong-bi-mat-vi-172250312155805609.htm",
    "https://www.bachhoaxanh.com/kinh-nghiem-hay/thuc-don-giam-can-7-ngay-tu-rau-cu-qua-ma-chi-em-nao-cung-me-1329736",
    "https://www.avakids.com/me-va-be/cach-lam-kem-sua-chua-1508028",
    "https://www.bachhoaxanh.com/kinh-nghiem-hay/15-cach-lam-mi-tron-hao-hao-de-lam-sieu-ngon-tai-nha-1578703",
    "https://petal.vn/huong-dan-bao-quan-nuoc-uong-tai-gia-dinh-tot-nhat/",
    "http://winmilk.com.vn/tin-tuc/4-mon-an-dinh-duong-de-lam-tu-sua-cho-ca-gia-dinh-4.html",
    "https://www.bachhoaxanh.com/kinh-nghiem-hay/cach-lua-chon-hai-san-tuoi-ngon-chat-luong-va-an-toan-1112991",
  ];

  const RELATED_POST_IMAGES = [
    "https://cdn.tgdd.vn//News/1443302//cach-chon-sua-cong-thuc-phu-hop-cho-tre-3-845x479.jpg",
    "https://giadinh.mediacdn.vn/thumb_w/640/296230595582509056/2025/3/18/hs3-17422715838861107342096.jpg",
    "https://cdn.tgdd.vn/Files/2021/02/23/1329736/thuc-don-giam-can-7-ngay-tu-rau-cu-qua-ma-chi-em-nao-cung-me-202112301215164181.jpg",
    "https://cdn.tgdd.vn//News/1508028//cach-lam-kem-sua-chua-dau-800x564.jpg",
    "https://cdnv2.tgdd.vn/bhx-static/bhx/News/Images/2025/06/07/1578703/image10_202506071739360428.jpg",
    "https://petal.vn/wp-content/uploads/2021/04/nuoc-tinh-khiet.jpg",
    "http://winmilk.com.vn/upload/images/pexels-joshsorenson-990439.jpg",
    "https://cdn.tgdd.vn/Files/2018/12/22/1139752/tuyet-chieu-chon-hai-san-tuoi-ngon-cho-chi-em-3_700x450.jpg",
  ];

  const relatedPosts = Array.from({ length: 8 }, (_, index) => {
    const category = popularCategories[index % popularCategories.length];
    const template = articleTemplates[index % articleTemplates.length];
    const categorySlug = normalizeCategoryName(category?.name || "san-pham")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const articleSlug = `${categorySlug || "san-pham"}-tips-${index + 1}`;
    const fallbackLink = `${category.link}${category.link.includes("?") ? "&" : "?"}article=${articleSlug}`;
    const customLink = RELATED_POST_URLS[index]?.trim();
    const articleLink = customLink || fallbackLink;
    const customImage = RELATED_POST_IMAGES[index]?.trim();
    const postImage = customImage || category.imageSrc;
    const readMoreUrl = RELATED_POST_READ_MORE_URLS[index]?.trim() || "";

    return {
      id: `post-${category.id}-${index}`,
      badge: template.badge,
      title: `${template.titlePrefix} ${category.name}`,
      description: template.description,
      imageSrc: postImage,
      link: articleLink,
      readMoreUrl,
      readTime: template.readTime,
    };
  });

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
    <div className="font-poppins min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-emerald-100">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-emerald-800 text-white overflow-hidden rounded-b-[3rem] shadow-xl mb-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Chào mừng đến với Grocery Store
            </span>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Thực phẩm tươi ngon <br />
              <span className="text-green-300">Giao ngay tận nhà</span>
            </h1>
            <p className="text-lg text-green-50 mb-10 max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              Chúng tôi cam kết cung cấp các sản phẩm hữu cơ, tươi sống và an
              toàn vệ sinh thực phẩm cho gia đình bạn mỗi ngày.
            </p>
            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Link
                to="/products"
                className="bg-white text-green-700 font-bold px-8 py-4 rounded-2xl hover:bg-green-50 transition-all shadow-lg shadow-green-900/20 active:scale-95 flex items-center gap-2"
              >
                Mua sắm ngay
              </Link>
              <button className="bg-transparent border-2 border-white/30 text-white font-medium px-8 py-4 rounded-2xl hover:bg-white/10 transition-all active:scale-95">
                Xem khuyến mãi
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 space-y-20 pb-20">
        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-8 -mt-24 relative z-20">
          {[
            {
              icon: Truck,
              title: "Giao hàng miễn phí",
              desc: "Cho đơn hàng trên 500k",
            },
            {
              icon: ShieldCheck,
              title: "Đảm bảo chất lượng",
              desc: "Hoàn tiền nếu không hài lòng",
            },
            {
              icon: Headphones,
              title: "Hỗ trợ 24/7",
              desc: "Luôn sẵn sàng tư vấn",
            },
            {
              icon: ShoppingBag,
              title: "Thanh toán an toàn",
              desc: "Đa dạng phương thức",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4">
                <item.icon size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">
                {item.title}
              </h3>
              <p className="text-slate-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Nhóm Banner, Categories và Products để giảm khoảng cách */}
        <div className="space-y-6 md:space-y-8">
          {/* Banner Promo (Banner #2 bên dưới Features, trên danh mục) */}
          <section className="transition-all duration-300">
            <Link to="/products" className="block w-full">
              <img
                src={
                  "/category-images/web-banner-featuring-organic-vegetables-from-a-farm-supermarket_63353.jpg"
                }
                alt="Promo Banner"
                className="w-full h-auto drop-shadow-md rounded-[2rem] hover:scale-[1.02] transition-transform duration-500"
              />
            </Link>
          </section>

          {/* Categories Section */}
          <section>
            <div className="flex items-end justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Danh mục sản phẩm
                </h2>
              </div>
              <Link
                to="/products"
                className="shrink-0 text-green-600 font-semibold hover:text-green-700 flex items-center gap-1.5 group"
              >
                Xem tất cả
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>

            <div className="-mx-6 px-6 overflow-x-auto pb-4 md:mx-0 md:px-0 md:overflow-visible md:pb-0">
              <div className="grid grid-flow-col auto-cols-[minmax(210px,210px)] gap-5 md:grid-flow-row md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 md:auto-cols-auto">
                {popularCategories.map((category) => (
                  <Link
                    to={category.link}
                    key={category.id}
                    className="group cursor-pointer"
                  >
                    <article
                      className={`relative h-[220px] overflow-hidden rounded-[2rem] bg-gradient-to-b ${category.gradient} p-4 shadow-[0_16px_34px_rgba(15,23,42,0.10)] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_22px_42px_rgba(15,23,42,0.14)]`}
                    >
                      <div
                        className={`absolute inset-x-5 top-4 h-20 rounded-full bg-gradient-to-r ${category.glow} blur-2xl`}
                      />
                      <div className="relative z-10 flex h-full flex-col items-center text-center">
                        <div className="pt-2">
                          <p className="text-xl font-bold tracking-tight text-white">
                            {category.name}
                          </p>
                          <p className="mt-1 text-xs font-medium text-white/80">
                            {category.subtitle}
                          </p>
                        </div>

                        <div className="relative mt-auto flex w-full items-end justify-center">
                          <div className="absolute bottom-2 h-16 w-[76%] rounded-full bg-black/10 blur-xl transition-transform duration-500 group-hover:scale-110" />
                          <img
                            src={category.imageSrc}
                            alt={category.name}
                            className="relative z-10 h-[132px] w-full translate-y-2 object-contain drop-shadow-[0_18px_24px_rgba(15,23,42,0.18)] transition-transform duration-500 group-hover:scale-[1.06] group-hover:translate-y-1"
                          />
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-400 md:hidden">
              <span>Kéo ngang để xem thêm</span>
              <ArrowRight size={16} />
            </div>
          </section>

          {/* Banner Promo gốc (Banner #1 giữa danh mục và sản phẩm) */}
          <section className="transition-all duration-300">
            <Link to="/products" className="block w-full">
              <img
                src="https://ticketbox.vn/_next/image?url=https%3A%2F%2Fsalt.tkbcdn.com%2Fts%2Fds%2F8e%2F26%2F03%2F13d8763392c25ed2368b25912c5f7eb9.png&w=1920&q=75"
                alt="Promo Banner"
                className="w-full h-auto drop-shadow-md rounded-[2rem] hover:scale-[1.02] transition-transform duration-500"
              />
            </Link>
          </section>

          {/* Featured Products */}
          <section>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Gợi ý cho bạn
                </h2>
              </div>
              <Link
                to="/products"
                className="text-green-600 font-medium hover:text-green-700 flex items-center gap-1 group"
              >
                Xem tất cả sản phẩm
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
                    ></div>
                  ))}
            </div>
          </section>
        </div>

        {/* Newsletter */}
        <section className="bg-green-50 rounded-[3rem] px-8 py-8 md:px-12 md:py-10 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Đăng ký nhận tin
            </h2>
            <p className="text-slate-500 mb-8">
              Nhận thông báo về các sản phẩm mới và khuyến mãi đặc biệt sớm
              nhất.
            </p>
            <form className="flex gap-3 bg-white p-2 rounded-2xl shadow-xl shadow-green-900/5 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-4 py-3 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">
                Đăng ký
              </button>
            </form>
          </div>
        </section>

        {/* Related Posts */}
        <section>
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Bài viết liên quan
              </h2>
              <p className="text-slate-500 font-medium">
                8 bài viết gợi ý từ các nhóm sản phẩm bạn đang bán
              </p>
            </div>
            <Link
              to="/products"
              className="shrink-0 text-green-600 font-semibold hover:text-green-700 flex items-center gap-1.5 group"
            >
              Xem sản phẩm
              <ArrowRight
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
                <Link to={post.link} className="block">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.imageSrc}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </Link>

                <div className="p-5 flex min-h-[240px] flex-col">
                  <span className="w-fit rounded-md bg-emerald-50 text-emerald-700 px-1 py-0.5 text-[11px] font-semibold leading-none mb-3">
                    {post.badge}
                  </span>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">
                    {post.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      {post.readTime}
                    </span>
                    {post.readMoreUrl ? (
                      <a
                        href={post.readMoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 font-semibold text-sm hover:text-green-700 flex items-center gap-1"
                      >
                        Đọc thêm
                      </a>
                    ) : (
                      <Link
                        to={post.link}
                        className="text-green-600 font-semibold text-sm hover:text-green-700 flex items-center gap-1"
                      >
                        Đọc thêm
                      </Link>
                    )}
                  </div>
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
