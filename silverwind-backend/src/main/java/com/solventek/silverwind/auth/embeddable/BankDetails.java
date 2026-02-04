package com.solventek.silverwind.auth.embeddable;

import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankDetails {
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String branchName;
}
