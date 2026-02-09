package com.solventek.silverwind.chat;

import com.solventek.silverwind.org.HandbookService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
@Slf4j
public class VectorStoreConfig {

    @Bean
    CommandLineRunner initVectorStore(JdbcTemplate jdbcTemplate, HandbookService handbookService) {
        return args -> {
            try {
                jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
                // Table and indexes are managed by Flyway migrations

                // Delegate handbook initialization to the service
                handbookService.initDefaultIfMissing();

            } catch (Exception e) {
                log.error("VectorStore init failed: {}", e.getMessage(), e);
            }
        };
    }
}
