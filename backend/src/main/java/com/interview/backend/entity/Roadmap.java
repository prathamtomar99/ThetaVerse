package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "roadmaps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Roadmap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_profile_id")
    private TargetProfile targetProfile;

    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "roadmap", cascade = CascadeType.ALL)
    private List<RoadmapTopic> topics;
}
