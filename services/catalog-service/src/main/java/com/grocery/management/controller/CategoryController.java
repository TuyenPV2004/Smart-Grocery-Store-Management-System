package com.grocery.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grocery.management.entity.Category;
import com.grocery.management.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.grocery.management.entity.CategoryHistory;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping("/tree")
    public ResponseEntity<List<Category>> getTree() {
        return ResponseEntity.ok(categoryService.getTreeCategories());
    }

    @GetMapping("/flat")
    public ResponseEntity<List<Category>> getFlat() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/home-featured")
    public ResponseEntity<List<Category>> getHomeFeatured() {
        return ResponseEntity.ok(categoryService.getHomeFeaturedCategories());
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> create(@RequestBody Category category) {
        try {
            return ResponseEntity.ok(categoryService.createCategory(category));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @RequestParam("category") String categoryJson,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        try {
            Category category = new ObjectMapper().readValue(categoryJson, Category.class);
            return ResponseEntity.ok(categoryService.createCategory(category, image));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Category category) {
        try {
            if (id == null) {
                return ResponseEntity.badRequest().body("ID cannot be null");
            }
            return ResponseEntity.ok(categoryService.updateCategory(id, category));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam("category") String categoryJson,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        try {
            if (id == null) {
                return ResponseEntity.badRequest().body("ID cannot be null");
            }
            Category category = new ObjectMapper().readValue(categoryJson, Category.class);
            return ResponseEntity.ok(categoryService.updateCategory(id, category, image));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            if (id == null) {
                return ResponseEntity.badRequest().body("ID cannot be null");
            }
            categoryService.deleteCategory(id);
            return ResponseEntity.ok("Xóa thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/{id}/history")
    public ResponseEntity<List<CategoryHistory>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getHistory(id));
    }
}
