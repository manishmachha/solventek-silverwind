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
public class EmergencyContact {
    private String contactName;
    private String relationship;
    private String contactPhone;
    private String contactEmail;
}
