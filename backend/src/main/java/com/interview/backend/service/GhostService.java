package com.interview.backend.service;

import com.interview.backend.entity.GhostPerformance;
import com.interview.backend.entity.TargetProfile;
import com.interview.backend.repository.GhostPerformanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GhostService {

    private final GhostPerformanceRepository ghostPerformanceRepository;

    /**
     * Initializes the ghost for a new TargetProfile with a fixed velocity
     */
    @Transactional
    public GhostPerformance initializeGhost(TargetProfile profile, Double initialVelocity) {
        GhostPerformance ghost = GhostPerformance.builder()
                .targetProfile(profile)
                .lastSyncedTopicIndex(0)
                .velocity(initialVelocity)
                .build();
        return ghostPerformanceRepository.save(ghost);
    }

    /**
     * Updates the Ghost's benchmark position based on time passed and current velocity.
     * Can be called daily via a Cron job or upon user request.
     */
    @Transactional
    public void syncGhostPosition(Long ghostPerformanceId) {
        GhostPerformance ghost = ghostPerformanceRepository.findById(ghostPerformanceId)
                .orElseThrow(() -> new RuntimeException("Ghost not found"));

        // Simplistic logic: advance the ghost by its velocity
        int newIndex = ghost.getLastSyncedTopicIndex() + (int) Math.round(ghost.getVelocity());
        ghost.setLastSyncedTopicIndex(newIndex);

        ghostPerformanceRepository.save(ghost);
    }

    /**
     * Optionally adjust the Ghost's velocity if the user is falling too far behind.
     * Maps to: "Dynamic: Adjusts the ghost's pace if the user slows down."
     */
    @Transactional
    public void adjustGhostVelocity(Long ghostPerformanceId, Double userCurrentPace) {
        GhostPerformance ghost = ghostPerformanceRepository.findById(ghostPerformanceId)
                .orElseThrow(() -> new RuntimeException("Ghost not found"));

        // If the user's pace drops significantly below the ghost's velocity, slow the ghost down slightly
        if (userCurrentPace < ghost.getVelocity() * 0.5) {
            double adjustedVelocity = ghost.getVelocity() * 0.8;
            ghost.setVelocity(Math.max(adjustedVelocity, 1.0)); // Don't let it drop below 1
            ghostPerformanceRepository.save(ghost);
        }
    }
}
