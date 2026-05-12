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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CategoryHistoryRepository categoryHistoryRepository;

    public List<Category> getTreeCategories() {
        return categoryRepository.findByParentIsNull();
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<CategoryHistory> getHistory(Long categoryId) {
        return categoryHistoryRepository.findByCategoryIdOrderByTimestampDesc(categoryId);
    }

    public Category createCategory(Category category) {
        if (categoryRepository.existsByName(category.getName())) {
            throw new RuntimeException("Ten danh muc da ton tai");
        }
        Category saved = categoryRepository.save(category);
        saveHistory(saved.getId(), saved.getName(), "THEM MOI");
        return saved;
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

        Category saved = categoryRepository.save(existing);
        saveHistory(saved.getId(), saved.getName(), "CAP NHAT");
        return saved;
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
}
