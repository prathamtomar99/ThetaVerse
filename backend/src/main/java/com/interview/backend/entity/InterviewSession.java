package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "interview_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_profile_id")
    private TargetProfile targetProfile;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "interviewer_persona_id")
    private InterviewerPersona interviewerPersona;

    @Column(columnDefinition = "TEXT")
    private String roundTypes; // Added to store round types

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    private java.util.List<InterviewLog> logs;

    @OneToOne(mappedBy = "interviewSession", cascade = CascadeType.ALL)
    private FocusSession focusSession;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Double techScore;
    private Double focusScore;

    @Column(columnDefinition = "TEXT")
    private String resumeText;
}
