package com.solventek.silverwind.tracking.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class TrackingLoginRequest {
    private UUID applicationId;
    private LocalDate dateOfBirth;
}
