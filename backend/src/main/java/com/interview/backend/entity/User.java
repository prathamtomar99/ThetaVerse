package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    
    // Core profile details
    private String targetRole;
    private String targetCompany;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<TargetProfile> targetProfiles;
}
