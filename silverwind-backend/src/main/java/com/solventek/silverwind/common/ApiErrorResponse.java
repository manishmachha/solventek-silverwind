package com.solventek.silverwind.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    /** RFC3339 timestamp */
    private String timestamp;

    /** HTTP status code */
    private int status;

    /** HTTP reason phrase e.g. BAD_REQUEST */
    private String error;

    /** High-level message */
    private String message;

    /** Your stable machine-readable code */
    private String errorCode;

    /** Request path e.g. /api/employees */
    private String path;

    /** HTTP method e.g. POST */
    private String method;

    /** Correlation/trace id (useful for logs) */
    private String traceId;

    /** If client sends X-Request-Id we echo it; else generated */
    private String requestId;

    /** Optional: which header/param/field caused issue (quick pointer) */
    private String pointer;

    /** Optional: Validation details */
    private ValidationDetails validation;

    /** Optional: JSON parse / type details */
    private JsonDetails json;

    /** Optional: DB constraint details */
    private DbDetails database;

    /** Optional: Security details */
    private SecurityDetails security;

    /** Optional: extra context */
    private Map<String, Object> meta;

    /** Optional: nested causes */
    private List<CauseDetails> causes;

    /** Optional: help/hints */
    private List<String> hints;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CauseDetails {
        private String type;
        private String message;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ValidationDetails {
        /** Total errors count */
        private int count;

        /** Field errors for DTOs/forms */
        private List<FieldViolation> fieldErrors;

        /** Constraint violations for request params/path variables */
        private List<ParamViolation> paramErrors;

        /** Quick summary: field -> message */
        private Map<String, String> summary;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FieldViolation {
        private String object; // e.g. EmployeeCreateRequest
        private String field; // e.g. firstName
        private Object rejectedValue; // safe value (masked/truncated)
        private String message; // user-friendly message
        private String constraint; // e.g. NotBlank / Size / Email
        private Map<String, Object> expected; // e.g. {min:2,max:60}
        private List<String> codes; // Spring codes for debugging
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ParamViolation {
        private String path; // e.g. create.arg0.id OR request param path
        private String param; // e.g. id
        private Object rejectedValue;
        private String message;
        private String constraint; // e.g. Min / Pattern
        private Map<String, Object> expected;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class JsonDetails {
        private String problem; // e.g. MALFORMED_JSON / INVALID_TYPE / UNKNOWN_PROPERTY
        private String at; // json path e.g. $.dob
        private String expectedType; // e.g. LocalDate
        private Object receivedValue; // e.g. "abc"
        private String rawMessage; // original jackson message (short)
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DbDetails {
        private String problem; // e.g. UNIQUE_VIOLATION / FK_VIOLATION / NOT_NULL
        private String constraintName; // if available
        private String detail; // safe short detail
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SecurityDetails {
        private String problem; // UNAUTHORIZED / FORBIDDEN / JWT_INVALID / JWT_EXPIRED
        private String detail;
    }

    public ApiErrorResponse setPointerIfNull(String p) {
        if (this.pointer == null)
            this.pointer = p;
        return this;
    }

    public ApiErrorResponse setValidation(ValidationDetails v) {
        this.validation = v;
        return this;
    }

    public ApiErrorResponse setJson(JsonDetails j) {
        this.json = j;
        return this;
    }

    public ApiErrorResponse setDatabase(DbDetails d) {
        this.database = d;
        return this;
    }

    public ApiErrorResponse setSecurity(SecurityDetails s) {
        this.security = s;
        return this;
    }

    public ApiErrorResponse setMeta(Map<String, Object> m) {
        this.meta = m;
        return this;
    }

    public ApiErrorResponse setCauses(List<CauseDetails> c) {
        this.causes = c;
        return this;
    }

    public ApiErrorResponse setHints(List<String> h) {
        this.hints = h;
        return this;
    }

}
