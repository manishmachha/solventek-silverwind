package com.solventek.silverwind.org;

import lombok.Data;

@Data
public class OrganizationUpdateDTO {
    private String name;
    private String description;
    private String website;
    private String industry;
    private Integer employeeCount;
    private String phone;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String serviceOfferings;

    // Contact Person
    private String contactPersonName;
    private String contactPersonEmail;
    private String contactPersonPhone;
    private String contactPersonDesignation;
}
