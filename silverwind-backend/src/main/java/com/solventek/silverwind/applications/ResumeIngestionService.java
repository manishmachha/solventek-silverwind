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

    private static final String RESUMES_DIRECTORY = "resumes";

    private final StorageService storageService;

    public record IngestionResult(String filePath, String extractedText) {
    }

    /**
     * Store a resume file and extract its text content.
     *
     * @param file The MultipartFile to ingest
     * @return IngestionResult containing the storage key and extracted text
     */
    public IngestionResult storeAndExtract(MultipartFile file) {
        try {
            log.info("Starting ingestion for file: {}", file.getOriginalFilename());

            // 1. Store file using StorageService
            String storageKey = storageService.upload(file, RESUMES_DIRECTORY);

            // 2. Extract text from the file
            String text = extractText(file.getInputStream(), file.getOriginalFilename());

            log.info("Successfully ingested and extracted text from resume: {}, key: {}",
                    file.getOriginalFilename(), storageKey);

            return new IngestionResult(storageKey, text);

        } catch (IOException e) {
            log.error("Failed to ingest resume: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("Resume ingestion failed", e);
        }
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
