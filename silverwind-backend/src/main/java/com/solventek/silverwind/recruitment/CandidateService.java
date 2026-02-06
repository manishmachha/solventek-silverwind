package com.solventek.silverwind.recruitment;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solventek.silverwind.applications.JobApplication;
import com.solventek.silverwind.applications.JobApplicationRepository;
import com.solventek.silverwind.applications.ResumeAnalysisOrchestratorService;
import com.solventek.silverwind.applications.ResumeIngestionService;
import com.solventek.silverwind.org.Organization;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final ResumeIngestionService resumeIngestionService;
    private final ResumeAnalysisOrchestratorService resumeAnalysisService;
    private final ObjectMapper objectMapper;

    @Transactional
    public Candidate createFromResume(MultipartFile file, UUID organizationId) {
        log.info("Creating candidate from resume for Org: {}", organizationId);

        // 1. Ingest and Extract Text
        var ingestionResult = resumeIngestionService.storeAndExtract(file);

        // 2. Parse Data using AI
        CandidateDTO.ParsedResume parsedData;
        try {
            parsedData = resumeAnalysisService.extractCandidateData(ingestionResult.extractedText());
        } catch (Exception e) {
            log.error("Resume parsing failed, proceeding with basic file creation", e);
            parsedData = new CandidateDTO.ParsedResume();
            parsedData.setCandidateName("Unknown Candidate");
        }

        // 3. Map to Entity
        Candidate candidate = new Candidate();
        
        // Name
        if (parsedData.getCandidateName() != null) {
            String[] parts = parsedData.getCandidateName().split(" ", 2);
            candidate.setFirstName(parts[0]);
            candidate.setLastName(parts.length > 1 ? parts[1] : "");
        } else {
            candidate.setFirstName("Unknown");
            candidate.setLastName("Candidate");
        }

        // Contact
        if (parsedData.getEmails() != null && !parsedData.getEmails().isEmpty()) {
            candidate.setEmail(parsedData.getEmails().get(0));
        } else {
            candidate.setEmail("unknown@example.com"); // Placeholder, should be user editable
        }

        if (parsedData.getPhones() != null && !parsedData.getPhones().isEmpty()) {
            candidate.setPhone(parsedData.getPhones().get(0));
        }

        // Location
        if (parsedData.getCity() != null) {
            String loc = parsedData.getCity();
            if (parsedData.getState() != null) loc += ", " + parsedData.getState();
            if (parsedData.getCountry() != null) loc += ", " + parsedData.getCountry();
            candidate.setCity(loc);
        }
        
        // URLs & Summary
        candidate.setLinkedInUrl(parsedData.getLinkedInUrl());
        candidate.setSummary(parsedData.getSummary());

        // Skills
        if (parsedData.getSkills() != null) {
            candidate.setSkills(parsedData.getSkills().stream()
                    .map(CandidateDTO.ParsedSkill::getName)
                    .collect(Collectors.toList()));
        }

        // JSON Details
        try {
            if (parsedData.getExperience() != null) {
                candidate.setExperienceDetailsJson(objectMapper.writeValueAsString(parsedData.getExperience()));

                // Experience Years
                if (parsedData.getTotalExperienceYears() != null) {
                    candidate.setExperienceYears(parsedData.getTotalExperienceYears());
                } else {
                     // Fallback: Estimate from experience list if needed, or default to 0
                     candidate.setExperienceYears(0.0);
                }
                
                // Set current designation if present
                parsedData.getExperience().stream()
                    .filter(e -> Boolean.TRUE.equals(e.getIsCurrent()))
                    .findFirst()
                    .ifPresent(e -> candidate.setCurrentDesignation(e.getTitle()));
            }
            
            if (parsedData.getEducation() != null) {
                candidate.setEducationDetailsJson(objectMapper.writeValueAsString(parsedData.getEducation()));
            }

            // 4. Run General AI Analysis
            try {
                // We need facts as JSON string. We can re-serialize parsedData or just use what we have.
                String factsJson = objectMapper.writeValueAsString(parsedData);
                var analysisResult = resumeAnalysisService.analyzeCandidate(ingestionResult.extractedText(), factsJson);
                candidate.setAiAnalysisJson(objectMapper.writeValueAsString(analysisResult));
            } catch (Exception e) {
                log.error("Failed to run general analysis", e);
                // Non-blocking, continue
            }

        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize candidate details", e);
        }

        // Resume Metadata
        candidate.setResumeFilePath(ingestionResult.filePath());
        candidate.setResumeOriginalFileName(file.getOriginalFilename());
        candidate.setResumeContentType(file.getContentType());
        
        // Organization
        Organization org = new Organization();
        org.setId(organizationId);
        candidate.setOrganization(org);

        return candidateRepository.save(candidate);
    }

    public List<Candidate> getAllCandidates(UUID organizationId) {
        // Vendors see only their own. Solventek might want to see all or specific ones.
        // For now, simple by Org ID. If Solventek wants all, we'd need a different method or check types.
        return candidateRepository.findByOrganizationId(organizationId);
    }
    
    // For Solventek to see all candidates (e.g., when viewing applications or searching pool)
    public List<Candidate> getAllCandidatesForAdmin() {
        return candidateRepository.findAll(); 
    }

    public Candidate getCandidate(UUID id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Candidate not found"));
    }

    @Transactional
    public Candidate updateCandidate(UUID id, CandidateDTO.UpdateRequest request) {
        Candidate c = getCandidate(id);
        c.setFirstName(request.getFirstName());
        c.setLastName(request.getLastName());
        c.setEmail(request.getEmail());
        c.setPhone(request.getPhone());
        c.setCity(request.getCity());
        c.setCurrentDesignation(request.getCurrentDesignation());
        c.setExperienceYears(request.getExperienceYears());
        c.setSkills(request.getSkills());
        c.setSummary(request.getSummary());
        c.setLinkedInUrl(request.getLinkedInUrl());
        return candidateRepository.save(c);
    }

    @Transactional
    public void deleteCandidate(UUID id) {
        // Unlink applications first
        List<JobApplication> applications = jobApplicationRepository.findByCandidateId(id);
        for (JobApplication app : applications) {
            app.setCandidate(null);
        }
        jobApplicationRepository.saveAll(applications);

        candidateRepository.deleteById(id);
    }
    
    public Resource getResumeFile(UUID id) {
        Candidate c = getCandidate(id);
        if (c.getResumeFilePath() == null) {
            throw new RuntimeException("No resume file associated with this candidate");
        }
        return resumeIngestionService.downloadResume(c.getResumeFilePath());
    }

    @Transactional
    public Candidate updateResume(UUID id, MultipartFile file) {
        log.info("Updating resume for Candidate ID: {}", id);
        Candidate candidate = getCandidate(id);

        // 1. Ingest and Extract Text
        var ingestionResult = resumeIngestionService.storeAndExtract(file);

        // 2. Parse Data (Reuse creation logic mostly, but update existing entity)
        CandidateDTO.ParsedResume parsedData;
        try {
            parsedData = resumeAnalysisService.extractCandidateData(ingestionResult.extractedText());
        } catch (Exception e) {
            log.error("Resume parsing failed during update", e);
            throw new RuntimeException("Failed to parse new resume", e);
        }

        // 3. Update Entity Fields
        // Name (Optional: Only update if strictly valid, or maybe overwrite? Let's overwrite for now as resume is source of truth)
        if (parsedData.getCandidateName() != null) {
            String[] parts = parsedData.getCandidateName().split(" ", 2);
            candidate.setFirstName(parts[0]);
            candidate.setLastName(parts.length > 1 ? parts[1] : "");
        }

        // Contact
        if (parsedData.getEmails() != null && !parsedData.getEmails().isEmpty()) {
            candidate.setEmail(parsedData.getEmails().get(0));
        }

        if (parsedData.getPhones() != null && !parsedData.getPhones().isEmpty()) {
            candidate.setPhone(parsedData.getPhones().get(0));
        }

        // Location
        if (parsedData.getCity() != null) {
            String loc = parsedData.getCity();
            if (parsedData.getState() != null) loc += ", " + parsedData.getState();
            if (parsedData.getCountry() != null) loc += ", " + parsedData.getCountry();
            candidate.setCity(loc);
        }

        // URLs & Summary
        candidate.setLinkedInUrl(parsedData.getLinkedInUrl());
        candidate.setPortfolioUrl(parsedData.getPortfolioUrl());
        candidate.setSummary(parsedData.getSummary());

        // Skills
        if (parsedData.getSkills() != null) {
            candidate.setSkills(parsedData.getSkills().stream()
                    .map(CandidateDTO.ParsedSkill::getName)
                    .collect(Collectors.toList()));
        }

        // JSON Details
        try {
            if (parsedData.getExperience() != null) {
                candidate.setExperienceDetailsJson(objectMapper.writeValueAsString(parsedData.getExperience()));

                // Experience Years
                if (parsedData.getTotalExperienceYears() != null) {
                    candidate.setExperienceYears(parsedData.getTotalExperienceYears());
                }

                // Set current designation/company if present
                parsedData.getExperience().stream()
                    .filter(e -> Boolean.TRUE.equals(e.getIsCurrent()))
                    .findFirst()
                    .ifPresent(e -> {
                        candidate.setCurrentDesignation(e.getTitle());
                        candidate.setCurrentCompany(e.getCompany());
                    });
            }

            if (parsedData.getEducation() != null) {
                candidate.setEducationDetailsJson(objectMapper.writeValueAsString(parsedData.getEducation()));
            }

            // 4. Run General AI Analysis (Update)
            try {
                String factsJson = objectMapper.writeValueAsString(parsedData);
                var analysisResult = resumeAnalysisService.analyzeCandidate(ingestionResult.extractedText(), factsJson);
                candidate.setAiAnalysisJson(objectMapper.writeValueAsString(analysisResult));
            } catch (Exception e) {
                log.error("Failed to run general analysis during update", e);
            }

        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize candidate details", e);
        }

        // Resume Metadata
        candidate.setResumeFilePath(ingestionResult.filePath());
        candidate.setResumeOriginalFileName(file.getOriginalFilename());
        candidate.setResumeContentType(file.getContentType());

        return candidateRepository.save(candidate);
    }
}
