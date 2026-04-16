package com.interview.backend.service;

import com.interview.backend.controller.StartInterviewRequest;
import com.interview.backend.dto.EvaluateAnswerRequest;
import com.interview.backend.dto.InterviewLogResponse;
import com.interview.backend.dto.InterviewSessionResponse;
import com.interview.backend.entity.*;
import com.interview.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewSimulationService {

        private static final int QUESTIONS_PER_TOPIC = 5;

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
                                .roundTypes(request.getRoundTypes())
                                .startTime(LocalDateTime.now())
                                .resumeText(request.getResumeText())
                                .build();

                return sessionRepository.save(session);
        }

        @Transactional(readOnly = true)
        public InterviewSessionResponse getSession(Long sessionId) {
                InterviewSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found"));

                return InterviewSessionResponse.builder()
                                .id(session.getId())
                                .companyName(session.getTargetProfile().getCompanyName())
                                .position(session.getTargetProfile().getRoleName())
                                .roundTypes(session.getRoundTypes())
                                .mood(session.getInterviewerPersona().getBaseMood())
                                .startTime(session.getStartTime())
                                .endTime(session.getEndTime())
                                .resumeText(session.getResumeText())
                                .build();
        }

        @Transactional(readOnly = true)
        public List<InterviewSessionResponse> getUserSessions(Long userId) {
                return sessionRepository.findByUserIdOrderByStartTimeDesc(userId)
                                .stream()
                                .map(session -> InterviewSessionResponse.builder()
                                                .id(session.getId())
                                                .companyName(session.getTargetProfile().getCompanyName())
                                                .position(session.getTargetProfile().getRoleName())
                                                .roundTypes(session.getRoundTypes())
                                                .mood(session.getInterviewerPersona().getBaseMood())
                                                .startTime(session.getStartTime())
                                                .endTime(session.getEndTime())
                                                .resumeText(session.getResumeText())
                                                .build())
                                .collect(Collectors.toList());
        }

        @Transactional
        public SessionQuestion askNextQuestion(Long sessionId, String topic) {
                InterviewSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found"));

                String activeTopic = topic == null || topic.isBlank()
                                ? resolveTopic(session, (int) logRepository.countBySessionId(sessionId))
                                : topic.trim();

                List<String> recentQuestions = questionRepository.findTop5BySessionIdOrderByIdDesc(sessionId)
                                .stream()
                                .map(SessionQuestion::getQuestionText)
                                .collect(Collectors.toList());

                String prompt = String.format(
                                "You are a %s interviewer for a %s position at %s. " +
                                                "Mood: %s. Candidate context: '%s'. " +
                                                "Ask exactly one unique, concise interview question about %s. " +
                                                "Do not repeat any of these recent questions: %s. " +
                                                "Keep the question varied, practical, and different from earlier ones.",
                                session.getTargetProfile().getRoleName(),
                                session.getTargetProfile().getRoleName(),
                                session.getTargetProfile().getCompanyName(),
                                session.getInterviewerPersona().getBaseMood(),
                                session.getResumeText() != null ? session.getResumeText() : "None provided",
                                activeTopic,
                                recentQuestions.isEmpty() ? "none" : String.join(" | ", recentQuestions));

                String aiQuestionText = chatClient.prompt()
                                .user(prompt)
                                .call()
                                .content();

                logRepository.save(InterviewLog.builder()
                                .session(session)
                                .role("question")
                                .content(aiQuestionText)
                                .timestamp(LocalDateTime.now())
                                .build());

                SessionQuestion question = SessionQuestion.builder()
                                .session(session)
                                .topic(activeTopic)
                                .questionText(aiQuestionText)
                                .build();

                return questionRepository.save(question);
        }

        @Transactional
        public SessionQuestion evaluateAnswer(Long questionId, EvaluateAnswerRequest request) {
                SessionQuestion question = questionRepository.findById(questionId)
                                .orElseThrow(() -> new RuntimeException("Question not found"));

                question.setUserAnswer(request.getUserAnswer());

                logRepository.save(InterviewLog.builder()
                                .session(question.getSession())
                                .role("response")
                                .content(request.getUserAnswer())
                                .timestamp(LocalDateTime.now())
                                .build());

                String prompt = String.format(
                                "The candidate was asked: '%s'. They answered: '%s'. " +
                                                "Current posture feedback: '%s'. " +
                                                "Provide a brief evaluation of technical depth, structure, posture, and communication. "
                                                +
                                                "Return actionable feedback only.",
                                question.getQuestionText(),
                                request.getUserAnswer(),
                                request.getPostureFeedback() != null ? request.getPostureFeedback() : "Not available");

                String aiEvaluation = chatClient.prompt()
                                .user(prompt)
                                .call()
                                .content();

                logRepository.save(InterviewLog.builder()
                                .session(question.getSession())
                                .role("evaluation")
                                .content(aiEvaluation)
                                .timestamp(LocalDateTime.now())
                                .build());

                question.setAiResponse(aiEvaluation);
                return questionRepository.save(question);
        }

        @Transactional(readOnly = true)
        public List<InterviewLogResponse> getInterviewLogs(Long sessionId) {
                return logRepository.findBySessionIdOrderByTimestampAsc(sessionId)
                                .stream()
                                .map(log -> InterviewLogResponse.builder()
                                                .id(log.getId())
                                                .role(log.getRole())
                                                .content(log.getContent())
                                                .timestamp(log.getTimestamp())
                                                .build())
                                .collect(Collectors.toList());
        }

        @Transactional
        public InterviewSessionResponse endSession(Long sessionId) {
                InterviewSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found"));

                if (session.getEndTime() != null) {
                        return getSession(sessionId);
                }

                List<InterviewLog> logs = logRepository.findBySessionIdOrderByTimestampAsc(sessionId);
                String transcript = logs.stream()
                                .map(log -> String.format("%s: %s", capitalize(log.getRole()), log.getContent()))
                                .collect(Collectors.joining("\n"));

                String finalPrompt = String.format(
                                "Review this interview transcript and provide a final evaluation with strengths, gaps, posture notes, and next steps. Transcript:\n%s",
                                transcript);

                String finalEvaluation = chatClient.prompt()
                                .user(finalPrompt)
                                .call()
                                .content();

                logRepository.save(InterviewLog.builder()
                                .session(session)
                                .role("final")
                                .content(finalEvaluation)
                                .timestamp(LocalDateTime.now())
                                .build());

                session.setEndTime(LocalDateTime.now());
                sessionRepository.save(session);

                return getSession(sessionId);
        }

        private String resolveTopic(InterviewSession session, int questionCount) {
                List<String> topics = Arrays.stream(
                                (session.getRoundTypes() == null || session.getRoundTypes().isBlank())
                                                ? new String[] { "Technical", "Behavioral", "System Design" }
                                                : session.getRoundTypes().split(","))
                                .map(String::trim)
                                .filter(topic -> !topic.isBlank())
                                .collect(Collectors.toList());

                if (topics.isEmpty()) {
                        topics = List.of("Technical", "Behavioral", "System Design");
                }

                int topicIndex = Math.max(questionCount, 0) / QUESTIONS_PER_TOPIC;
                return topics.get(topicIndex % topics.size());
        }

        private String capitalize(String value) {
                if (value == null || value.isBlank()) {
                        return "Log";
                }
                return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1);
        }
}
