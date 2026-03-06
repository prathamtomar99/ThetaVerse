package com.interview.backend.service;

import com.interview.backend.entity.*;
import com.interview.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InterviewSimulationService {

    private final InterviewSessionRepository sessionRepository;
    private final SessionQuestionRepository questionRepository;
    private final TargetProfileRepository profileRepository;
    private final ChatClient chatClient;

    @Transactional
    public InterviewSession startSession(Long profileId, String mood) {
        TargetProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        InterviewSession session = InterviewSession.builder()
                .user(profile.getUser())
                .targetProfile(profile)
                .mood(mood)
                .startTime(LocalDateTime.now())
                .build();

        return sessionRepository.save(session);
    }

    @Transactional
    public SessionQuestion askNextQuestion(Long sessionId, String topic) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        String prompt = String.format(
            "You are an technical interviewer for a %s position at %s. " +
            "Your mood is %s. " +
            "Ask a single challenging question about %s.", 
            session.getTargetProfile().getRole(), 
            session.getTargetProfile().getCompany(),
            session.getMood(),
            topic
        );

        String aiQuestionText = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        SessionQuestion question = SessionQuestion.builder()
                .session(session)
                .topic(topic)
                .questionText(aiQuestionText)
                .build();

        return questionRepository.save(question);
    }

    @Transactional
    public SessionQuestion evaluateAnswer(Long questionId, String userAnswer) {
        SessionQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        question.setUserAnswer(userAnswer);

        String prompt = String.format(
            "The candidate was asked: '%s'. " +
            "They answered: '%s'. " +
            "Provide a brief evaluation of their technical depth, structure, and communication. " +
            "Also ask a shorter follow-up question based on their answer.", 
            question.getQuestionText(), userAnswer
        );

        String aiEvaluation = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        question.setAiResponse(aiEvaluation);
        return questionRepository.save(question);
    }
}
