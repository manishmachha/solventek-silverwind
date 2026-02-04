package com.solventek.silverwind.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.UUID;

/**
 * Local filesystem storage service implementation.
 * Used as fallback when S3 is disabled (development mode).
 * Activated when aws.s3.enabled=false (default)
 */
@Service
@ConditionalOnProperty(name = "aws.s3.enabled", havingValue = "false", matchIfMissing = true)
@Slf4j
public class LocalStorageService implements StorageService {

    @Value("${app.storage.upload-dir:uploads}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        log.info("Initializing Local Storage Service at: {}", rootLocation);

        try {
            Files.createDirectories(rootLocation);
            log.info("Local Storage Service initialized successfully");
        } catch (IOException e) {
            log.error("Failed to create upload directory: {}", rootLocation, e);
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    @Override
    public String upload(MultipartFile file, String directory) {
        String key = generateKey(directory, file.getOriginalFilename());
        log.info("Uploading file locally: {}", key);

        try {
            Path targetDir = rootLocation.resolve(directory);
            Files.createDirectories(targetDir);

            Path targetPath = rootLocation.resolve(key);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            log.info("Successfully uploaded file locally: {}", key);
            return key;

        } catch (IOException e) {
            log.error("Failed to upload file locally: {}", key, e);
            throw new RuntimeException("Failed to store file locally", e);
        }
    }

    @Override
    public Resource download(String key) {
        log.debug("Downloading file locally: {}", key);

        try {
            Path filePath = rootLocation.resolve(key).normalize();

            // Security check: ensure file is within upload directory
            if (!filePath.startsWith(rootLocation)) {
                throw new RuntimeException("Invalid file path: " + key);
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable: " + key);
            }

        } catch (MalformedURLException e) {
            log.error("Failed to read file: {}", key, e);
            throw new RuntimeException("Failed to read file", e);
        }
    }

    @Override
    public String getPresignedUrl(String key, Duration expiration) {
        // For local storage, return a direct path/URL
        // In production, this would be replaced by actual presigned URL from S3
        log.debug("Generating local URL for: {}", key);
        return "/api/files/" + key;
    }

    @Override
    public void delete(String key) {
        log.info("Deleting file locally: {}", key);

        try {
            Path filePath = rootLocation.resolve(key).normalize();

            // Security check
            if (!filePath.startsWith(rootLocation)) {
                throw new RuntimeException("Invalid file path: " + key);
            }

            Files.deleteIfExists(filePath);
            log.info("Successfully deleted file locally: {}", key);

        } catch (IOException e) {
            log.error("Failed to delete file: {}", key, e);
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    @Override
    public boolean exists(String key) {
        Path filePath = rootLocation.resolve(key).normalize();
        return Files.exists(filePath) && filePath.startsWith(rootLocation);
    }

    private String generateKey(String directory, String originalFilename) {
        String uuid = UUID.randomUUID().toString();
        String sanitizedFilename = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_") : "file";
        return String.format("%s/%s_%s", directory, uuid, sanitizedFilename);
    }

    /**
     * Get the full filesystem path for a given key.
     * Useful for legacy integrations that need absolute paths.
     */
    public String getFullPath(String key) {
        return rootLocation.resolve(key).toString();
    }
}
