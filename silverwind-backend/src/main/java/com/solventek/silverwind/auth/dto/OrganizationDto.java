package com.solventek.silverwind.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * DTO for Organization information
 */
@Data
@Builder
public class OrganizationDto {
    private UUID id;
    private String name;
    private String legalName;
    private String type;
    private String status;
    private String logoUrl;
    private String email;
    private String phone;
    private String website;
    private String industry;
    private String description;
    private Integer employeeCount;
    private Integer yearsInBusiness;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String contactPersonName;
    private String contactPersonDesignation;
    private String contactPersonEmail;
    private String contactPersonPhone;
    private String serviceOfferings;
    private String keyClients;
    private String referralSource;
}
