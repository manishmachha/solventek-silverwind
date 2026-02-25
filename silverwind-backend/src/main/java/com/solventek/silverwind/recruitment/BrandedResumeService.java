package com.solventek.silverwind.recruitment;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solventek.silverwind.notifications.Notification.NotificationCategory;
import com.solventek.silverwind.notifications.Notification.NotificationPriority;
import com.solventek.silverwind.notifications.NotificationService;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.storage.StorageService;
import com.solventek.silverwind.auth.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrates the generation of Solventek-branded resume PDFs.
 * Uses Gemini AI to revamp resume content before generating a professional PDF.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BrandedResumeService {

    private final CandidateRepository candidateRepository;
    private final BrandedResumeRepository brandedResumeRepository;
    private final BrandedResumePdfService pdfService;
    private final StorageService storageService;
    private final ChatClient.Builder chatClientBuilder;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final EmployeeRepository employeeRepository;

    private static final String REVAMP_SYSTEM_PROMPT = """
            You are a Professional Resume Writer for a staffing/recruitment company.
            Your job is to take raw resume data and produce a POLISHED, CLIENT-READY version.

            Rules:
            1. Rewrite the summary to be impactful (3-5 sentences, action-oriented, quantified where possible)
            2. For each experience entry, rewrite descriptions with strong action verbs and quantified achievements
            3. Standardize date formats to "MMM YYYY" (e.g., "Jan 2023")
            4. Clean and categorize skills (remove duplicates, fix capitalization)
            5. Improve project descriptions to highlight impact and technologies used
            6. DO NOT fabricate information — only enhance what is provided
            7. DO NOT add new experiences, skills, or qualifications that are not in the source data

            Return STRICT JSON ONLY matching this schema:
            {
              "summary": "Polished professional summary",
              "experience": [
                {
                  "company": "string",
                  "title": "string",
                  "start": "MMM YYYY",
                  "end": "MMM YYYY or Present",
                  "description": "Enhanced bullet-point description with action verbs"
                }
              ],
              "education": [
                {
                  "institution": "string",
                  "degree": "string",
                  "fieldOfStudy": "string",
                  "startYear": "YYYY",
                  "endYear": "YYYY"
                }
              ],
              "skills": ["string"],
              "projects": [
                {
                  "name": "string",
                  "description": "Enhanced project description",
                  "stack": ["string"]
                }
              ]
            }
            Output RAW JSON only (no markdown fences).
            """;

    /**
     * Asynchronously generate a branded resume for a candidate.
     * Fire-and-forget — called after candidate save.
     */
    @Async("analysisExecutor")
    public void generateBrandedResumeAsync(UUID candidateId) {
        log.info("[branded-resume] Starting async generation for candidate: {} on thread: {}",
                candidateId, Thread.currentThread().getName());
        try {
            generateBrandedResume(candidateId);
        } catch (Exception e) {
            log.error("[branded-resume] Async generation failed for candidate {}: {}", candidateId, e.getMessage(), e);
        }
    }

    /**
     * Generate a branded resume (synchronous core logic).
     */
    @org.springframework.transaction.annotation.Transactional
    public BrandedResume generateBrandedResume(UUID candidateId) {
        Candidate candidate = candidateRepository.findByIdWithDetails(candidateId)
                .orElseThrow(() -> new EntityNotFoundException("Candidate not found: " + candidateId));

        Organization org = candidate.getOrganization();
        int nextVersion = brandedResumeRepository.countByCandidateId(candidateId) + 1;
        String s3Key = String.format("branded-resumes/%s/v%d.pdf", candidateId, nextVersion);
        String fileName = String.format("%s_%s_Solventek_v%d.pdf",
                candidate.getFirstName(), candidate.getLastName(), nextVersion);

        // Create entity in GENERATING state
        BrandedResume resume = BrandedResume.builder()
                .candidate(candidate)
                .organization(org)
                .version(nextVersion)
                .filePath(s3Key)
                .originalFileName(fileName)
                .contentType("application/pdf")
                .status(BrandedResume.Status.GENERATING)
                .build();
        resume = brandedResumeRepository.save(resume);

        try {
            // 1. Build source data JSON from candidate fields
            String sourceDataJson = buildSourceDataJson(candidate);
            log.info("[branded-resume] Source data for AI: {}", sourceDataJson);

            // 2. Revamp content using Gemini AI
            log.info("[branded-resume] Revamping content with AI for candidate: {}", candidateId);
            String revampedJson = revampContentWithAI(sourceDataJson);
            log.info("[branded-resume] Revamped JSON from AI: {}", revampedJson);
            resume.setRevampedContentJson(revampedJson);

            // 3. Parse revamped content
            Map<String, Object> revamped = parseJsonMap(revampedJson);

            // 4. Generate PDF
            log.info("[branded-resume] Generating PDF for candidate: {}", candidateId);
            byte[] pdfBytes = pdfService.generate(
                    candidate.getFirstName() + " " + candidate.getLastName(),
                    candidate.getEmail(),
                    candidate.getPhone(),
                    candidate.getCity(),
                    safeStr(revamped, "summary"),
                    safeList(revamped, "experience"),
                    safeList(revamped, "education"),
                    safeStringList(revamped, "skills"),
                    safeList(revamped, "projects"));

            // 5. Upload to storage
            storageService.uploadBytes(pdfBytes, s3Key, "application/pdf");
            resume.setFileSizeBytes((long) pdfBytes.length);
            resume.setStatus(BrandedResume.Status.COMPLETED);
            resume.setGenerationNotes("Generated successfully. Version " + nextVersion);
            brandedResumeRepository.save(resume);

            log.info("[branded-resume] Successfully generated v{} for candidate {} ({} bytes)",
                    nextVersion, candidateId, pdfBytes.length);

            // 6. Notify admins
            notifyBrandedResumeReady(candidate, resume);

            return resume;

        } catch (Exception e) {
            log.error("[branded-resume] Generation failed for candidate {}: {}", candidateId, e.getMessage(), e);
            resume.setStatus(BrandedResume.Status.FAILED);
            resume.setGenerationNotes("Generation failed: " + e.getMessage());
            brandedResumeRepository.save(resume);
            throw new RuntimeException("Branded resume generation failed", e);
        }
    }

    // --- Query methods ---

    public Optional<BrandedResume> getLatest(UUID candidateId) {
        return brandedResumeRepository.findTopByCandidateIdOrderByVersionDesc(candidateId);
    }

    public List<BrandedResume> getVersions(UUID candidateId) {
        return brandedResumeRepository.findByCandidateIdOrderByVersionDesc(candidateId);
    }

    public List<BrandedResume> getAllForOrganization(UUID orgId) {
        return brandedResumeRepository.findByOrganizationIdWithCandidate(orgId);
    }

    public List<BrandedResume> getAll() {
        return brandedResumeRepository.findAllWithCandidateAndOrg();
    }

    public BrandedResume getById(UUID id) {
        return brandedResumeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Branded resume not found: " + id));
    }

    public org.springframework.core.io.Resource download(UUID id) {
        BrandedResume br = getById(id);
        return storageService.download(br.getFilePath());
    }

    public org.springframework.core.io.Resource downloadLatest(UUID candidateId) {
        BrandedResume br = getLatest(candidateId)
                .orElseThrow(
                        () -> new EntityNotFoundException("No branded resume found for candidate: " + candidateId));
        return storageService.download(br.getFilePath());
    }

    // --- Private helpers ---

    private String buildSourceDataJson(Candidate c) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("candidateName", c.getFirstName() + " " + c.getLastName());
        data.put("summary", c.getSummary());
        data.put("skills", c.getSkills());

        // Parse stored JSON fields
        if (c.getExperienceDetailsJson() != null) {
            data.put("experience", parseJsonList(c.getExperienceDetailsJson()));
        }
        if (c.getEducationDetailsJson() != null) {
            data.put("education", parseJsonList(c.getEducationDetailsJson()));
        }

        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private String revampContentWithAI(String sourceDataJson) {
        ChatClient chatClient = chatClientBuilder.build();
        Prompt prompt = new Prompt(List.of(
                new SystemMessage(REVAMP_SYSTEM_PROMPT),
                new UserMessage("SOURCE RESUME DATA:\n" + sourceDataJson)));

        String raw = chatClient.prompt(prompt).call().content();
        return extractFirstJsonObject(raw);
    }

    private String extractFirstJsonObject(String raw) {
        String s = raw == null ? "" : raw.trim();
        s = s.replaceAll("^```json\\s*", "").replaceAll("^```\\s*", "").replaceAll("\\s*```$", "").trim();
        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start >= 0 && end > start)
            return s.substring(start, end + 1).trim();
        return s;
    }

    private Map<String, Object> parseJsonMap(String json) {
        try {
            com.fasterxml.jackson.core.JsonFactory factory = com.fasterxml.jackson.core.JsonFactory.builder()
                    .enable(com.fasterxml.jackson.core.json.JsonReadFeature.ALLOW_UNQUOTED_FIELD_NAMES)
                    .enable(com.fasterxml.jackson.core.json.JsonReadFeature.ALLOW_SINGLE_QUOTES)
                    .enable(com.fasterxml.jackson.core.json.JsonReadFeature.ALLOW_TRAILING_COMMA)
                    .enable(com.fasterxml.jackson.core.json.JsonReadFeature.ALLOW_JAVA_COMMENTS)
                    .build();
            ObjectMapper mapper = new ObjectMapper(factory);
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            // Repair common AI double braces if present
            String repaired = json == null ? "{}" : json.replaceAll("\\{\\s*\\{", "{").replaceAll("\\}\\s*\\}", "}");

            return mapper.readValue(repaired, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            log.warn("Failed to parse revamped JSON: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private List<Object> parseJsonList(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<Object>>() {
            });
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String safeStr(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> safeList(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof List<?> list) {
            return list.stream()
                    .filter(item -> item instanceof Map)
                    .map(item -> (Map<String, Object>) item)
                    .collect(Collectors.toList());
        }
        return Collections.emptyList();
    }

    private List<String> safeStringList(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof List<?> list) {
            return list.stream().map(Object::toString).collect(Collectors.toList());
        }
        return Collections.emptyList();
    }

    private void notifyBrandedResumeReady(Candidate candidate, BrandedResume resume) {
        try {
            var admins = employeeRepository.findByOrganizationId(candidate.getOrganization().getId());
            for (var admin : admins) {
                notificationService.sendNotification(
                        NotificationService.NotificationBuilder.create()
                                .recipient(admin.getId())
                                .title("Branded Resume Ready")
                                .body("Branded resume v" + resume.getVersion() + " for "
                                        + candidate.getFirstName() + " " + candidate.getLastName()
                                        + " is ready for download.")
                                .category(NotificationCategory.CANDIDATE)
                                .priority(NotificationPriority.NORMAL)
                                .refEntity("CANDIDATE", candidate.getId())
                                .actionUrl("/candidates/" + candidate.getId())
                                .icon("bi-file-earmark-pdf-fill"));
            }
        } catch (Exception e) {
            log.warn("Failed to send branded resume notification", e);
        }
    }
}
