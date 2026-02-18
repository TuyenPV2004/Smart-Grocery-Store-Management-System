package com.grocery.management.service;

import com.grocery.management.entity.Category;
import com.grocery.management.entity.CategoryHistory;
import com.grocery.management.entity.User; // Import User
import com.grocery.management.repository.CategoryRepository;
import com.grocery.management.repository.CategoryHistoryRepository;
import com.grocery.management.repository.ProductRepository;
import com.grocery.management.repository.UserRepository; // Import UserRepository
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CategoryHistoryRepository categoryHistoryRepository;
    private final UserRepository userRepository; // Inject thêm để lấy Fullname

    public List<Category> getTreeCategories() {
        return categoryRepository.findByParentIsNull();
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // Lấy lịch sử thay đổi của một danh mục
    public List<CategoryHistory> getHistory(Long categoryId) {
        return categoryHistoryRepository.findByCategoryIdOrderByTimestampDesc(categoryId);
    }

    public Category createCategory(Category category) {
        if (categoryRepository.existsByName(category.getName())) {
            throw new RuntimeException("Tên danh mục đã tồn tại");
        }
        Category saved = categoryRepository.save(category);
        
        // Ghi lịch sử hành động thêm mới
        saveHistory(saved.getId(), saved.getName(), "THÊM MỚI");
        
        return saved;
    }

    public Category updateCategory(@NonNull Long id, Category input) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));
        
        existing.setName(input.getName());
        existing.setSlug(input.getSlug());
        existing.setDescription(input.getDescription());
        existing.setStatus(input.getStatus());
        existing.setParent(input.getParent());
        
        // Cập nhật nhãn và màu sắc (màu hiện tại có thể là mã Hex hoặc tên màu từ frontend)
        existing.setLabel(input.getLabel());
        existing.setLabelColor(input.getLabelColor());
        
        Category saved = categoryRepository.save(existing);

        // Ghi lịch sử hành động cập nhật
        saveHistory(saved.getId(), saved.getName(), "CẬP NHẬT");

        return saved;
    }

    public void deleteCategory(@NonNull Long id) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        if (categoryRepository.existsByParentId(id)) {
            throw new RuntimeException("Không thể xóa danh mục này vì đang chứa danh mục con.");
        }
        if (productRepository.existsByCategoryId(id)) {
            throw new RuntimeException("Không thể xóa danh mục này vì đang có sản phẩm thuộc về nó.");
        }
        
        // Lưu lịch sử trước khi thực hiện xóa
        saveHistory(existing.getId(), existing.getName(), "XÓA");

        categoryRepository.deleteById(id);
    }

    /**
     * Helper lưu lịch sử chi tiết: Lấy FullName từ Database và Role từ SecurityContext
     */
    /**
     * Helper lưu lịch sử chi tiết: Lấy FullName từ Database và Role từ SecurityContext
     */
    private void saveHistory(Long catId, String catName, String action) {
        try {
            String username = "Unknown";
            String fullName = "Unknown User";
            String role = "UNKNOWN";

            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                username = auth.getName(); // Trả về "admin"
                
                // 1. Lấy Role
                if (!auth.getAuthorities().isEmpty()) {
                    role = auth.getAuthorities().iterator().next().getAuthority(); 
                }

                // 2. SỬA Ở ĐÂY: Tìm bằng findByUsername thay vì findByEmail
                User user = userRepository.findByUsername(username).orElse(null);
                
                if (user != null) {
                    fullName = user.getFullName(); // Lấy được "Administrator"
                } else {
                    // Fallback thử tìm bằng email nếu username thất bại (tùy chọn)
                    user = userRepository.findByEmail(username).orElse(null);
                    fullName = (user != null) ? user.getFullName() : username;
                }
            }

            CategoryHistory history = new CategoryHistory();
            history.setCategoryId(catId);
            history.setCategoryName(catName);
            history.setAction(action);
            history.setPerformedBy(fullName); 
            history.setRole(role);            
            history.setTimestamp(LocalDateTime.now());
            
            categoryHistoryRepository.save(history);
        } catch (Exception e) {
            System.err.println("Lỗi lưu lịch sử danh mục: " + e.getMessage());
        }
    }
}