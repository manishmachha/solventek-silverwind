package com.solventek.silverwind.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

/**
 * Storage service interface for file operations.
 * Implementations include S3StorageService (production) and LocalStorageService (development).
 */
public interface StorageService {

    /**
     * Upload a file to storage.
     *
     * @param file      The file to upload
     * @param directory The directory/prefix for the file (e.g., "resumes", "logos", "documents")
     * @return The storage key/path of the uploaded file
     */
    String upload(MultipartFile file, String directory);

    /**
     * Upload a file with a specific key (path/filename).
     * Does NOT append UUIDs or modify the filename.
     *
     * @param file The file to upload
     * @param key  The full storage key (path + filename)
     * @return The used storage key
     */
    String uploadWithKey(MultipartFile file, String key);

    /**
     * Download a file from storage.
     *
     * @param key The storage key/path of the file
     * @return Resource representing the file
     */
    Resource download(String key);

    /**
     * Get a presigned URL for secure, time-limited access to a file.
     *
     * @param key        The storage key/path of the file
     * @param expiration How long the URL should be valid
     * @return The presigned URL string
     */
    String getPresignedUrl(String key, Duration expiration);

    /**
     * Delete a file from storage.
     *
     * @param key The storage key/path of the file
     */
    void delete(String key);

    /**
     * Check if a file exists in storage.
     *
     * @param key The storage key/path of the file
     * @return true if the file exists, false otherwise
     */
    /**
     * Move a file from one location to another.
     *
     * @param sourceKey      The current storage key/path
     * @param destinationKey The new storage key/path
     */
    void move(String sourceKey, String destinationKey);

    boolean exists(String key);
}
