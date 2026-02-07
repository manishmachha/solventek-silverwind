package com.solventek.silverwind.notifications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Async email service - sends emails without blocking the calling thread.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender emailSender;

    /**
     * Sends email asynchronously so it doesn't block the primary flow.
     * Uses the default taskExecutor from AsyncConfig.
     */
    @Async
    public void sendSimpleMessage(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            log.info("Sending email to {} (async)", to);
            message.setFrom("hr.alerts@solventek.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            emailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            // Don't rethrow - email failure shouldn't affect main flow
        }
    }

    /**
     * Sends a rich HTML email asynchronously.
     */
    @Async
    public void sendRichMessage(String to, String subject, String htmlBody) {
        try {
            jakarta.mail.internet.MimeMessage message = emailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = 
                new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");
            
            log.info("Sending rich email to {} (async)", to);
            helper.setFrom("hr.alerts@solventek.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = html
            
            emailSender.send(message);
            log.info("Rich email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send rich email to {}: {}", to, e.getMessage());
        }
    }
}
