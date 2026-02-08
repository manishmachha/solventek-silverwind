package com.solventek.silverwind.chat;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AI Orchestrator Service - Central routing for chat requests.
 * Classifies intents as POLICY (RAG) or ACTION (function calling).
 * Works identically in local-dev and prod environments.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AiOrchestratorService {

    private final ChatClient.Builder chatClientBuilder;
    private final RagService ragService;
    private final ToolRegistry toolRegistry;

    // Simple in-memory conversation history
    private final Map<String, StringBuilder> conversationHistory = new ConcurrentHashMap<>();
    private static final int MAX_HISTORY_LENGTH = 4000;

    private static final String ACTION_SYSTEM_PROMPT = """
            You are Nova, the Silverwind Employee Portal AI assistant.
            Today is {today}. Current user: {userId}.

            # Role
            You help employees manage their HR tasks including leave, attendance, payroll, tickets, and projects.

            # Conversation History
            {history}

            # Rules
            1. Always use tools to fetch real data - never make up information.
            2. If user asks for personal info (profile, leave, attendance), use the appropriate tool.
            3. For actionable requests (apply leave, create ticket), confirm with user before executing.
            4. Format responses nicely using markdown (tables, lists, headers).
            5. If a tool returns "Access denied" or error, explain it politely.
            6. Keep responses concise but complete.
            """;

    /**
     * Main entry point for handling chat requests.
     * 
     * @param userId The authenticated user's ID/email
     * @param message The user's message
     * @param explicitIntent Optional explicit intent from frontend ("POLICY" or "ACTION")
     * @return The AI response
     */
    /**
     * Main entry point for handling chat requests.
     * 
     * @param userId The authenticated user's ID/email
     * @param message The user's message
     * @param explicitIntent Optional explicit intent from frontend ("POLICY" or "ACTION")
     * @return The AI response stream
     */
    public String handleRequest(String userId, String message, String explicitIntent) {
        log.info("Handling request from {} | intent={} | msg={}", userId, explicitIntent, message);

        // Get or create conversation history
        StringBuilder history = conversationHistory.computeIfAbsent(userId, k -> new StringBuilder());

        // Append user message to history
        history.append("User: ").append(message).append("\n");
        trimHistory(history);

        String response;
        String intent = classifyIntent(history.toString(), message, explicitIntent);
        log.info("Classified intent: {}", intent);

        try {
            if ("ACTION".equalsIgnoreCase(intent)) {
                response = executeAction(userId, history.toString(), message);
            } else {
                // POLICY - use RAG service
                response = ragService.chat(message);
            }
        } catch (Exception e) {
            log.error("Error processing request", e);
            response = "I encountered an error processing your request. Please try again.";
        }

        history.append("Assistant: ").append(truncate(response, 500)).append("\n\n");
        trimHistory(history);
        
        return response;
    }

    /**
     * Classify intent as POLICY or ACTION.
     * If explicit intent provided, use it.
     * Otherwise, check if RAG has matches for the question.
     */
    private String classifyIntent(String history, String message, String explicitIntent) {
        // If frontend explicitly sets intent, respect it
        if (explicitIntent != null && !explicitIntent.isBlank()) {
            return explicitIntent.toUpperCase();
        }

        // Check if RAG has relevant matches - if so, treat as POLICY
        boolean hasRagMatches = ragService.hasMatches(message);
        if (hasRagMatches) {
            return "POLICY";
        }

        // Default to ACTION for operational queries
        return "ACTION";
    }

    /**
     * Execute an ACTION intent using Spring AI function calling.
     */
    private String executeAction(String userId, String history, String message) {
        String today = java.time.LocalDate.now().toString();

        PromptTemplate systemPt = new PromptTemplate(ACTION_SYSTEM_PROMPT);
        Prompt prompt = systemPt.create(Map.of(
                "today", today,
                "userId", userId,
                "history", history));

        // Build chat client with ToolRegistry (Spring AI discovers @Tool methods)
        ChatClient chatClient = chatClientBuilder
                .defaultSystem(prompt.getContents())
                .build();

        log.debug("Calling ChatClient with ToolRegistry tools");

        // Call with function calling enabled using ToolRegistry
        return chatClient
                .prompt()
                .user(message)
                .tools(toolRegistry)
                .call()
                .content();
    }

    /**
     * Trim history to prevent context overflow.
     */
    private void trimHistory(StringBuilder sb) {
        if (sb.length() > MAX_HISTORY_LENGTH) {
            int cut = sb.length() - MAX_HISTORY_LENGTH;
            sb.delete(0, cut);
        }
    }

    private String truncate(String s, int maxLen) {
        if (s == null)
            return "";
        return s.length() <= maxLen ? s : s.substring(0, maxLen) + "...";
    }

    /**
     * Clear conversation history for a user (optional utility).
     */
    public void clearHistory(String userId) {
        conversationHistory.remove(userId);
    }
}
