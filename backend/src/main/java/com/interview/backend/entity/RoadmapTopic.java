package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roadmap_topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roadmap_id")
    private Roadmap roadmap;

    private String topicName;
    private String priority; // High, Med, Low
    private Double estimatedHours;
    private Boolean isCompleted;
    private Integer topicIndex; // To track order for Ghost mode
}
