package com.solventek.silverwind.ai;

import com.solventek.silverwind.applications.JobApplication;
import com.solventek.silverwind.applications.JobApplicationRepository;
import com.solventek.silverwind.jobs.Job;
import com.solventek.silverwind.jobs.JobRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.MalformedURLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final ChatClient.Builder chatClientBuilder;
    private final VectorStore vectorStore;
    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;

    @Transactional
    public Map<String, Object> enrichJob(UUID jobId) {
        log.info("Starting AI job enrichment for Job ID: {}", jobId);
        try {
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new EntityNotFoundException("Job not found with ID: " + jobId));

            String prompt = """
                    Analyze the following job description and provide structured improvements.
                    Return ONLY valid JSON with keys: "improvedDescription", "suggestedSkills", "interviewQuestions", "redFlags".

                    Job Title: %s
                    Description: %s
                    """
                    .formatted(job.getTitle(), job.getDescription());

            log.debug("Sending prompt to AI model for Job ID: {}", jobId);
            String response = chatClientBuilder.build().prompt(prompt).call().content();
            log.debug("Received AI response for Job ID: {}", jobId);

            // Mocking structured parse for safety in this demo, real app use
            // BeanOutputConverter
            Map<String, Object> insights = Map.of(
                    "raw_analysis", response,
                    "generated_at", java.time.LocalDateTime.now().toString());

            job.setAiInsights(insights);
            jobRepository.save(job);

            log.info("Successfully enriched Job ID: {}", jobId);
            return insights;
        } catch (Exception e) {
            log.error("Error enriching Job ID: {}: {}", jobId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void ingestResume(UUID applicationId) {
        log.info("Starting resume ingestion for Application ID: {}", applicationId);
        JobApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new EntityNotFoundException("Application not found: " + applicationId));

        if (app.getResumeUrl() == null || app.getResumeUrl().isEmpty()) {
            log.warn("Resume ingestion failed: No resume URL for Application ID: {}", applicationId);
            throw new IllegalArgumentException("No resume for application");
        }

        try {
            log.debug("Fetching resume from URL: {}", app.getResumeUrl());
            // Take resume URL
            UrlResource resource = new UrlResource(app.getResumeUrl());
            PagePdfDocumentReader pdfReader = new PagePdfDocumentReader(resource);
            List<Document> documents = pdfReader.get();

            log.debug("Extracted {} pages/documents from resume for Application ID: {}", documents.size(),
                    applicationId);

            // Add metadata
            documents.forEach(doc -> {
                doc.getMetadata().put("applicationId", applicationId.toString());
                doc.getMetadata().put("docType", "RESUME");
            });

            // Split
            TokenTextSplitter splitter = new TokenTextSplitter();
            List<Document> splitDocs = splitter.apply(documents);
            log.debug("Split resume into {} chunks for Application ID: {}", splitDocs.size(), applicationId);

            // Store
            vectorStore.add(splitDocs);
            log.info("Successfully ingested and indexed resume for Application ID: {}", applicationId);

        } catch (MalformedURLException e) {
            log.error("Invalid resume URL for Application ID: {}: {}", applicationId, e.getMessage());
            throw new RuntimeException("Invalid resume URL", e);
        } catch (Exception e) {
            log.error("Error ingesting resume for Application ID: {}: {}", applicationId, e.getMessage(), e);
            throw new RuntimeException("Error ingesting resume", e);
        }
    }

    public List<ApplicationMatch> matchCandidates(UUID jobId) {
        log.info("Matching candidates for Job ID: {}", jobId);
        try {
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new EntityNotFoundException("Job not found: " + jobId));

            String query = job.getTitle() + " " + job.getDescription();
            log.debug("Searching vector store with query length: {}", query.length());

            List<Document> similarDocs = vectorStore.similaritySearch(
                    SearchRequest.builder().query(query).topK(5).build());

            log.debug("Found {} similar documents for Job ID: {}", similarDocs.size(), jobId);

            // Group by application ID and aggregate
            List<ApplicationMatch> matches = similarDocs.stream()
                    .map(doc -> {
                        String appIdStr = (String) doc.getMetadata().get("applicationId");
                        if (appIdStr == null)
                            return null;
                        return new ApplicationMatch(UUID.fromString(appIdStr), 0.0); // Score unavailable in simple API
                    })
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            log.info("Found {} unique candidate matches for Job ID: {}", matches.size(), jobId);
            return matches;
        } catch (Exception e) {
            log.error("Error matching candidates for Job ID: {}: {}", jobId, e.getMessage(), e);
            throw new RuntimeException("Error matching candidates", e);
        }
    }

    public record ApplicationMatch(UUID applicationId, double score) {
    }
}
