import axiosClient from './axiosClient';

const categoryPayload = (data) => {
    const payload = { ...data };
    delete payload.parentId;
    return payload;
};

const categoryService = {
    getTree: () => axiosClient.get('/categories/tree'),
    getFlat: () => axiosClient.get('/categories/flat'),
    getHomeFeatured: () => axiosClient.get('/categories/home-featured'),
    create: (data, imageFile) => {
        const payload = categoryPayload(data);
        if (!imageFile) return axiosClient.post('/categories', payload);

        const formData = new FormData();
        formData.append('category', JSON.stringify(payload));
        formData.append('image', imageFile);
        return axiosClient.post('/categories', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    update: (id, data, imageFile) => {
        const payload = categoryPayload(data);
        if (!imageFile) return axiosClient.put(`/categories/${id}`, payload);

        const formData = new FormData();
        formData.append('category', JSON.stringify(payload));
        formData.append('image', imageFile);
        return axiosClient.put(`/categories/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    delete: (id) => axiosClient.delete(`/categories/${id}`),
    getHistory: (id) => axiosClient.get(`/categories/${id}/history`)
};

export default categoryService;
