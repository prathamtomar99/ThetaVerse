package com.interview.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSessionResponse {
    private Long id; // Unique identifier for the session
    private String companyName; // Name of the company
    private String position; // Position for the interview
    private String roundTypes; // Types of rounds in the interview
    private String mood; // Mood of the interviewer
    private LocalDateTime startTime; // Start time of the session
    private LocalDateTime endTime; // End time of the session
    private String resumeText; // Resume text of the candidate
}