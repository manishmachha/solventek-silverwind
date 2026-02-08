package com.solventek.silverwind.chat;

import com.solventek.silverwind.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * Chat API Controller for AI chatbot.
 * Requires authentication (JWT).
 * Works identically in local-dev and prod environments.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final AiOrchestratorService orchestratorService;

    /**
     * Main chat endpoint.
     * 
     * @param request Contains "message" and optional "intent" (POLICY or ACTION)
     * @param principal The authenticated user
     * @return Chat response with AI-generated content
     */
    /**
     * Main chat endpoint.
     * 
     * @param request Contains "message" and optional "intent" (POLICY or ACTION)
     * @param principal The authenticated user
     * @return Chat response stream
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> chat(
            @RequestBody Map<String, String> request,
            Principal principal) {

        String message = request.get("message");
        String intent = request.get("intent");

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("BAD_REQUEST", "Message cannot be empty"));
        }

        String userId = principal != null ? principal.getName() : "anonymous";
        log.info("Chat request from user: {} | intent: {} | message: {}", 
                 userId, intent, truncate(message, 100));

        String response = orchestratorService.handleRequest(userId, message, intent);
        
        return ResponseEntity.ok(ApiResponse.success(Map.of("response", response)));
    }

    /**
     * Clear conversation history for the current user.
     */
    @DeleteMapping("/history")
    public ResponseEntity<ApiResponse<Void>> clearHistory(Principal principal) {
        String userId = principal != null ? principal.getName() : "anonymous";
        orchestratorService.clearHistory(userId);
        log.info("Cleared conversation history for user: {}", userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() <= maxLen ? s : s.substring(0, maxLen) + "...";
    }
}
