package com.interview.backend.controller;

import lombok.Data;

@Data
public class StartInterviewRequest {
    private String companyName;
    private String position;
    private String roundTypes; // e.g., "Technical, HLD, HR"
    private String mood; // Strict, Friendly, Medium
    private Long userId;
    private String resumeText;
}
