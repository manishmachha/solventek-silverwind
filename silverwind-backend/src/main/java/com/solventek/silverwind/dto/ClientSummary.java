package com.solventek.silverwind.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ClientSummary {
    private UUID id;
    private String name;
    private String logoUrl;
    private String industry;
}
