package com.interview.backend.controller;

import com.interview.backend.entity.InterviewSession;
import com.interview.backend.entity.SessionQuestion;
import com.interview.backend.service.InterviewSimulationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InterviewController {

    private final InterviewSimulationService interviewService;

    @PostMapping("/start")
    public ResponseEntity<InterviewSession> startSession(@RequestBody StartInterviewRequest request) {
        InterviewSession session = interviewService.startSession(request);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{sessionId}/question")
    public ResponseEntity<SessionQuestion> askNextQuestion(
            @PathVariable Long sessionId,
            @RequestParam String topic) {
        
        SessionQuestion question = interviewService.askNextQuestion(sessionId, topic);
        return ResponseEntity.ok(question);
    }

    @PostMapping("/question/{questionId}/evaluate")
    public ResponseEntity<SessionQuestion> evaluateAnswer(
            @PathVariable Long questionId,
            @RequestBody String userAnswer) {
        
        SessionQuestion evaluatedQuestion = interviewService.evaluateAnswer(questionId, userAnswer);
        return ResponseEntity.ok(evaluatedQuestion);
    }
}
