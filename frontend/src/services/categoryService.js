import axiosClient from './axiosClient';

const categoryService = {
    getTree: () => axiosClient.get('/categories/tree'),
    getFlat: () => axiosClient.get('/categories/flat'),
    create: (data) => axiosClient.post('/categories', data),
    update: (id, data) => axiosClient.put(`/categories/${id}`, data),
    delete: (id) => axiosClient.delete(`/categories/${id}`),
    getHistory: (id) => axiosClient.get(`/categories/${id}/history`)
};

export default categoryService;