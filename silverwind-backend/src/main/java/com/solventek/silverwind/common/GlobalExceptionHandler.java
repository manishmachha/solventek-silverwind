package com.solventek.silverwind.common;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.core.AuthenticationException;
import org.springframework.util.StringUtils;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.*;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

        // -------------------------
        // 1) @Valid @RequestBody DTO validation
        // -------------------------
        @Override
        protected ResponseEntity<Object> handleMethodArgumentNotValid(
                        MethodArgumentNotValidException ex,
                        HttpHeaders headers,
                        HttpStatusCode status,
                        WebRequest request) {
                HttpServletRequest req = (HttpServletRequest) request.resolveReference(WebRequest.REFERENCE_REQUEST);

                List<ApiErrorResponse.FieldViolation> fieldViolations = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .map(this::toFieldViolation)
                                .toList();

                Map<String, String> summary = fieldViolations.stream()
                                .collect(Collectors.toMap(
                                                ApiErrorResponse.FieldViolation::getField,
                                                ApiErrorResponse.FieldViolation::getMessage,
                                                (a, b) -> a // keep first if duplicates
                                ));

                ApiErrorResponse body = base(req, 400, "VALIDATION_FAILED",
                                "Request validation failed. Fix the highlighted fields and try again.")
                                .setPointerIfNull("body")
                                .setValidation(ApiErrorResponse.ValidationDetails.builder()
                                                .count(fieldViolations.size())
                                                .fieldErrors(fieldViolations)
                                                .summary(summary)
                                                .build())
                                .setHints(List.of(
                                                "Check required fields (@NotNull/@NotBlank).",
                                                "Respect size limits (@Size), numeric limits (@Min/@Max), and patterns (@Pattern).",
                                                "If a field is an enum, send one of the allowed string values."));

                return ResponseEntity.badRequest().body(body);
        }

        // -------------------------
        // 2) Form/query binding validation (BindException)
        // -------------------------
        @ExceptionHandler(BindException.class)
        protected ResponseEntity<Object> handleBindException(
                        BindException ex,
                        HttpHeaders headers,
                        HttpStatus status,
                        WebRequest request) {
                HttpServletRequest req = (HttpServletRequest) request.resolveReference(WebRequest.REFERENCE_REQUEST);

                List<ApiErrorResponse.FieldViolation> fieldViolations = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .map(this::toFieldViolation)
                                .toList();

                ApiErrorResponse body = base(req, 400, "BINDING_FAILED",
                                "Request binding/validation failed. Check query/form fields.")
                                .setPointerIfNull("query/form")
                                .setValidation(ApiErrorResponse.ValidationDetails.builder()
                                                .count(fieldViolations.size())
                                                .fieldErrors(fieldViolations)
                                                .summary(fieldViolations.stream().collect(Collectors.toMap(
                                                                ApiErrorResponse.FieldViolation::getField,
                                                                ApiErrorResponse.FieldViolation::getMessage,
                                                                (a, b) -> a)))
                                                .build());

                return ResponseEntity.badRequest().body(body);
        }

        // -------------------------
        // 3) @Validated on @RequestParam/@PathVariable => ConstraintViolationException
        // -------------------------
        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
                        ConstraintViolationException ex,
                        HttpServletRequest req) {
                List<ApiErrorResponse.ParamViolation> paramErrors = ex.getConstraintViolations()
                                .stream()
                                .map(this::toParamViolation)
                                .toList();

                ApiErrorResponse body = base(req, 400, "PARAM_VALIDATION_FAILED",
                                "One or more request parameters are invalid.")
                                .setPointerIfNull("params/path")
                                .setValidation(ApiErrorResponse.ValidationDetails.builder()
                                                .count(paramErrors.size())
                                                .paramErrors(paramErrors)
                                                .build())
                                .setHints(List.of(
                                                "If this is a path variable, ensure it matches required format.",
                                                "If this is a query parameter, ensure datatype and constraints match (min/max/pattern)."));

                return ResponseEntity.badRequest().body(body);
        }

        // -------------------------
        // 4) Malformed JSON / wrong types / unknown property
        // -------------------------
        @Override
        protected ResponseEntity<Object> handleHttpMessageNotReadable(
                        HttpMessageNotReadableException ex,
                        HttpHeaders headers,
                        HttpStatusCode status,
                        WebRequest request) {
                HttpServletRequest req = (HttpServletRequest) request.resolveReference(WebRequest.REFERENCE_REQUEST);

                ApiErrorResponse.JsonDetails json = parseJacksonProblem(ex);

                ApiErrorResponse body = base(req, 400, "JSON_NOT_READABLE",
                                "Request body JSON is invalid and has wrong data types.")
                                .setPointerIfNull("body")
                                .setJson(json)
                                .setHints(List.of(
                                                "Ensure the request body is valid JSON (quotes, commas, brackets).",
                                                "Ensure field types match the API contract (number vs string, date format, etc.).",
                                                "Remove unknown fields if the backend does not accept them."))
                                .setCauses(shortCauses(ex));

                return ResponseEntity.badRequest().body(body);
        }

        // -------------------------
        // 5) Missing request param
        // -------------------------
        @Override
        protected ResponseEntity<Object> handleMissingServletRequestParameter(
                        MissingServletRequestParameterException ex,
                        HttpHeaders headers,
                        HttpStatusCode status,
                        WebRequest request) {
                HttpServletRequest req = (HttpServletRequest) request.resolveReference(WebRequest.REFERENCE_REQUEST);

                ApiErrorResponse body = base(req, 400, "MISSING_REQUEST_PARAMETER",
                                "Required query parameter is missing.")
                                .setPointerIfNull("query." + ex.getParameterName())
                                .setMeta(Map.of(
                                                "parameter", ex.getParameterName(),
                                                "expectedType", ex.getParameterType()))
                                .setHints(List.of("Add the missing query parameter and retry. Example: ?"
                                                + ex.getParameterName() + "=..."));

                return ResponseEntity.badRequest().body(body);
        }

        // -------------------------
        // 6) Method argument type mismatch e.g. ?age=abc where int expected
        // -------------------------
        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ApiErrorResponse> handleTypeMismatch(
                        MethodArgumentTypeMismatchException ex,
                        HttpServletRequest req) {
                String expected = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown";

                ApiErrorResponse body = base(req, 400, "TYPE_MISMATCH",
                                "A request parameter/path variable has the wrong type.")
                                .setPointerIfNull(ex.getName())
                                .setMeta(Map.of(
                                                "name", ex.getName(),
                                                "expectedType", expected,
                                                "receivedValue", safeValue(ex.getValue())))
                                .setHints(List.of("Send '" + ex.getName() + "' as type " + expected + "."));

                return ResponseEntity.badRequest().body(body);
        }

        // -------------------------
        // 7) Unsupported HTTP method
        // -------------------------
        @Override
        protected ResponseEntity<Object> handleHttpRequestMethodNotSupported(
                        HttpRequestMethodNotSupportedException ex,
                        HttpHeaders headers,
                        HttpStatusCode status,
                        WebRequest request) {
                HttpServletRequest req = (HttpServletRequest) request.resolveReference(WebRequest.REFERENCE_REQUEST);

                ApiErrorResponse body = base(req, 405, "METHOD_NOT_ALLOWED",
                                "This endpoint does not support the requested HTTP method.")
                                .setMeta(Map.of(
                                                "methodUsed", req.getMethod(),
                                                "supportedMethods",
                                                ex.getSupportedHttpMethods() == null ? List.of()
                                                                : ex.getSupportedHttpMethods()))
                                .setHints(List.of("Use one of the supported methods."));

                return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
        }

        // -------------------------
        // 8) Unsupported media type (wrong Content-Type)
        // -------------------------
        @Override
        protected ResponseEntity<Object> handleHttpMediaTypeNotSupported(
                        HttpMediaTypeNotSupportedException ex,
                        HttpHeaders headers,
                        HttpStatusCode status,
                        WebRequest request) {
                HttpServletRequest req = (HttpServletRequest) request.resolveReference(WebRequest.REFERENCE_REQUEST);

                ApiErrorResponse body = base(req, 415, "UNSUPPORTED_MEDIA_TYPE",
                                "Unsupported Content-Type. Send a supported media type.")
                                .setMeta(Map.of(
                                                "received",
                                                ex.getContentType() == null ? "unknown"
                                                                : ex.getContentType().toString(),
                                                "supported",
                                                ex.getSupportedMediaTypes().stream().map(MediaType::toString).toList()))
                                .setHints(List.of("Set header Content-Type: application/json"));

                return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(body);
        }

        // -------------------------
        // 9) Spring Security (Access Denied) - 403
        // Note: 401 usually happens before controller; handle via EntryPoint (see
        // section 3)
        // -------------------------
        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {

                String reason = ex.getMessage();
                if (reason == null || reason.isBlank()) {
                        reason = "You are authenticated but do not have permission to access this resource.";
                }

                ApiErrorResponse body = base(req, 403, "FORBIDDEN", reason)
                                .setSecurity(ApiErrorResponse.SecurityDetails.builder()
                                                .problem("FORBIDDEN")
                                                .detail(reason) // ✅ show actual reason
                                                .build())
                                .setHints(List.of(
                                                "If you are a normal user, you can update only your own profile.",
                                                "Only HR/ADMIN can update HR-controlled fields (department/designation/employmentType)."));

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
        }

        @ExceptionHandler(AuthorizationDeniedException.class)
        public ResponseEntity<ApiErrorResponse> handleAuthorizationDenied(
                        AuthorizationDeniedException ex,
                        HttpServletRequest req) {
                AuthorizationResult result = ex.getAuthorizationResult();

                String detail = ex.getMessage();
                if (detail == null || detail.isBlank()) {
                        detail = "Authorization was denied by the configured security policy.";
                }

                ApiErrorResponse body = base(req, 403, "FORBIDDEN",
                                "You are authenticated but do not have permission to access this resource.")
                                .setSecurity(ApiErrorResponse.SecurityDetails.builder()
                                                .problem("FORBIDDEN")
                                                .detail(detail)
                                                .build())
                                .setMeta(Map.of(
                                                "exception", "AuthorizationDeniedException",
                                                "authorizationResultType",
                                                (result == null ? null : result.getClass().getName()),
                                                "isGranted", (result == null ? null : result.isGranted()),
                                                "authorizationResult",
                                                (result == null ? null : String.valueOf(result))))
                                .setHints(List.of(
                                                "If you are updating another employee, only HR/ADMIN can do that.",
                                                "If you are a normal user, you can update only your own profile(self-update).",
                                                "If you tried changing department/designation/employmentType without HR/ADMIN privileges, it will be denied."));

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
        }

        // Optional: if authentication exceptions leak here (depends on config)
        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ApiErrorResponse> handleAuth(AuthenticationException ex, HttpServletRequest req) {
                ApiErrorResponse body = base(req, 401, "UNAUTHORIZED",
                                "Authentication required or failed.")
                                .setSecurity(ApiErrorResponse.SecurityDetails.builder()
                                                .problem("UNAUTHORIZED")
                                                .detail("Invalid or missing credentials/token.")
                                                .build());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }

        // -------------------------
        // 10) JWT errors (jjwt)
        // -------------------------
        @ExceptionHandler(ExpiredJwtException.class)
        public ResponseEntity<ApiErrorResponse> handleJwtExpired(ExpiredJwtException ex, HttpServletRequest req) {
                ApiErrorResponse body = base(req, 401, "JWT_EXPIRED",
                                "JWT token is expired. Please login again.")
                                .setSecurity(ApiErrorResponse.SecurityDetails.builder()
                                                .problem("JWT_EXPIRED")
                                                .detail(shortMsg(ex))
                                                .build())
                                .setHints(List.of("Get a new token via login and retry with Bearer <token>."));
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }

        @ExceptionHandler(JwtException.class)
        public ResponseEntity<ApiErrorResponse> handleJwtInvalid(JwtException ex, HttpServletRequest req) {
                ApiErrorResponse body = base(req, 401, "JWT_INVALID",
                                "JWT token is invalid.")
                                .setSecurity(ApiErrorResponse.SecurityDetails.builder()
                                                .problem("JWT_INVALID")
                                                .detail(shortMsg(ex))
                                                .build())
                                .setHints(List.of("Ensure you send header: Authorization: Bearer <token>"));
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }

        // -------------------------
        // 11) DB constraint violations (unique / FK / not-null)
        // -------------------------
        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ApiErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex,
                        HttpServletRequest req) {
                ApiErrorResponse.DbDetails db = parseDbProblem(ex);

                ApiErrorResponse body = base(req, 409, "DATA_INTEGRITY_VIOLATION",
                                "Database constraint violation. Your request conflicts with existing data or violates constraints.")
                                .setDatabase(db)
                                .setHints(List.of(
                                                "If this is a unique constraint: change the value to something not already used.",
                                                "If this is a foreign key constraint: ensure referenced record exists.",
                                                "If this is a not-null constraint: ensure required fields are provided."))
                                .setCauses(shortCauses(ex));

                return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
        }

        // -------------------------
        // 12) Fallback: IllegalArgument etc.
        // -------------------------
        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException ex,
                        HttpServletRequest req) {
                ApiErrorResponse body = base(req, 400, "BAD_REQUEST",
                                shortMsg(ex))
                                .setCauses(shortCauses(ex));
                return ResponseEntity.badRequest().body(body);
        }

        // -------------------------
        // 13) Final fallback: any uncaught exception
        // -------------------------
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiErrorResponse> handleAny(Exception ex, HttpServletRequest req) {
                String traceId = getOrCreateTraceId();
                log.error("Unhandled exception traceId={} path={} {}", traceId, req.getRequestURI(), ex.toString(), ex);

                ApiErrorResponse body = base(req, 500, "INTERNAL_ERROR",
                                "Unexpected error occurred. Please contact support with traceId.")
                                .setCauses(shortCauses(ex))
                                .setHints(List.of("If this persists, share traceId with backend team."));

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
        }

        // -------------------------
        // 13) Account Locked Exception
        // -------------------------
        @ExceptionHandler(LockedException.class)
        public ResponseEntity<ApiErrorResponse> handleLocked(LockedException ex, HttpServletRequest req) {
                ApiErrorResponse body = ApiErrorResponse.builder()
                                .timestamp(java.time.Instant.now().toString())
                                .status(423) // 423 Locked (WebDAV) - commonly used for locked accounts
                                .error(HttpStatus.LOCKED.name())
                                .errorCode("ACCOUNT_LOCKED")
                                .message("Your account is locked. Login is temporarily blocked.")
                                .path(req.getRequestURI())
                                .method(req.getMethod())
                                .traceId(java.util.UUID.randomUUID().toString())
                                .requestId(java.util.UUID.randomUUID().toString())
                                .security(ApiErrorResponse.SecurityDetails.builder()
                                                .problem("ACCOUNT_LOCKED")
                                                .detail(safeMsg(ex))
                                                .build())
                                .hints(List.of(
                                                "If you had multiple failed login attempts, wait and try again.",
                                                "Contact your admin/HR to unlock your account.",
                                                "If your system supports it, use 'Forgot Password' or account recovery."))
                                .build();

                return ResponseEntity.status(423).body(body);
        }

        private String safeMsg(Throwable t) {
                if (t == null || t.getMessage() == null)
                        return null;
                String s = t.getMessage();
                return s.length() > 200 ? s.substring(0, 200) + "..." : s;
        }

        // =========================================================
        // Helpers
        // =========================================================

        private ApiErrorResponse base(HttpServletRequest req, int status, String errorCode, String message) {
                String requestId = requestId(req);
                String traceId = getOrCreateTraceId();

                return ApiErrorResponse.builder()
                                .timestamp(java.time.Instant.now().toString())
                                .status(status)
                                .error(HttpStatus.valueOf(status).name())
                                .message(message)
                                .errorCode(errorCode)
                                .path(req != null ? req.getRequestURI() : null)
                                .method(req != null ? req.getMethod() : null)
                                .traceId(traceId)
                                .requestId(requestId)
                                .build();
        }

        private ApiErrorResponse.FieldViolation toFieldViolation(FieldError fe) {
                String constraint = guessConstraint(fe);

                return ApiErrorResponse.FieldViolation.builder()
                                .object(fe.getObjectName())
                                .field(fe.getField())
                                .rejectedValue(safeValue(fe.getRejectedValue()))
                                .message(fe.getDefaultMessage())
                                .constraint(constraint)
                                .expected(inferExpected(fe, constraint))
                                .codes(fe.getCodes() == null ? List.of() : Arrays.asList(fe.getCodes()))
                                .build();
        }

        private ApiErrorResponse.ParamViolation toParamViolation(ConstraintViolation<?> v) {
                String constraint = v.getConstraintDescriptor() != null
                                ? v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName()
                                : null;

                Map<String, Object> expected = v.getConstraintDescriptor() != null
                                ? new LinkedHashMap<>(v.getConstraintDescriptor().getAttributes())
                                : null;

                // Remove noisy keys commonly present
                if (expected != null) {
                        expected.remove("message");
                        expected.remove("groups");
                        expected.remove("payload");
                }

                String path = v.getPropertyPath() != null ? v.getPropertyPath().toString() : null;

                // best-effort param name (last node)
                String param = (path != null && path.contains(".")) ? path.substring(path.lastIndexOf('.') + 1) : path;

                return ApiErrorResponse.ParamViolation.builder()
                                .path(path)
                                .param(param)
                                .rejectedValue(safeValue(v.getInvalidValue()))
                                .message(v.getMessage())
                                .constraint(constraint)
                                .expected(expected)
                                .build();
        }

        private ApiErrorResponse.JsonDetails parseJacksonProblem(HttpMessageNotReadableException ex) {
                Throwable root = rootCause(ex);

                ApiErrorResponse.JsonDetails.JsonDetailsBuilder b = ApiErrorResponse.JsonDetails.builder()
                                .rawMessage(shortMsg(root));

                if (root instanceof UnrecognizedPropertyException upe) {
                        return b.problem("UNKNOWN_PROPERTY")
                                        .at("$.%s".formatted(upe.getPropertyName()))
                                        .expectedType("known property")
                                        .receivedValue(upe.getPropertyName())
                                        .build();
                }

                if (root instanceof InvalidFormatException ife) {
                        String at = "$" + ife.getPath().stream()
                                        .map(ref -> ref.getFieldName() != null ? "." + ref.getFieldName() : "")
                                        .collect(Collectors.joining());

                        String expected = ife.getTargetType() != null ? ife.getTargetType().getSimpleName() : "unknown";

                        return b.problem("INVALID_TYPE")
                                        .at(at.equals("$") ? "$" : at)
                                        .expectedType(expected)
                                        .receivedValue(safeValue(ife.getValue()))
                                        .build();
                }

                if (root instanceof MismatchedInputException mie) {
                        String at = "$" + mie.getPath().stream()
                                        .map(ref -> ref.getFieldName() != null ? "." + ref.getFieldName() : "")
                                        .collect(Collectors.joining());

                        String expected = mie.getTargetType() != null ? mie.getTargetType().getSimpleName() : "unknown";

                        return b.problem("MISMATCHED_INPUT")
                                        .at(at.equals("$") ? "$" : at)
                                        .expectedType(expected)
                                        .build();
                }

                // generic malformed JSON
                return b.problem("MALFORMED_JSON").build();
        }

        private ApiErrorResponse.DbDetails parseDbProblem(DataIntegrityViolationException ex) {
                String msg = Optional.ofNullable(rootCause(ex).getMessage()).orElse("");

                // Best-effort classification (PostgreSQL messages vary)
                String problem = "CONSTRAINT_VIOLATION";
                if (msg.toLowerCase().contains("duplicate key") || msg.toLowerCase().contains("unique constraint")) {
                        problem = "UNIQUE_VIOLATION";
                } else if (msg.toLowerCase().contains("violates foreign key constraint")) {
                        problem = "FK_VIOLATION";
                } else if (msg.toLowerCase().contains("null value")
                                && msg.toLowerCase().contains("violates not-null constraint")) {
                        problem = "NOT_NULL_VIOLATION";
                }

                return ApiErrorResponse.DbDetails.builder()
                                .problem(problem)
                                .detail(shorten(msg, 300))
                                .build();
        }

        private List<ApiErrorResponse.CauseDetails> shortCauses(Throwable ex) {
                List<ApiErrorResponse.CauseDetails> out = new ArrayList<>();
                Throwable cur = ex;
                int i = 0;
                while (cur != null && i < 5) {
                        out.add(ApiErrorResponse.CauseDetails.builder()
                                        .type(cur.getClass().getSimpleName())
                                        .message(shortMsg(cur))
                                        .build());
                        cur = cur.getCause();
                        i++;
                }
                return out;
        }

        private Throwable rootCause(Throwable t) {
                Throwable cur = t;
                while (cur.getCause() != null && cur.getCause() != cur)
                        cur = cur.getCause();
                return cur;
        }

        private String shortMsg(Throwable t) {
                if (t == null)
                        return null;
                return shorten(String.valueOf(t.getMessage()), 250);
        }

        private String shorten(String s, int max) {
                if (!StringUtils.hasText(s))
                        return s;
                if (s.length() <= max)
                        return s;
                return s.substring(0, max) + "...";
        }

        private Object safeValue(Object value) {
                if (value == null)
                        return null;
                String s = String.valueOf(value);

                // mask common secrets
                String lower = s.toLowerCase();
                if (lower.contains("bearer ") || lower.contains("token") || lower.contains("password")
                                || lower.contains("secret")) {
                        return "***";
                }

                // truncate huge values
                if (s.length() > 200)
                        return s.substring(0, 200) + "...";
                return value;
        }

        private String requestId(HttpServletRequest req) {
                if (req == null)
                        return UUID.randomUUID().toString();
                String hdr = req.getHeader("X-Request-Id");
                return StringUtils.hasText(hdr) ? hdr : UUID.randomUUID().toString();
        }

        private String getOrCreateTraceId() {
                // If you use MDC/trace frameworks, plug it here. For now: UUID.
                return UUID.randomUUID().toString();
        }

        private String guessConstraint(FieldError fe) {
                // Spring codes often look like: NotBlank.employeeCreateRequest.firstName
                if (fe.getCodes() == null)
                        return null;
                return Arrays.stream(fe.getCodes())
                                .map(code -> code.contains(".") ? code.substring(0, code.indexOf('.')) : code)
                                .findFirst()
                                .orElse(null);
        }

        private Map<String, Object> inferExpected(FieldError fe, String constraint) {
                // Best-effort: use arguments for Size/Min/Max/Pattern etc.
                if (constraint == null)
                        return null;

                Map<String, Object> expected = new LinkedHashMap<>();
                Object[] args = fe.getArguments();

                // For Size, Spring usually provides: [field, min, max] as resolvables (varies)
                if ("Size".equals(constraint) && args != null) {
                        // Try extracting numbers from args
                        List<Integer> nums = Arrays.stream(args)
                                        .map(String::valueOf)
                                        .map(this::tryParseInt)
                                        .filter(Objects::nonNull)
                                        .toList();
                        if (nums.size() >= 2) {
                                expected.put("min", nums.get(0));
                                expected.put("max", nums.get(1));
                        }
                }

                if ("Min".equals(constraint) || "Max".equals(constraint)) {
                        if (args != null) {
                                Integer n = Arrays.stream(args).map(String::valueOf).map(this::tryParseInt)
                                                .filter(Objects::nonNull)
                                                .findFirst().orElse(null);
                                if (n != null)
                                        expected.put(constraint.toLowerCase(), n);
                        }
                }

                if ("Pattern".equals(constraint)) {
                        // Pattern regexp is not always present here; if you want it always, set
                        // explicit message in annotation.
                        expected.put("hint", "Must match required pattern (see API docs or validation message).");
                }

                if (expected.isEmpty())
                        return null;
                return expected;
        }

        private Integer tryParseInt(String s) {
                try {
                        return Integer.valueOf(s);
                } catch (Exception e) {
                        return null;
                }
        }
}
