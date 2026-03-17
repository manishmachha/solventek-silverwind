package com.solventek.silverwind.applications;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solventek.silverwind.applications.dtos.AnalysisResultDTO;
import com.solventek.silverwind.jobs.Job;
import com.solventek.silverwind.recruitment.CandidateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.document.Document;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeAnalysisOrchestratorService {

  private final JobApplicationRepository applicationRepository;
  private final ResumeAnalysisRepository analysisRepository;
  private final HiringRubricService rubricService;
  private final ChatClient.Builder chatClientBuilder;
  private final ObjectMapper objectMapper;
  private final com.solventek.silverwind.notifications.NotificationService notificationService;
  private final com.solventek.silverwind.auth.EmployeeRepository employeeRepository;
  private final CandidateRepository candidateRepository;

  // -------------------- CANDIDATE ANALYSIS (ASYNC) --------------------

  /**
   * Runs the general AI analysis for a candidate in a background thread.
   * Called after candidateRepository.save() so the HTTP response is not blocked.
   * Updates candidate.aiAnalysisJson once the analysis completes.
   */
  @Async("analysisExecutor")
  public void runCandidateAnalysisAsync(java.util.UUID candidateId, String resumeText, String factsJson) {
    log.info("[async] Starting general AI analysis for candidate ID: {} on thread: {}",
        candidateId, Thread.currentThread().getName());
    try {
      AnalysisResultDTO result = analyzeCandidate(resumeText, factsJson);
      candidateRepository.findById(candidateId).ifPresentOrElse(candidate -> {
        try {
          candidate.setAiAnalysisJson(objectMapper.writeValueAsString(result));
          candidateRepository.save(candidate);
          log.info("[async] General AI analysis saved for candidate ID: {}", candidateId);
        } catch (JsonProcessingException e) {
          log.error("[async] Failed to serialize analysis result for candidate {}: {}", candidateId, e.getMessage());
        }
      }, () -> log.warn("[async] Candidate {} not found when saving analysis result", candidateId));
    } catch (Exception e) {
      log.error("[async] General AI analysis failed for candidate {}: {}", candidateId, e.getMessage(), e);
      // Swallow — non-critical background task, candidate already saved successfully
    }
  }

  // -------------------- PASS A: FACT EXTRACTION --------------------

  private static final String DEEP_EXTRACTION_SYSTEM_PROMPT = """
      You are a Resume Facts Extractor used for hiring risk analysis.
      Extract only what is supported by the resume text. Do NOT guess.

      Return STRICT JSON ONLY with this schema:
      {
        "candidateName": "string|null",
        "emails": ["string"],
        "phones": ["string"],
        "city": "string|null",
        "state": "string|null",
        "country": "string|null",
        "summary": "3-5 sentence professional summary|null",
        "linkedInUrl": "string|null",
        "portfolioUrl": "string|null",
        "totalExperienceYears": number|null,
        "experience": [
          {
            "company": "string|null",
            "title": "string|null",
            "start": "YYYY-MM|null (or Present)",
            "end": "YYYY-MM|null (or Present)",
            "isCurrent": true|false,
            "technologies": ["string"],
            "description": "string|null"
          }
        ],
        "education": [
          {
            "institution": "string|null",
            "degree": "string|null",
            "fieldOfStudy": "string|null",
            "startYear": "YYYY|null",
            "endYear": "YYYY|null"
          }
        ],
        "projects": [
          {
            "name": "string|null",
            "stack": ["string"]
          }
        ],
        "skills": [
          { "name": "string" }
        ]
      }
      Output RAW JSON only (no markdown).
      """;

  private static final String LIGHT_EXTRACTION_SYSTEM_PROMPT = """
      You are a Resume Facts Extractor.
      Return STRICT JSON ONLY with this schema:
      {
        "candidateName": "string|null",
        "emails": ["string"],
        "phones": ["string"],
        "experience": [
          {
            "company": "string|null",
            "title": "string|null",
            "start": "YYYY-MM|null",
            "end": "YYYY-MM|null",
            "isCurrent": true|false,
            "technologies": ["string"]
          }
        ],
        "projects": [
          {
            "name": "string|null",
            "stack": ["string"]
          }
        ],
        "skills": [
          { "name": "string" }
        ]
      }
      Output RAW JSON only.
      """;

  private static final String ANALYSIS_SYSTEM_PROMPT = """
      You are a specialized Risk & Consistency Analysis AI for Technical Hiring.
      Goal: identify INCONSISTENCIES, RISKS, and AREAS FOR VERIFICATION.

      OUTPUT: STRICT JSON matching:
      {
        "overallRiskScore": 0-100,
        "overallConsistencyScore": 0-100,
        "verificationPriorityScore": 0-100,
        "timelineRiskScore": 0-100,
        "skillInflationRiskScore": 0-100,
        "projectCredibilityRiskScore": 0-100,
        "authorshipRiskScore": 0-100,
        "confidenceScore": 0-100,
        "summary": "3-5 lines",
        "redFlags": [
          { "category": "TIMELINE|SKILLS|PROJECTS|GENERAL", "severity": "HIGH|MEDIUM|LOW", "description": "..." }
        ],
        "evidence": [
          { "category": "SKILL_INFLATION", "excerpt": "...", "locationHint": "..." }
        ],
        "interviewQuestions": {
          "Topic": ["..."]
        }
      }
      Output RAW JSON only.
      """;

  private static final String GENERAL_ANALYSIS_SYSTEM_PROMPT = """
      You are a Resume Audit AI.
      Goal: Analyze the resume for general quality, consistency, and professional presentation.
      Ignore "Job Fit" as there is no specific job context. Focus on:
      1. Timeline Gaps & Overlaps
      2. Skill Inflation (Listing too many tools without context)
      3. Project Credibility (Vague descriptions)
      4. Formatting/Presentation Quality

      OUTPUT: STRICT JSON matching:
      {
        "overallRiskScore": 0-100,
        "overallConsistencyScore": 0-100,
        "verificationPriorityScore": 0-100,
        "timelineRiskScore": 0-100,
        "skillInflationRiskScore": 0-100,
        "projectCredibilityRiskScore": 0-100,
        "authorshipRiskScore": 0-100,
        "confidenceScore": 0-100,
        "summary": "General resume audit summary (3-5 lines)",
        "redFlags": [
          { "category": "TIMELINE|SKILLS|PROJECTS|PRESENTATION", "severity": "HIGH|MEDIUM|LOW", "description": "..." }
        ],
        "evidence": [
          { "category": "GENERAL_AUDIT", "excerpt": "...", "locationHint": "..." }
        ],
        "interviewQuestions": {
          "General": ["..."]
        }
      }
      Output RAW JSON only.
      """;

  /**
   * Asynchronously analyze an application's resume.
   * This method is fire-and-forget - the caller doesn't wait for results.
   * Uses the dedicated "analysisExecutor" thread pool for proper resource
   * management.
   * 
   * @param applicationId The ID of the application to analyze
   */
  @Async("analysisExecutor")
  public void analyzeApplicationAsync(java.util.UUID applicationId) {
    try {
      log.info("Starting async analysis for application ID: {} on thread: {}",
          applicationId, Thread.currentThread().getName());
      analyzeApplication(applicationId);
      log.info("Completed async analysis for application ID: {}", applicationId);
    } catch (Exception e) {
      // Log error but don't rethrow - async failures shouldn't propagate
      log.error("Async analysis failed for application ID: {} - Error: {}",
          applicationId, e.getMessage(), e);
    }
  }

  @Transactional
  public ResumeAnalysis analyzeApplication(java.util.UUID applicationId) {
    log.info("Starting analysis for application ID: {}", applicationId);
    objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    // Use findByIdWithJob to eagerly fetch Job and avoid
    // LazyInitializationException
    JobApplication application = applicationRepository.findByIdWithJob(applicationId)
        .orElseThrow(() -> new RuntimeException("Application not found"));

    if (application.getResumeText() == null || application.getResumeText().isBlank()) {
      throw new RuntimeException("No resume text available for analysis.");
    }

    Job job = null;
    try {
      if (application.getJob() != null) {
        job = application.getJob();
      }
    } catch (Exception e) {
      log.warn("Unable to fetch Job context", e);
    }

    String resumeText = normalize(application.getResumeText());

    // PASS A
    String factsJson = extractFacts(resumeText);
    Map<String, Object> factsMap = tryParseJsonMap(factsJson);

    // Derived Signals (Simplified for this port)
    Map<String, Object> derivedSignals = deriveSignals(job, application, resumeText, factsMap);

    // RAG Query
    String ragQuery = "Analyze resume for role: " + (job != null ? job.getTitle() : "Unknown");
    List<Document> rubricDocs = rubricService.retrieveRelevantRubric(ragQuery);
    String rubricContext = rubricDocs.stream().map(Document::getText).collect(Collectors.joining("\n"));

    // PASS B
    String analysisJson = score(job, application, resumeText, factsJson, derivedSignals, rubricContext);

    try {
      AnalysisResultDTO dto = objectMapper.readValue(analysisJson, AnalysisResultDTO.class);

      ResumeAnalysis analysis = new ResumeAnalysis();
      analysis.setApplicationId(application.getId());
      analysis.setModel("gemini-pro");

      analysis.setOverallRiskScore(dto.getOverallRiskScore());
      analysis.setOverallConsistencyScore(dto.getOverallConsistencyScore());
      analysis.setVerificationPriorityScore(dto.getVerificationPriorityScore());
      analysis.setTimelineRiskScore(dto.getTimelineRiskScore());
      analysis.setSkillInflationRiskScore(dto.getSkillInflationRiskScore());
      analysis.setProjectCredibilityRiskScore(dto.getProjectCredibilityRiskScore());
      analysis.setAuthorshipRiskScore(dto.getAuthorshipRiskScore());
      analysis.setConfidenceScore(dto.getConfidenceScore());
      analysis.setSummary(dto.getSummary());

      analysis.setRedFlagsJson(objectMapper.writeValueAsString(dto.getRedFlags()));
      analysis.setEvidenceJson(objectMapper.writeValueAsString(dto.getEvidence()));
      analysis.setInterviewQuestionsJson(objectMapper.writeValueAsString(dto.getInterviewQuestions()));

      analysisRepository.findTopByApplicationIdOrderByAnalyzedAtDesc(applicationId)
          .ifPresent(prev -> analysis.setVersion(prev.getVersion() + 1));

      ResumeAnalysis savedAnalysis = analysisRepository.save(analysis);

      // Notify relevant users about analysis completion
      try {
        String riskLevel = dto.getOverallRiskScore() >= 70 ? "HIGH"
            : dto.getOverallRiskScore() >= 40 ? "MEDIUM" : "LOW";
        String candidateName = application.getFirstName() + " " + application.getLastName();

        // Notify org admins
        if (job != null && job.getOrganization() != null) {
          var admins = employeeRepository.findByOrganizationId(job.getOrganization().getId());
          for (var admin : admins) {
            notificationService.sendNotification(
                com.solventek.silverwind.notifications.NotificationService.NotificationBuilder.create()
                    .recipient(admin.getId())
                    .title("🤖 AI Analysis Complete")
                    .body("Resume analysis for " + candidateName + " is ready. "
                        + "Risk Score: " + dto.getOverallRiskScore() + "% (" + riskLevel + "). "
                        + "Consistency: " + dto.getOverallConsistencyScore() + "%")
                    .category(
                        com.solventek.silverwind.notifications.Notification.NotificationCategory.ANALYSIS)
                    .priority(dto.getOverallRiskScore() >= 70
                        ? com.solventek.silverwind.notifications.Notification.NotificationPriority.HIGH
                        : com.solventek.silverwind.notifications.Notification.NotificationPriority.NORMAL)
                    .refEntity("APPLICATION", applicationId)
                    .actionUrl("/applications/" + applicationId)
                    .icon("bi-robot")
                    .withMetadata("riskScore", dto.getOverallRiskScore())
                    .withMetadata("consistencyScore", dto.getOverallConsistencyScore())
                    .withMetadata("riskLevel", riskLevel));
          }
        }
      } catch (Exception e) {
        log.warn("Failed to send analysis complete notification", e);
      }

      return savedAnalysis;

    } catch (JsonProcessingException e) {
      log.error("AI response parse failed", e);
      throw new RuntimeException("AI Analysis failed", e);
    }
  }

  public com.solventek.silverwind.recruitment.CandidateDTO.ParsedResume extractCandidateData(String resumeText) {
    String factsJson = extractFactsDeep(resumeText);
    ObjectMapper lenientMapper = buildLenientMapper();

    // First attempt: parse with lenient mapper (handles unquoted keys, single
    // quotes, etc.)
    try {
      return lenientMapper.readValue(factsJson,
          com.solventek.silverwind.recruitment.CandidateDTO.ParsedResume.class);
    } catch (JsonProcessingException firstEx) {
      log.warn("Initial JSON parse failed ({}), attempting JSON repair...", firstEx.getMessage());
    }

    // Second attempt: repair common Gemini double-brace issue then re-parse.
    // Gemini sometimes wraps array items in double braces: [{ {field:val} }]
    // The resume schema has no legitimately double-nested anonymous objects,
    // so { { → { and } } → } is safe here.
    String repairedJson = repairAiJson(factsJson);
    try {
      return lenientMapper.readValue(repairedJson,
          com.solventek.silverwind.recruitment.CandidateDTO.ParsedResume.class);
    } catch (JsonProcessingException e) {
      log.error("Failed to parse extracted facts into DTO after repair (json snippet: {})",
          factsJson.length() > 200 ? factsJson.substring(0, 200) : factsJson, e);
      throw new RuntimeException("Resume parsing failed", e);
    }
  }

  /** Lenient Jackson mapper that tolerates common Gemini JSON quirks. */
  private ObjectMapper buildLenientMapper() {
    com.fasterxml.jackson.core.JsonFactory factory = com.fasterxml.jackson.core.JsonFactory.builder()
        .enable(com.fasterxml.jackson.core.json.JsonReadFeature.ALLOW_UNQUOTED_FIELD_NAMES)
        .enable(com.fasterxml.jackson.core.json.JsonReadFeature.ALLOW_SINGLE_QUOTES)
        .enable(com.fasterxml.jackson.core.json.JsonReadFeature.ALLOW_TRAILING_COMMA)
        .enable(com.fasterxml.jackson.core.json.JsonReadFeature.ALLOW_JAVA_COMMENTS)
        .build();
    return new ObjectMapper(factory)
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
  }

  /**
   * Repair common AI JSON generation issues.
   * Gemini sometimes outputs double braces around array items: [{ {name: "x"} }]
   * Stripping {{ → { and }} → } fixes this. Safe for this schema because no
   * field in ParsedResume has a legitimately double-nested anonymous object.
   */
  private String repairAiJson(String json) {
    if (json == null)
      return "{}";
    String repaired = json
        .replaceAll("\\{\\s*\\{", "{")
        .replaceAll("\\}\\s*\\}", "}");
    log.debug("Repaired AI JSON (first 300 chars): {}",
        repaired.length() > 300 ? repaired.substring(0, 300) : repaired);
    return repaired;
  }

  public String extractFacts(String resumeText) {
    // Default to Light extraction for analysis
    return extractFacts(resumeText, LIGHT_EXTRACTION_SYSTEM_PROMPT);
  }

  public AnalysisResultDTO analyzeCandidate(String resumeText, String factsJson) {
    log.info("Running general candidate analysis");
    ChatClient chatClient = chatClientBuilder.build();

    String userContent = """
        RESUME TEXT: %s
        FACTS: %s
        """.formatted(resumeText, factsJson);

    Prompt prompt = new Prompt(List.of(
        new SystemMessage(GENERAL_ANALYSIS_SYSTEM_PROMPT),
        new UserMessage(userContent)));

    String raw = chatClient.prompt(prompt).call().content();
    String json = extractFirstJsonObject(raw);

    try {
      return objectMapper.readValue(json, AnalysisResultDTO.class);
    } catch (JsonProcessingException e) {
      log.error("Failed to parse general analysis result", e);
      // Return empty/safe default
      return new AnalysisResultDTO();
    }
  }

  public String extractFactsDeep(String resumeText) {
    return extractFacts(resumeText, DEEP_EXTRACTION_SYSTEM_PROMPT);
  }

  private String extractFacts(String resumeText, String systemPrompt) {
    log.debug("Extracting facts from resume text (length: {})", resumeText.length());
    ChatClient chatClient = chatClientBuilder.build();
    Prompt prompt = new Prompt(List.of(
        new SystemMessage(systemPrompt),
        new UserMessage("RESUME TEXT:\n" + resumeText)));
    String raw = chatClient.prompt(prompt).call().content();
    log.debug("Fact extraction complete");
    return extractFirstJsonObject(raw);
  }

  private String score(Job job, JobApplication app, String resumeText, String factsJson,
      Map<String, Object> derivedSignals, String rubricContext) {
    log.debug("Scoring application against job: {}", job != null ? job.getTitle() : "Unknown");
    ChatClient chatClient = chatClientBuilder.build();

    String userContent = """
        JOB CONTEXT: %s
        DERIVED SIGNALS: %s
        RESUME TEXT: %s
        FACTS: %s
        RUBRIC: %s
        """.formatted(
        job != null ? job.getTitle() + " " + job.getDescription() : "Unknown",
        safeToJson(derivedSignals),
        resumeText,
        factsJson,
        rubricContext);

    Prompt prompt = new Prompt(List.of(
        new SystemMessage(ANALYSIS_SYSTEM_PROMPT),
        new UserMessage(userContent)));

    String raw = chatClient.prompt(prompt).call().content();
    log.debug("Scoring complete");
    return extractFirstJsonObject(raw);
  }

  private Map<String, Object> deriveSignals(Job job, JobApplication app, String resumeText,
      Map<String, Object> factsMap) {
    log.trace("Deriving signals from resume text");
    Map<String, Object> m = new HashMap<>();
    m.put("numbersCount", countRegex(resumeText, "\\d+"));
    return m;
  }

  private String extractFirstJsonObject(String raw) {
    log.trace("Extracting JSON object from raw AI response");
    String s = raw == null ? "" : raw.trim();
    s = s.replaceAll("^```json\\s*", "").replaceAll("^```\\s*", "").replaceAll("\\s*```$", "").trim();
    int start = s.indexOf('{');
    int end = s.lastIndexOf('}');
    if (start >= 0 && end > start)
      return s.substring(start, end + 1).trim();
    return s;
  }

  private int countRegex(String text, String regex) {
    log.trace("Counting regex matches for pattern: {}", regex);
    if (text == null)
      return 0;
    Matcher m = Pattern.compile(regex).matcher(text);
    int c = 0;
    while (m.find())
      c++;
    return c;
  }

  private String normalize(String t) {
    log.trace("Normalizing text (length: {})", t != null ? t.length() : "null");
    return t == null ? "" : t.trim();
  }

  private Map<String, Object> tryParseJsonMap(String json) {
    log.trace("Attempting to parse JSON string");
    try {
      return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {
      });
    } catch (Exception e) {
      return Collections.emptyMap();
    }
  }

  private String safeToJson(Object o) {
    log.trace("Converting object to JSON safely");
    try {
      return objectMapper.writeValueAsString(o);
    } catch (Exception e) {
      return String.valueOf(o);
    }
  }
}
