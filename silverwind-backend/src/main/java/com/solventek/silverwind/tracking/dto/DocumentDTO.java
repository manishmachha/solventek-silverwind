package com.solventek.silverwind.tracking.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class DocumentDTO {
    private String category;
    private String fileName;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
    private String filePath;
}
