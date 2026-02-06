package com.solventek.silverwind.storage;

import com.solventek.silverwind.config.AwsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

/**
 * S3-based storage service implementation.
 * Activated when aws.s3.enabled=true
 */
@Service
@Primary
@ConditionalOnProperty(name = "aws.s3.enabled", havingValue = "true")
@Slf4j
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final AwsProperties awsProperties;

    private S3Client s3Client;
    private S3Presigner s3Presigner;

    @PostConstruct
    public void init() {
        log.info("Initializing S3 Storage Service for bucket: {} in region: {}", awsProperties.getBucketName(), awsProperties.getRegion());

        AwsBasicCredentials credentials = AwsBasicCredentials.create(awsProperties.getAccessKey(), awsProperties.getSecretKey());
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);

        this.s3Client = S3Client.builder()
                .region(Region.of(awsProperties.getRegion()))
                .credentialsProvider(credentialsProvider)
                .build();

        this.s3Presigner = S3Presigner.builder()
                .region(Region.of(awsProperties.getRegion()))
                .credentialsProvider(credentialsProvider)
                .build();

        log.info("S3 Storage Service initialized successfully");
    }

    @PreDestroy
    public void destroy() {
        if (s3Client != null) {
            s3Client.close();
        }
        if (s3Presigner != null) {
            s3Presigner.close();
        }
    }

    @Override
    public String upload(MultipartFile file, String directory) {
        String key = generateKey(directory, file.getOriginalFilename());
        log.info("Uploading file to S3: bucket={}, key={}", awsProperties.getBucketName(), key);

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(awsProperties.getBucketName())
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("Successfully uploaded file to S3: {}", key);
            return key;

        } catch (IOException e) {
            log.error("Failed to upload file to S3: {}", key, e);
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }

    @Override
    public String uploadWithKey(MultipartFile file, String key) {
        log.info("Uploading file to S3 with custom key: bucket={}, key={}", awsProperties.getBucketName(), key);

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(awsProperties.getBucketName())
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("Successfully uploaded file to S3: {}", key);
            return key;

        } catch (IOException e) {
            log.error("Failed to upload file to S3: {}", key, e);
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }

    @Override
    public Resource download(String key) {
        log.debug("Downloading file from S3: bucket={}, key={}", awsProperties.getBucketName(), key);

        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(awsProperties.getBucketName())
                    .key(key)
                    .build();

            var response = s3Client.getObject(request);
            return new InputStreamResource(response);

        } catch (NoSuchKeyException e) {
            log.warn("File not found in S3: {}", key);
            throw new RuntimeException("File not found: " + key, e);
        }
    }

    @Override
    public String getPresignedUrl(String key, Duration expiration) {
        log.debug("Generating presigned URL for: bucket={}, key={}, expiration={}", awsProperties.getBucketName(), key, expiration);

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(awsProperties.getBucketName())
                .key(key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(expiration != null ? expiration : Duration.ofMinutes(awsProperties.getPresignedUrlExpirationMinutes()))
                .getObjectRequest(getObjectRequest)
                .build();

        var presignedRequest = s3Presigner.presignGetObject(presignRequest);
        String url = presignedRequest.url().toString();
        log.debug("Generated presigned URL: {}", url);
        return url;
    }

    @Override
    public void delete(String key) {
        log.info("Deleting file from S3: bucket={}, key={}", awsProperties.getBucketName(), key);

        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(awsProperties.getBucketName())
                    .key(key)
                    .build();

            s3Client.deleteObject(request);
            log.info("Successfully deleted file from S3: {}", key);

        } catch (Exception e) {
            log.error("Failed to delete file from S3: {}", key, e);
            throw new RuntimeException("Failed to delete file from S3", e);
        }
    }

    @Override
    public boolean exists(String key) {
        try {
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(awsProperties.getBucketName())
                    .key(key)
                    .build();

            s3Client.headObject(request);
            return true;

        } catch (NoSuchKeyException e) {
            return false;
        }
    }

    @Override
    public void move(String sourceKey, String destinationKey) {
        log.info("Moving file in S3 from {} to {}", sourceKey, destinationKey);
        try {
            // 1. Copy Object
            CopyObjectRequest copyRequest = CopyObjectRequest.builder()
                    .sourceBucket(awsProperties.getBucketName())
                    .sourceKey(sourceKey)
                    .destinationBucket(awsProperties.getBucketName())
                    .destinationKey(destinationKey)
                    .build();

            s3Client.copyObject(copyRequest);

            // 2. Delete Original
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(awsProperties.getBucketName())
                    .key(sourceKey)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("Successfully moved file in S3");

        } catch (Exception e) {
            log.error("Failed to move file in S3", e);
            throw new RuntimeException("Failed to move file in S3", e);
        }
    }

    private String generateKey(String directory, String originalFilename) {
        String uuid = UUID.randomUUID().toString();
        String sanitizedFilename = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_") : "file";
        return String.format("%s/%s_%s", directory, uuid, sanitizedFilename);
    }
}
