package com.grocery.management.service;

import com.grocery.management.entity.Category;
import com.grocery.management.entity.CategoryHistory;
import com.grocery.management.repository.CategoryHistoryRepository;
import com.grocery.management.repository.CategoryRepository;
import com.grocery.management.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CategoryHistoryRepository categoryHistoryRepository;
    private final CloudinaryImageService cloudinaryImageService;

    public List<Category> getTreeCategories() {
        return categoryRepository.findByParentIsNull();
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<Category> getHomeFeaturedCategories() {
        return categoryRepository.findTop5ByHomeFeaturedTrueOrderByHomeDisplayOrderAscIdAsc();
    }

    public List<CategoryHistory> getHistory(Long categoryId) {
        return categoryHistoryRepository.findByCategoryIdOrderByTimestampDesc(categoryId);
    }

    public Category createCategory(Category category) {
        validateHomeFeaturedLimit(null, category);
        if (categoryRepository.existsByName(category.getName())) {
            throw new RuntimeException("Ten danh muc da ton tai");
        }
        Category saved = categoryRepository.save(category);
        saveHistory(saved.getId(), saved.getName(), "THEM MOI");
        return saved;
    }

    public Category createCategory(Category category, MultipartFile imageFile) throws IOException {
        uploadImageIfPresent(category, imageFile);
        return createCategory(category);
    }

    public Category updateCategory(@NonNull Long id, Category input) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay danh muc"));

        existing.setName(input.getName());
        existing.setSlug(input.getSlug());
        existing.setDescription(input.getDescription());
        existing.setStatus(input.getStatus());
        existing.setParent(input.getParent());
        existing.setLabel(input.getLabel());
        existing.setLabelColor(input.getLabelColor());
        existing.setColor(input.getColor());
        existing.setImageUrl(input.getImageUrl());
        existing.setHomeFeatured(Boolean.TRUE.equals(input.getHomeFeatured()));
        existing.setHomeDisplayOrder(input.getHomeDisplayOrder());
        validateHomeFeaturedLimit(existing.getId(), existing);

        Category saved = categoryRepository.save(existing);
        saveHistory(saved.getId(), saved.getName(), "CAP NHAT");
        return saved;
    }

    public Category updateCategory(@NonNull Long id, Category input, MultipartFile imageFile) throws IOException {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay danh muc"));
        if (imageFile != null && !imageFile.isEmpty()) {
            cloudinaryImageService.deleteImageByUrl(existing.getImageUrl());
            input.setImageUrl(cloudinaryImageService.uploadCategoryImage(imageFile));
        } else if (input.getImageUrl() == null || input.getImageUrl().isBlank()) {
            input.setImageUrl(existing.getImageUrl());
        }
        return updateCategory(id, input);
    }

    @Transactional
    public void deleteCategory(@NonNull Long id) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay danh muc"));

        if (categoryRepository.existsByParentId(id)) {
            throw new RuntimeException("Khong the xoa danh muc nay vi dang chua danh muc con.");
        }
        if (productRepository.existsByLabelsId(id)) {
            throw new RuntimeException("Khong the xoa danh muc nay vi dang co san pham thuoc ve no.");
        }

        saveHistory(existing.getId(), existing.getName(), "XOA");
        categoryRepository.deleteById(id);
    }

    private void saveHistory(Long categoryId, String categoryName, String action) {
        CategoryHistory history = new CategoryHistory();
        history.setCategoryId(categoryId);
        history.setCategoryName(categoryName);
        history.setAction(action);
        history.setPerformedBy("catalog-service");
        history.setRole("SYSTEM");
        history.setTimestamp(LocalDateTime.now());
        categoryHistoryRepository.save(history);
    }

    private void uploadImageIfPresent(Category category, MultipartFile imageFile) throws IOException {
        if (imageFile != null && !imageFile.isEmpty()) {
            category.setImageUrl(cloudinaryImageService.uploadCategoryImage(imageFile));
        }
    }

    private void validateHomeFeaturedLimit(Long currentId, Category category) {
        if (!Boolean.TRUE.equals(category.getHomeFeatured())) {
            return;
        }
        long selectedCount = categoryRepository.countByHomeFeaturedTrue();
        boolean wasAlreadySelected = currentId != null
                && categoryRepository.findById(currentId)
                        .map(existing -> Boolean.TRUE.equals(existing.getHomeFeatured()))
                        .orElse(false);
        if (!wasAlreadySelected && selectedCount >= 5) {
            throw new RuntimeException("Chi duoc chon toi da 5 danh muc hien thi o trang chu");
        }
    }
}
