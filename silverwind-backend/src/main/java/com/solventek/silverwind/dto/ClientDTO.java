package com.solventek.silverwind.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientDTO {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String city;
    private String country;
    private String website;
    private String logoUrl;
    private String description;
    private String industry;
    private String address;
}
