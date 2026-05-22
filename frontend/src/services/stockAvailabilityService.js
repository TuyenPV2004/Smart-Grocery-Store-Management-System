import stockService from "./stockService";
import { keycloak } from "./keycloak";

const normalizeStockSummary = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const buildStockLookup = (summary = []) =>
  summary.reduce((lookup, item) => {
    if (item?.productId != null) lookup.byId.set(String(item.productId), item);
    if (item?.sku) lookup.bySku.set(String(item.sku).toLowerCase(), item);
    return lookup;
  }, { byId: new Map(), bySku: new Map() });

const emptyStockLookup = () => buildStockLookup([]);

const resolveStockItem = (product, lookup) => {
  const productId = product?.id ?? product?.productId;
  const sku = product?.sku ? String(product.sku).toLowerCase() : "";
  return lookup.byId.get(String(productId)) || lookup.bySku.get(sku) || null;
};

export const fetchStockLookup = async () => {
  if (!keycloak.authenticated) {
    return emptyStockLookup();
  }

  const response = await stockService.getSummary();
  return buildStockLookup(normalizeStockSummary(response.data));
};

export const hydrateProductStock = (product, lookup) => {
  const stockItem = resolveStockItem(product, lookup);
  const hasStockQuantity = stockItem?.totalQuantity != null || product?.stockQuantity != null;
  const stockQuantity = hasStockQuantity ? Number(stockItem?.totalQuantity ?? product?.stockQuantity) : undefined;

  return {
    ...product,
    stockQuantity,
    stockStatus: stockItem?.status || product?.stockStatus || product?.status || (hasStockQuantity && stockQuantity <= 0 ? "OUT_OF_STOCK" : "NORMAL"),
    status: stockQuantity > 0 && product?.status === "OUT_OF_STOCK" ? "ACTIVE" : product?.status,
    nearestExpiryDate: stockItem?.nearestExpiryDate || product?.nearestExpiryDate,
  };
};

export const hydrateProductsStock = (products = [], lookup) =>
  products.map((product) => hydrateProductStock(product, lookup));

export const getAvailableStock = (product, lookup) => {
  if (lookup) {
    const stockItem = resolveStockItem(product, lookup);
    if (!stockItem) return 0;
    return Number(stockItem.totalQuantity ?? 0);
  }
  return Number(product?.stockQuantity || 0);
};
