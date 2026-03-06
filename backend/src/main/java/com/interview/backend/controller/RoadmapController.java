package com.interview.backend.controller;

import com.interview.backend.entity.DailyTask;
import com.interview.backend.entity.Roadmap;
import com.interview.backend.service.DailyTaskService;
import com.interview.backend.service.RoadmapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roadmaps")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoadmapController {

    private final RoadmapService roadmapService;
    private final DailyTaskService dailyTaskService;

    @PostMapping("/generate/{targetProfileId}")
    public ResponseEntity<Roadmap> generateRoadmap(@PathVariable Long targetProfileId) {
        Roadmap roadmap = roadmapService.generateRoadmap(targetProfileId);
        return ResponseEntity.ok(roadmap);
    }

    @PostMapping("/{roadmapId}/schedule")
    public ResponseEntity<List<DailyTask>> scheduleRoadmapTasks(@PathVariable Long roadmapId) {
        List<DailyTask> tasks = dailyTaskService.scheduleTasks(roadmapId);
        return ResponseEntity.ok(tasks);
    }
}
