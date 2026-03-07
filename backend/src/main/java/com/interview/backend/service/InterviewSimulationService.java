package com.interview.backend.service;

import com.interview.backend.entity.*;
import com.interview.backend.repository.*;
import com.interview.backend.controller.StartInterviewRequest;
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
        private final UserRepository userRepository;
        private final InterviewLogRepository logRepository;
        private final ChatClient chatClient;

        @Transactional
        public InterviewSession startSession(StartInterviewRequest request) {
                User user = userRepository.findById(request.getUserId())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                TargetProfile profile = TargetProfile.builder()
                                .user(user)
                                .roleName(request.getPosition())
                                .companyName(request.getCompanyName())
                                .build();
                profile = profileRepository.save(profile);

                InterviewerPersona persona;
                if ("Strict".equalsIgnoreCase(request.getMood())) {
                        persona = new StrictPersona();
                } else if ("Friendly".equalsIgnoreCase(request.getMood())) {
                        persona = new FriendlyPersona();
                } else {
                        persona = new MediumPersona();
                }

                InterviewSession session = InterviewSession.builder()
                                .user(profile.getUser())
                                .targetProfile(profile)
                                .interviewerPersona(persona)
                                .startTime(LocalDateTime.now())
                                .resumeText(request.getResumeText())
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
                                                "The candidate provided this context/resume: '%s'. " +
                                                "Ask a single challenging question about %s, tailoring it to their background if relevant.",
                                session.getTargetProfile().getRoleName(),
                                session.getTargetProfile().getCompanyName(),
                                session.getInterviewerPersona().getBaseMood(),
                                session.getResumeText() != null ? session.getResumeText() : "None provided",
                                topic);

                String aiQuestionText = chatClient.prompt()
                                .user(prompt)
                                .call()
                                .content();

                // Save AI question to log
                logRepository.save(InterviewLog.builder()
                                .session(session)
                                .role("ai")
                                .content(aiQuestionText)
                                .timestamp(LocalDateTime.now())
                                .build());

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

                // Save User answer to log
                logRepository.save(InterviewLog.builder()
                                .session(question.getSession())
                                .role("user")
                                .content(userAnswer)
                                .timestamp(LocalDateTime.now())
                                .build());

                String prompt = String.format(
                                "The candidate was asked: '%s'. " +
                                                "They answered: '%s'. " +
                                                "Provide a brief evaluation of their technical depth, structure, and communication. "
                                                +
                                                "Also ask a shorter follow-up question based on their answer.",
                                question.getQuestionText(), userAnswer);

                String aiEvaluation = chatClient.prompt()
                                .user(prompt)
                                .call()
                                .content();

                // Save AI evaluation to log
                logRepository.save(InterviewLog.builder()
                                .session(question.getSession())
                                .role("ai")
                                .content(aiEvaluation)
                                .timestamp(LocalDateTime.now())
                                .build());

                question.setAiResponse(aiEvaluation);
                return questionRepository.save(question);
        }
}
