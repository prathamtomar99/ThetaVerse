package com.interview.backend.service;

import com.interview.backend.entity.*;
import com.interview.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoadmapService {

    private final RoadmapRepository roadmapRepository;
    private final RoadmapTopicRepository roadmapTopicRepository;
    private final TargetProfileRepository targetProfileRepository;
    private final ChatClient chatClient;

    /**
     * Generates a roadmap for a specific target profile.
     * Uses Spring AI Mistral to generate topics based on the company and role.
     */
    @Transactional
    public Roadmap generateRoadmap(Long targetProfileId) {
        TargetProfile profile = targetProfileRepository.findById(targetProfileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        Roadmap roadmap = Roadmap.builder()
                .targetProfile(profile)
                .createdAt(LocalDateTime.now())
                .build();
                
        roadmap = roadmapRepository.save(roadmap);

        // This is a placeholder for the actual AI call.
        // We will prompt Mistral to return a JSON list of topics.
        String prompt = String.format(
            "Generate an interview preparation syllabus for a %s at %s. " +
            "Return a comma separated list of 5 key topics.", 
            profile.getRole(), profile.getCompany()
        );

        String aiResponse = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        // Fallback/Mock parsing logic for the generated topics
        List<RoadmapTopic> topics = new ArrayList<>();
        String[] generatedTopics = aiResponse != null ? aiResponse.split(",") : new String[]{"OS", "System Design", "DSA", "HR", "Project Discussion"};
        
        for (int i = 0; i < generatedTopics.length; i++) {
            topics.add(RoadmapTopic.builder()
                    .roadmap(roadmap)
                    .topicName(generatedTopics[i].trim())
                    .priority(i < 2 ? "High" : "Medium")
                    .estimatedHours(5.0)
                    .isCompleted(false)
                    .topicIndex(i + 1)
                    .build());
        }

        roadmapTopicRepository.saveAll(topics);
        roadmap.setTopics(topics);

        return roadmap;
    }
}
