package com.solventek.silverwind.client;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client extends BaseEntity {

    private String name;
    private String email;
    private String phone;
    private String city;
    private String country;
    @Column(length = 1000)
    private String website;

    @Column(length = 2048)
    private String logoUrl;

    @Column(length = 2000)
    private String description;

    // Additional fields as needed
    @Column(length = 1000)
    private String industry;

    @Column(length = 2000)
    private String address;

    @OneToMany(mappedBy = "client", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<com.solventek.silverwind.projects.Project> projects;
}
