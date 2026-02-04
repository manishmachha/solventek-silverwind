package com.solventek.silverwind.recruitment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

public class CandidateDTO {

    @Data
    public static class CreateRequest {
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String city;
        private String currentDesignation;
        private String currentCompany;
        private Double experienceYears;
        private List<String> skills;
        private String summary;
        private String linkedInUrl;
        private String portfolioUrl;
    }

    @Data
    public static class UpdateRequest {
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String city;
        private String currentDesignation;
        private String currentCompany;
        private Double experienceYears;
        private List<String> skills;
        private String summary;
        private String linkedInUrl;
        private String portfolioUrl;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ParsedResume {
        private String candidateName;
        private List<String> emails;
        private List<String> phones;
        private String city;
        private String state; // Optional, good to have
        private String country;
        private String summary;
        private String linkedInUrl;
        private String portfolioUrl;
        private Double totalExperienceYears;
        private List<ParsedExperience> experience;
        private List<ParsedEducation> education;
        private List<ParsedProject> projects;
        private List<ParsedSkill> skills;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ParsedEducation {
        private String institution;
        private String degree;
        private String fieldOfStudy;
        private String startYear;
        private String endYear;
    }


    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ParsedProject {
        private String name;
        private List<String> stack;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ParsedSkill {
        private String name;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ParsedExperience {
        private String company;
        private String title;
        private String start;
        private String end;
        private Boolean isCurrent;
        private String description;
        private List<String> technologies;
    }
}
