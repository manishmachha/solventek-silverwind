package com.solventek.silverwind.storage;

import com.solventek.silverwind.config.StorageProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequiredArgsConstructor
public class LocalStorageService implements StorageService {

    private final StorageProperties storageProperties;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(storageProperties.getUploadDir()).toAbsolutePath().normalize();
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
    public String uploadWithKey(MultipartFile file, String key) {
        log.info("Uploading file locally with custom key: {}", key);

        try {
            // Validate key to prevent directory traversal
            if (key.contains("..")) {
                throw new RuntimeException("Invalid key containing '..'");
            }
            
            Path targetPath = rootLocation.resolve(key).normalize();
            if (!targetPath.startsWith(rootLocation)) {
                throw new RuntimeException("Invalid key, outside upload root");
            }
            
            // Create parent directories
            Files.createDirectories(targetPath.getParent());

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

    @Override
    public void move(String sourceKey, String destinationKey) {
        log.info("Moving file locally from {} to {}", sourceKey, destinationKey);
        try {
            Path sourcePath = rootLocation.resolve(sourceKey).normalize();
            Path destPath = rootLocation.resolve(destinationKey).normalize();

            // Security checks
            if (!sourcePath.startsWith(rootLocation) || !destPath.startsWith(rootLocation)) {
                throw new RuntimeException("Invalid path for move operation");
            }

            if (!Files.exists(sourcePath)) {
                throw new RuntimeException("Source file does not exist: " + sourceKey);
            }

            // Create parent directories for destination
            Files.createDirectories(destPath.getParent());

            // Move (Atomic move if possible, else copy delete)
            Files.move(sourcePath, destPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Successfully moved file locally");

        } catch (IOException e) {
            log.error("Failed to move file locally", e);
            throw new RuntimeException("Failed to move file", e);
        }
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
