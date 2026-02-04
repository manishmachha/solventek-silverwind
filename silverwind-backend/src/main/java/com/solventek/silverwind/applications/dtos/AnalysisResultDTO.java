package com.solventek.silverwind.applications.dtos;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AnalysisResultDTO {
    private Integer overallRiskScore;
    private Integer overallConsistencyScore;
    private Integer verificationPriorityScore;

    private Integer timelineRiskScore;
    private Integer skillInflationRiskScore;
    private Integer projectCredibilityRiskScore;
    private Integer authorshipRiskScore;
    private Integer confidenceScore;

    private String summary;
    private List<RedFlag> redFlags;
    private List<Evidence> evidence;
    private Map<String, List<String>> interviewQuestions;

    @Data
    public static class RedFlag {
        private String category;
        private String severity;
        private String description;
    }

    @Data
    public static class Evidence {
        private String category;
        private String excerpt;
        private String locationHint;
    }
}
