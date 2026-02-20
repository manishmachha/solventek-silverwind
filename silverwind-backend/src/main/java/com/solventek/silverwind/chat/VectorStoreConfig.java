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
                // Qdrant vector store is managed by Spring AI initialize-schema
                // No need to manually create vector extension/table

                // Delegate handbook initialization to the service
                handbookService.initDefaultIfMissing();

            } catch (Exception e) {
                log.error("VectorStore init failed: {}", e.getMessage(), e);
            }
        };
    }
}
