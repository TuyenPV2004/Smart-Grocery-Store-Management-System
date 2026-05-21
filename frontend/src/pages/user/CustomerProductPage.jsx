import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiChevronDown, FiChevronRight, FiSearch, FiSliders, FiX } from "react-icons/fi";
import { FaHome } from "react-icons/fa";
import AppPagination from "../../components/common/AppPagination";
import ProductCard from "../../components/common/ProductCard";
import { Button, EmptyState, PageContainer, PageShell, SurfaceCard } from "../../components/ui";
import categoryService from "../../services/categoryService";
import productService from "../../services/productService";
import { fetchStockLookup, hydrateProductsStock } from "../../services/stockAvailabilityService";

const PRICE_RANGES = [
  { label: "Under 100,000 VND", min: 0, max: 100000 },
  { label: "100,000 - 500,000 VND", min: 100000, max: 500000 },
  { label: "500,000 - 1,000,000 VND", min: 500000, max: 1000000 },
  { label: "Over 1,000,000 VND", min: 1000000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" },
  { value: "name-asc", label: "Name A - Z" },
];

const PRODUCTS_PER_PAGE = 12;

const getEffectivePrice = (product) => {
  let price = product.sellPrice;
  if (product.activePromotion && product.status === "ACTIVE") {
    if (product.activePromotion.discountType === "PERCENTAGE") {
      price -= (price * product.activePromotion.discountValue) / 100;
    } else {
      price -= product.activePromotion.discountValue;
    }
  }
  return Math.max(price || 0, 0);
};

const CustomerProductPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [openParentId, setOpenParentId] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [customMinPrice, setCustomMinPrice] = useState("");
  const [customMaxPrice, setCustomMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const currentCategory = searchParams.get("category");
  const currentSearch = searchParams.get("search") || "";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getTree();
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { status: "ACTIVE", pageSize: 1000 };
        if (currentSearch) params.keyword = currentSearch;
        if (currentCategory) params.categoryId = currentCategory;

        const [res, stockLookup] = await Promise.all([
          productService.getAll(params),
          fetchStockLookup(),
        ]);
        const productList = res.data?.content || res.data || [];
        setProducts(Array.isArray(productList) ? hydrateProductsStock(productList, stockLookup) : []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentCategory, currentSearch]);

  useEffect(() => {
    if (!currentCategory || categories.length === 0) return;

    for (const parent of categories) {
      if (String(parent.id) === currentCategory) {
        setOpenParentId(parent.id);
        return;
      }
      if (parent.children?.some((child) => String(child.id) === currentCategory)) {
        setOpenParentId(parent.id);
        return;
      }
    }
  }, [currentCategory, categories]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    let minPrice = null;
    let maxPrice = null;

    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      minPrice = range.min;
      maxPrice = range.max;
    } else if (customMinPrice || customMaxPrice) {
      minPrice = customMinPrice ? Number(customMinPrice) : 0;
      maxPrice = customMaxPrice ? Number(customMaxPrice) : Infinity;
    }

    if (minPrice !== null) {
      result = result.filter((product) => {
        const price = getEffectivePrice(product);
        return price >= minPrice && price <= maxPrice;
      });
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi"));
    }

    return result;
  }, [products, sortBy, selectedPriceRange, customMinPrice, customMaxPrice]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [currentCategory, currentSearch, sortBy, selectedPriceRange, customMinPrice, customMaxPrice]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleCategorySelect = (categoryId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (categoryId) nextParams.set("category", categoryId);
    else nextParams.delete("category");
    setSearchParams(nextParams);
    setShowFilters(false);
  };

  const findCategoryName = (cats, id) => {
    for (const cat of cats) {
      if (String(cat.id) === id) return cat.name;
      if (cat.children) {
        const found = findCategoryName(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedCategoryName = currentCategory ? findCategoryName(categories, currentCategory) : null;
  const hasActiveFilters = currentCategory || sortBy || selectedPriceRange !== null || customMinPrice || customMaxPrice;

  const clearAllFilters = () => {
    setSortBy("");
    setSelectedPriceRange(null);
    setCustomMinPrice("");
    setCustomMaxPrice("");
    handleCategorySelect(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderCategories = (cats) => (
    <ul className="space-y-1">
      {cats.map((cat) => {
        const hasChildren = cat.children && cat.children.length > 0;
        const isOpen = openParentId === cat.id;
        const isSelected = currentCategory === String(cat.id);

        return (
          <li key={cat.id}>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  handleCategorySelect(cat.id);
                  if (hasChildren) setOpenParentId((prev) => (prev === cat.id ? null : cat.id));
                }}
                className={`min-h-10 flex-1 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                  isSelected ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {cat.name}
              </button>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => setOpenParentId((prev) => (prev === cat.id ? null : cat.id))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-emerald-700"
                  aria-label="Toggle subcategories"
                >
                  {isOpen ? <FiChevronDown size={16} strokeWidth={3} /> : <FiChevronRight size={16} strokeWidth={3} />}
                </button>
              ) : null}
            </div>

            {hasChildren && isOpen ? (
              <ul className="ml-4 mt-1 space-y-1 border-l border-emerald-100 pl-3">
                {cat.children.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(child.id)}
                      className={`min-h-9 w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                        currentCategory === String(child.id)
                          ? "bg-emerald-50 text-emerald-800"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {child.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  const renderFilterContent = () => (
    <div className="space-y-7">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-900">Categories</h3>
          {currentCategory ? (
            <button type="button" onClick={() => handleCategorySelect(null)} className="text-xs font-medium text-rose-600">
              Clear
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            handleCategorySelect(null);
            setOpenParentId(null);
          }}
          className={`mb-1 min-h-10 w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
            !currentCategory ? "bg-emerald-700 text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All products
        </button>
        {renderCategories(categories)}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-900">Sort by</h3>
        <div className="space-y-1">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSortBy(option.value)}
              className={`min-h-10 w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                sortBy === option.value ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-900">Price range</h3>
        <div className="space-y-1">
          {PRICE_RANGES.map((range, index) => (
            <button
              key={range.label}
              type="button"
              onClick={() => {
                setCustomMinPrice("");
                setCustomMaxPrice("");
                setSelectedPriceRange((prev) => (prev === index ? null : index));
              }}
              className={`min-h-10 w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                selectedPriceRange === index ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">Custom range</p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input className="ui-input w-full" type="number" min="0" placeholder="From" value={customMinPrice} onChange={(e) => setCustomMinPrice(e.target.value)} />
            <span className="text-slate-400">-</span>
            <input className="ui-input w-full" type="number" min="0" placeholder="To" value={customMaxPrice} onChange={(e) => setCustomMaxPrice(e.target.value)} />
          </div>
          <Button type="button" className="mt-3 w-full" onClick={() => setSelectedPriceRange(null)}>
            Apply
          </Button>
        </div>
      </div>

      {hasActiveFilters ? (
        <Button type="button" variant="danger" className="w-full" onClick={clearAllFilters}>
          Clear all filters
        </Button>
      ) : null}
    </div>
  );

  return (
    <PageShell className="py-8">
      <PageContainer>
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link to="/" className="flex items-center gap-1.5 text-black hover:text-slate-900">
            <FaHome className="text-emerald-700" size={16} />
            Home
          </Link>
          <span className="font-semibold text-black">&gt;</span>
          <span className="text-emerald-700">Products</span>
        </div>

        {hasActiveFilters ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {currentCategory ? (
              <FilterChip label={selectedCategoryName || "Category"} onRemove={() => handleCategorySelect(null)} />
            ) : null}
            {sortBy ? (
              <FilterChip label={SORT_OPTIONS.find((option) => option.value === sortBy)?.label} onRemove={() => setSortBy("")} />
            ) : null}
            {selectedPriceRange !== null || customMinPrice || customMaxPrice ? (
              <FilterChip
                label={
                  selectedPriceRange !== null
                    ? PRICE_RANGES[selectedPriceRange].label
                    : `${customMinPrice || "0"} VND - ${customMaxPrice || "up"} VND`
                }
                onRemove={() => {
                  setSelectedPriceRange(null);
                  setCustomMinPrice("");
                  setCustomMaxPrice("");
                }}
              />
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden md:block">
            <SurfaceCard className="scrollbar-hide sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto p-5">
              {renderFilterContent()}
            </SurfaceCard>
          </aside>

          {showFilters ? (
            <div className="fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-sm md:hidden" onClick={() => setShowFilters(false)}>
              <div className="scrollbar-hide absolute right-0 top-0 h-full w-[min(88vw,360px)] overflow-y-auto bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-slate-900">Filters</h2>
                  <button type="button" onClick={() => setShowFilters(false)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100" aria-label="Close filters">
                    <FiX size={18} />
                  </button>
                </div>
                {renderFilterContent()}
              </div>
            </div>
          ) : null}

          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              {!loading ? (
                <p className="text-sm font-medium text-slate-500">
                  Showing <span className="text-slate-900">{filteredProducts.length}</span> products
                </p>
              ) : (
                <div />
              )}
              <Button type="button" variant="secondary" className="md:hidden shrink-0" onClick={() => setShowFilters(true)}>
                <FiSliders size={17} />
                Filters
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-[320px] animate-pulse rounded-[1.5rem] bg-white/70" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {filteredProducts.length > PRODUCTS_PER_PAGE ? (
                  <AppPagination
                    currentPage={currentPage - 1}
                    pageCount={totalPages}
                    onPageChange={handlePageChange}
                    pageRangeDisplayed={4}
                    marginPagesDisplayed={1}
                  />
                ) : null}
              </>
            ) : (
              <EmptyState
                icon={FiSearch}
                title="No products found"
                description="Try changing the category, price range, or search keyword."
                action={
                  hasActiveFilters ? (
                    <Button type="button" onClick={clearAllFilters}>Clear filters</Button>
                  ) : null
                }
              />
            )}
          </section>
        </div>
      </PageContainer>
    </PageShell>
  );
};

const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
    {label}
    <button type="button" onClick={onRemove} className="rounded-full text-emerald-700 hover:text-emerald-950" aria-label="Remove filter">
      <FiX size={14} />
    </button>
  </span>
);

export default CustomerProductPage;
