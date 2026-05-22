package com.grocery.management.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryImageService {
    private static final String PRODUCT_FOLDER = "grocery/products";
    private static final String AVATAR_FOLDER = "grocery/users/avatars";
    private static final String SUPPLIER_LOGO_FOLDER = "grocery/suppliers/logos";
    private static final String CATEGORY_IMAGE_FOLDER = "grocery/categories";

    private final Cloudinary cloudinary;

    public String uploadProductImage(MultipartFile file) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", PRODUCT_FOLDER, "resource_type", "image"));
        return uploadResult.get("secure_url").toString();
    }

    public String uploadAvatarImage(MultipartFile file) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", AVATAR_FOLDER, "resource_type", "image"));
        return uploadResult.get("secure_url").toString();
    }

    public String uploadSupplierLogo(MultipartFile file) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", SUPPLIER_LOGO_FOLDER, "resource_type", "image"));
        return uploadResult.get("secure_url").toString();
    }

    public String uploadCategoryImage(MultipartFile file) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", CATEGORY_IMAGE_FOLDER, "resource_type", "image"));
        return uploadResult.get("secure_url").toString();
    }

    public void deleteImageByUrl(String imageUrl) {
        String publicId = extractPublicId(imageUrl);
        if (publicId == null) {
            return;
        }

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            System.err.println("Khong the xoa anh Cloudinary: " + e.getMessage());
        }
    }

    private String extractPublicId(String imageUrl) {
        if (imageUrl == null || !imageUrl.contains("res.cloudinary.com") || !imageUrl.contains("/upload/")) {
            return null;
        }

        try {
            String path = URI.create(imageUrl).getPath();
            int uploadIndex = path.indexOf("/upload/");
            if (uploadIndex < 0) {
                return null;
            }

            String publicIdWithExtension = path.substring(uploadIndex + "/upload/".length());
            if (publicIdWithExtension.matches("^v\\d+/.+")) {
                publicIdWithExtension = publicIdWithExtension.substring(publicIdWithExtension.indexOf('/') + 1);
            }

            int dotIndex = publicIdWithExtension.lastIndexOf('.');
            String publicId = dotIndex > 0 ? publicIdWithExtension.substring(0, dotIndex) : publicIdWithExtension;
            return URLDecoder.decode(publicId, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
