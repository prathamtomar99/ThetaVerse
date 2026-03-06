package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "focus_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FocusSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_session_id")
    private InterviewSession interviewSession;

    private Long totalDurationSeconds;
    private Long distractionDurationSeconds;
}
