import axiosClient from './axiosClient';

const supplierService = {
  getAll: () => axiosClient.get('/suppliers'),
  create: (data) => axiosClient.post('/suppliers', data),
  update: (id, data) => axiosClient.put(`/suppliers/${id}`, data),
  toggleStatus: (id) => axiosClient.patch(`/suppliers/${id}/status`)
};

export default supplierService;