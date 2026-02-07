package com.solventek.silverwind.feature.profile.service;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.feature.profile.entity.*;
import com.solventek.silverwind.feature.profile.repository.*;
import com.solventek.silverwind.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileService {

    private final EmployeeRepository employeeRepository;
    private final DocumentRepository documentRepository;
    private final EducationRepository educationRepository;
    private final CertificationRepository certificationRepository;
    private final WorkExperienceRepository workExperienceRepository;
    private final SkillRepository skillRepository;
    private final StorageService storageService;

    // --- Helper to get Employee ---
    private Employee getEmployee(UUID employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
    }

    // --- Documents ---
    public List<Document> getDocuments(UUID employeeId) {
        return documentRepository.findByEmployeeId(employeeId);
    }

    public Document uploadDocument(UUID employeeId, MultipartFile file, String documentType, String documentName) {
        Employee employee = getEmployee(employeeId);

        String storageKey = storageService.upload(file, "employees/" + employee.getEmail() + "/documents");
        String fileUrl = storageService.getPresignedUrl(storageKey, null); // Or just null if dynamic

        Document document = Document.builder()
                .employee(employee)
                .documentType(documentType)
                .documentName(documentName != null ? documentName : file.getOriginalFilename())
                .fileUrl(fileUrl) // Store initial URL, but typically regenerate on get
                .storageKey(storageKey)
                .build();

        return documentRepository.save(document);
    }

    public void deleteDocument(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        
        if (document.getStorageKey() != null) {
            try {
                storageService.delete(document.getStorageKey());
            } catch (Exception e) {
                // Log but proceed
            }
        }
        documentRepository.delete(document);
    }

    public Resource downloadDocument(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        return storageService.download(document.getStorageKey());
    }

    // --- Education ---
    public List<Education> getEducation(UUID employeeId) {
        return educationRepository.findByEmployeeIdOrderByStartDateDesc(employeeId);
    }

    public Education addEducation(UUID employeeId, Education education) {
        education.setEmployee(getEmployee(employeeId));
        return educationRepository.save(education);
    }

    public Education updateEducation(UUID educationId, Education educationDetails) {
        Education education = educationRepository.findById(educationId)
                .orElseThrow(() -> new RuntimeException("Education not found"));
        
        education.setInstitution(educationDetails.getInstitution());
        education.setDegree(educationDetails.getDegree());
        education.setFieldOfStudy(educationDetails.getFieldOfStudy());
        education.setStartDate(educationDetails.getStartDate());
        education.setEndDate(educationDetails.getEndDate());
        education.setGrade(educationDetails.getGrade());
        education.setDescription(educationDetails.getDescription());

        return educationRepository.save(education);
    }

    public void deleteEducation(UUID educationId) {
        educationRepository.deleteById(educationId);
    }

    // --- Certifications ---
    public List<Certification> getCertifications(UUID employeeId) {
        return certificationRepository.findByEmployeeIdOrderByIssueDateDesc(employeeId);
    }

    public Certification addCertification(UUID employeeId, Certification certification) {
        certification.setEmployee(getEmployee(employeeId));
        return certificationRepository.save(certification);
    }

    public void deleteCertification(UUID certificationId) {
        certificationRepository.deleteById(certificationId);
    }

    // --- Work Experience ---
    public List<WorkExperience> getWorkExperience(UUID employeeId) {
        return workExperienceRepository.findByEmployeeIdOrderByStartDateDesc(employeeId);
    }

    public WorkExperience addWorkExperience(UUID employeeId, WorkExperience experience) {
        experience.setEmployee(getEmployee(employeeId));
        return workExperienceRepository.save(experience);
    }

    public void deleteWorkExperience(UUID experienceId) {
        workExperienceRepository.deleteById(experienceId);
    }

    // --- Skills ---
    public List<Skill> getSkills(UUID employeeId) {
        return skillRepository.findByEmployeeId(employeeId);
    }

    public Skill addSkill(UUID employeeId, Skill skill) {
        skill.setEmployee(getEmployee(employeeId));
        return skillRepository.save(skill);
    }

    public void deleteSkill(UUID skillId) {
        skillRepository.deleteById(skillId);
    }
}
