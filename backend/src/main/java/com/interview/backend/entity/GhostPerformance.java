package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ghost_performances")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GhostPerformance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_profile_id")
    private TargetProfile targetProfile;

    private Integer lastSyncedTopicIndex;
    private Double velocity; // Topics per day or hours per day
}
