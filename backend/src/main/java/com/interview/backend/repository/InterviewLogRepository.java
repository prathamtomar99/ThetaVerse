package com.interview.backend.repository;

import com.interview.backend.entity.InterviewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewLogRepository extends JpaRepository<InterviewLog, Long> {
    List<InterviewLog> findBySessionIdOrderByTimestampAsc(Long sessionId);
}
