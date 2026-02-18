package com.grocery.management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.lang.NonNull;

@Configuration
public class MvcConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        exposeDirectory("user-photos", registry);
        exposeDirectory("product-images", registry);
    }

    private void exposeDirectory(String dirName, ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get(dirName);
        // Sửa đoạn này: Sử dụng toUri().toString() để đảm bảo đường dẫn chuẩn xác
        String uploadPath = uploadDir.toFile().getAbsolutePath();

        if (dirName.startsWith("../")) dirName = dirName.replace("../", "");

        registry.addResourceHandler("/" + dirName + "/**")
                .addResourceLocations("file:///" + uploadPath + "/"); 
                // Lưu ý: Thêm đủ 3 dấu gạch chéo /// sau file: để chạy tốt trên Windows
        // Trong phương thức addResourceHandlers
        registry.addResourceHandler("/product-images/**")
                .addResourceLocations("file:product-images/");
    }
}