package com.grocery.management.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;
import java.util.List;

@Component
@Slf4j
public class SchemaMigrationRunner implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking schema migrations...");

        try {
            // Check if label table exists
            Integer labelsExists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'labels'",
                    Integer.class);

            if (labelsExists != null && labelsExists > 0) {
                log.info("Migrating product_labels and dropping labels table...");

                // Drop FK constraint on product_labels referencing labels (thay đổi FK name phù
                // hợp)
                try {
                    jdbcTemplate.execute("ALTER TABLE product_labels DROP FOREIGN KEY FK3grt6axarychx2qok2f34dacm");
                } catch (Exception e) {
                    log.warn("Could not drop foreign key FK3grt6axarychx2qok2f34dacm. It might not exist.");
                }

                // Add new constraint to categories
                try {
                    jdbcTemplate.execute(
                            "ALTER TABLE product_labels ADD CONSTRAINT fk_product_labels_category FOREIGN KEY (label_id) REFERENCES categories (id)");
                } catch (Exception e) {
                    log.warn("Could not add new foreign key for product_labels. It might already exist.", e);
                }

                // Delete label histories
                jdbcTemplate.execute("DROP TABLE IF EXISTS label_histories");

                // Drop labels table
                jdbcTemplate.execute("DROP TABLE IF EXISTS labels");

                log.info("Migration finished successfully.");
            }

            // Check if category_id column exists in products table
            Integer categoryIdExists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'category_id'",
                    Integer.class);

            if (categoryIdExists != null && categoryIdExists > 0) {
                log.info("Dropping category_id from products table...");

                // Try to find and drop FK dynamically
                try {
                    List<String> fkNames = jdbcTemplate.queryForList(
                            "SELECT CONSTRAINT_NAME FROM information_schema.key_column_usage " +
                                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND REFERENCED_TABLE_NAME = 'categories' AND COLUMN_NAME = 'category_id'",
                            String.class);
                    for (String fkName : fkNames) {
                        jdbcTemplate.execute("ALTER TABLE products DROP FOREIGN KEY " + fkName);
                    }
                } catch (Exception e) {
                    log.warn("Could not dynamic drop foreign key for category_id in products.", e);
                }

                // Drop column
                try {
                    jdbcTemplate.execute("ALTER TABLE products DROP COLUMN category_id");
                    log.info("Dropped column category_id from products table.");
                } catch (Exception e) {
                    log.warn("Could not drop column category_id from products.", e);
                }
            }
        } catch (Exception e) {
            log.error("Migration failed.", e);
        }
    }
}
