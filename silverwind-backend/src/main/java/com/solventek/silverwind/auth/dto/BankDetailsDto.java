package com.solventek.silverwind.auth.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO for bank details with masked account number for security
 */
@Data
@Builder
public class BankDetailsDto {
    private String bankName;
    private String accountNumberMasked; // Last 4 digits only
    private String ifscCode;
    private String branchName;
}
