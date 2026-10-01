package com.instamngmt.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseEmitterService {

    // Default timeout 30 minutes
    private static final Long EMITTER_TIMEOUT = 30 * 60 * 1000L;

    private final Map<Long, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter createEmitter(Long userId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);

        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            removeEmitter(userId, emitter);
        });
        emitter.onError(e -> removeEmitter(userId, emitter));

        // Initial handshake event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("Connected to notification stream"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    public void sendToUser(Long userId, String eventName, Object data) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> failedEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (Exception ex) {
                failedEmitters.add(emitter);
            }
        }

        if (!failedEmitters.isEmpty()) {
            emitters.removeAll(failedEmitters);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }
}
