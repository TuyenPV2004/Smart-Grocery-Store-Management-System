import axiosClient from "./axiosClient";

const batchService = {
  /**
   * Get next sequence number for batch code generation
   * @param {string} prefix - Format: {SupplierCode}_{SKU}_{NSX}
   * @returns {Promise} Response with nextSequence and formattedSequence
   */
  getNextSequence: (prefix) => {
    return axiosClient.get("/batches/next-sequence", {
      params: { prefix },
    });
  },

  /**
   * Get all batches with pagination
   * @param {number} page - Page number (default: 0)
   * @param {number} size - Page size (default: 20)
   * @param {string} search - Search keyword (optional)
   */
  getAll: (page = 0, size = 20, search = "") => {
    return axiosClient.get("/batches", {
      params: { page, size, search },
    });
  },

  /**
   * Get batch by ID
   * @param {number} id - Batch ID
   */
  getById: (id) => {
    return axiosClient.get(`/batches/${id}`);
  },

  /**
   * Get batch by batch code
   * @param {string} batchCode - Batch code
   */
  getByCode: (batchCode) => {
    return axiosClient.get(`/batches/code/${batchCode}`);
  },

  /**
   * Delete batch by ID
   * @param {number} id - Batch ID
   */
  deleteBatch: (id) => {
    return axiosClient.delete(`/batches/${id}`);
  },

  /**
   * Get available batches for a product by SKU (FEFO ordered)
   * @param {string} sku - Product SKU
   * @returns {Promise} List of available batches ordered by expiry date
   */
  getBatchesByProductSku: (sku) => {
    return axiosClient.get(`/batches/product/${sku}`);
  },
};

export default batchService;
