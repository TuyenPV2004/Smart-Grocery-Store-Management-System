package com.grocery.management.repository;

import com.grocery.management.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Chỉ lấy danh mục cha (để hiển thị cây)
    List<Category> findByParentIsNull();
    
    // Kiểm tra trùng tên
    boolean existsByName(String name);
    
    // Kiểm tra có con hay không (để chặn xóa)
    boolean existsByParentId(Long parentId);
}