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
            You are an elite Executive Tech Recruiter and ATS Optimization Expert.
            Your task is to revamp the provided candidate resume data to achieve a 100/100 score on strict Applicant Tracking Systems (ATS) and human recruiter reviews.

            CRITICAL RULES:
            1. SUPERCHARGE ACTION VERBS: Start EVERY bullet point with a powerful, premium action verb (e.g., Architected, Spearheaded, Engineered, Orchestrated, Catalyzed). Avoid weak verbs like 'Worked on' or 'Helped'.
            2. QUANTIFY IMPACT: Inject implied numerical metrics where logically possible based on the context (e.g., 'boosting efficiency by 30%', 'serving 10,00+ users', 'reducing latency by 40%') IF the source hints at scale.
            3. ELIMINATE RED FLAGS: Smooth over employment gaps and avoid job-hopper framing. MUST keep ALL education records. Do not drop degrees.
            4. PROFESSIONAL SUMMARY: Write a 3-4 sentence elite summary highlighting seniority, core expertise, and measurable business impact.
            5. SKILLS: Categorize, deduplicate, and list only highly relevant, modern tech skills. Group them if possible or just provide a clean list.
            6. PROJECTS: Treat projects like professional achievements. Highlight the tech stack and the exact value delivered. If the original source lists projects as experience, maintain them but enhance the descriptions.
            7. NO HALLUCINATIONS: Do not invent fake jobs, fake degrees, or entirely fake technologies. Enhance the *existing* truth to its maximum potential.
            8. DATE FORMAT: MUST strict format as 'MMM YYYY' to 'MMM YYYY' (e.g., 'Feb 2022 - Present').

            Return EXACTLY THIS JSON STRUCTURE AND NOTHING ELSE (No markdown fences, no explanations):
            {
              "summary": "Elite professional summary here...",
              "experience": [
                {
                  "company": "Company Name",
                  "title": "Job Title",
                  "start": "MMM YYYY",
                  "end": "MMM YYYY or Present",
                  "description": "[Premium Action Verb] drove architecture...\\n[Premium Action Verb] optimized performance by..."
                }
              ],
              "education": [
                {
                  "institution": "University Name",
                  "degree": "Degree Name",
                  "fieldOfStudy": "Major",
                  "startYear": "YYYY",
                  "endYear": "YYYY"
                }
              ],
              "skills": ["Java", "Spring Boot", "AWS", "Angular"],
              "projects": [
                {
                  "name": "Project Name",
                  "description": "[Premium Action Verb] built scalable microservices...",
                  "stack": ["React", "Node.js"]
                }
              ]
            }
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
            String json = objectMapper.writeValueAsString(data);
            log.info("[branded-resume] Source Candidate Data Built: {}", json);
            return json;
        } catch (JsonProcessingException e) {
            log.error("[branded-resume] Error building source data JSON", e);
            return "{}";
        }
    }

    private String revampContentWithAI(String sourceDataJson) {
        ChatClient chatClient = chatClientBuilder.build();
        Prompt prompt = new Prompt(List.of(
                new SystemMessage(REVAMP_SYSTEM_PROMPT),
                new UserMessage("SOURCE RESUME DATA:\n" + sourceDataJson)));

        String raw = chatClient.prompt(prompt).call().content();
        log.info("[branded-resume] Raw AI Output Received: \n{}", raw);
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
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            // Repair common AI double braces if present
            String repaired = json == null ? "{}" : json.replaceAll("\\{\\s*\\{", "{").replaceAll("\\}\\s*\\}", "}");

            return mapper.readValue(repaired, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            log.warn("Failed to parse revamped JSON: {}", e.getMessage());
            return java.util.Collections.emptyMap();
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
