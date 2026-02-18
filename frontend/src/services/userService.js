// frontend/src/services/userService.js
import axiosClient from './axiosClient';

/**
 * Service xử lý các nghiệp vụ liên quan đến người dùng và nhân sự
 */
const userService = {
    /**
     * Lấy danh sách toàn bộ người dùng
     */
    getAllUsers: () => {
        return axiosClient.get('/users');
    },

    /**
     * Tìm kiếm người dùng thông qua Mã nhân viên (Staff Code)
     * Dùng cho tính năng kiểm tra nhân viên khi lập phiếu nhập/xuất kho
     */
    getUserByStaffCode: (staffCode) => {
        return axiosClient.get(`/users/code/${staffCode}`);
    },

    /**
     * Tạo mới người dùng (Admin tạo nhân viên)
     */
    createUser: (userData) => {
        return axiosClient.post('/users', userData);
    },

    /**
     * Cập nhật thông tin người dùng theo ID
     */
    updateUser: (id, userData) => {
        return axiosClient.put(`/users/${id}`, userData);
    },

    /**
     * Xóa người dùng khỏi hệ thống
     */
    deleteUser: (id) => {
        return axiosClient.delete(`/users/${id}`);
    },

    /**
     * Lấy thông tin hồ sơ của người dùng đang đăng nhập
     */
    getProfile: () => {
        return axiosClient.get('/users/profile');
    },

    /**
     * Cập nhật thông tin cá nhân (FullName, Phone, Address...)
     */
    updateProfile: (data) => {
        return axiosClient.put('/users/profile', data);
    },

    /**
     * Đổi mật khẩu tài khoản
     */
    changePassword: (data) => {
        return axiosClient.put('/users/change-password', data);
    },

    /**
     * Cập nhật trạng thái tài khoản (ACTIVE/INACTIVE)
     */
    updateStatus: (id, status) => {
        return axiosClient.put(`/users/${id}/status`, null, {
            params: { status }
        });
    },

    /**
     * Cập nhật vai trò người dùng (ADMIN/STAFF/CUSTOMER)
     */
    updateRole: (id, role) => {
        return axiosClient.put(`/users/${id}/role`, null, { 
            params: { role } 
        });
    },

    /**
     * Upload ảnh đại diện người dùng
     */
    uploadAvatar: (formData) => {
        return axiosClient.post('/users/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    /**
     * Đăng ký tài khoản khách hàng mới
     */
    register: (data) => {
        return axiosClient.post('/auth/register', data);
    },

    /**
     * Xác thực tài khoản qua mã OTP
     */
    verifyOtp: (data) => {
        return axiosClient.post('/auth/verify-otp', data);
    },

    /**
     * Gửi yêu cầu quên mật khẩu
     */
    forgotPassword: (email) => {
        return axiosClient.post('/auth/forgot-password', { email });
    },

    /**
     * Đặt lại mật khẩu mới sau khi xác thực OTP thành công
     */
    resetPassword: (data) => {
        return axiosClient.post('/auth/reset-password', data);
    },
};

export default userService;