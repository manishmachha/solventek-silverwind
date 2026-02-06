package com.solventek.silverwind.applications;

import com.solventek.silverwind.storage.LocalStorageService;
import com.solventek.silverwind.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

/**
 * Service for ingesting resumes - storing files and extracting text content.
 * Uses the injected StorageService which can be S3 or local filesystem.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeIngestionService {



    private final StorageService storageService;

    public record IngestionResult(String filePath, String extractedText) {
    }

    /**
     * Store a resume file and extract its text content.
     *
     * @param file The MultipartFile to ingest
     * @return IngestionResult containing the storage key and extracted text
     */
    /**
     * Store a file and extract its text content.
     *
     * @param file The MultipartFile to ingest
     * @param customKey Optional custom storage key/path. If null, a default path is generated.
     * @return IngestionResult containing the storage key and extracted text
     */
    public IngestionResult storeAndExtract(MultipartFile file, String customKey) {
        try {
            log.info("Starting ingestion for file: {}", file.getOriginalFilename());

            String storageKey;
            
            if (customKey != null && !customKey.isBlank()) {
                // Use provided custom key directly
                storageKey = storageService.uploadWithKey(file, customKey);
            } else {
                // Default legacy behavior: generate path in resumes/
                String originalFilename = file.getOriginalFilename();
                String extension = "pdf"; 
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
                }
                String baseName = "resume_" + java.util.UUID.randomUUID().toString();
                String key = "resumes/" + baseName + "." + extension;
                storageKey = storageService.uploadWithKey(file, key);
            }

            // Extract text from the file
            String text = extractText(file.getInputStream(), file.getOriginalFilename());

            log.info("Successfully ingested and extracted text: {}, key: {}",
                    file.getOriginalFilename(), storageKey);

            return new IngestionResult(storageKey, text);

        } catch (IOException e) {
            log.error("Failed to ingest file: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("File ingestion failed", e);
        }
    }

    /**
     * Legacy method for backward compatibility
     */
    public IngestionResult storeAndExtract(MultipartFile file) {
        return storeAndExtract(file, null);
    }

    /**
     * Extract text from an existing stored file.
     *
     * @param storageKey The storage key/path of the file
     * @return Extracted text content, or null if extraction fails
     */
    public String extractTextFromPath(String storageKey) {
        try {
            if (storageKey == null || storageKey.isEmpty()) {
                log.warn("Empty storage key provided for text extraction");
                return null;
            }

            if (!storageService.exists(storageKey)) {
                log.warn("Resume file not found at key: {}", storageKey);
                return null;
            }

            Resource resource = storageService.download(storageKey);
            try (InputStream is = resource.getInputStream()) {
                String filename = storageKey.substring(storageKey.lastIndexOf('/') + 1);
                return extractText(is, filename);
            }

        } catch (IOException e) {
            log.error("Failed to extract text from existing file: {}", storageKey, e);
            return null;
        }
    }

    public Resource downloadResume(String storageKey) {
        if (storageKey == null || storageKey.isEmpty()) {
            throw new RuntimeException("Storage key is null or empty");
        }
        return storageService.download(storageKey);
    }

    /**
     * Get a download URL for a resume file.
     * For S3, this returns a presigned URL. For local storage, returns API path.
     *
     * @param storageKey The storage key of the file
     * @return URL for downloading the file
     */
    public String getDownloadUrl(String storageKey) {
        return storageService.getPresignedUrl(storageKey, java.time.Duration.ofHours(1));
    }

    /**
     * Get the full path for legacy integrations.
     * Only works with LocalStorageService.
     */
    public String getFullPath(String storageKey) {
        if (storageService instanceof LocalStorageService localService) {
            return localService.getFullPath(storageKey);
        }
        // For S3, the key itself is the identifier
        return storageKey;
    }

    /**
     * Move a stored file to a new location.
     */
    public void moveKey(String sourceKey, String destinationKey) {
        storageService.move(sourceKey, destinationKey);
    }

    private String extractText(InputStream inputStream, String filename) throws IOException {
        log.debug("Extracting text from file: {}", filename);
        String lower = filename.toLowerCase();

        if (lower.endsWith(".pdf")) {
            try (PDDocument document = org.apache.pdfbox.Loader.loadPDF(inputStream.readAllBytes())) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        } else if (lower.endsWith(".docx")) {
            try (XWPFDocument doc = new XWPFDocument(inputStream);
                 XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
                return extractor.getText();
            }
        } else {
            // Fallback for text files
            return new String(inputStream.readAllBytes());
        }
    }
}
