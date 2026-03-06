package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "focus_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FocusAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "focus_session_id")
    private FocusSession focusSession;

    private String alertType; // e.g., Posture, Gaze, Phone
    private LocalDateTime timestamp;
}
