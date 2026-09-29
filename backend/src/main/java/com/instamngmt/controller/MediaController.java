package com.instamngmt.controller;

import com.instamngmt.dto.MediaDTOs;
import com.instamngmt.entity.MediaType;
import com.instamngmt.entity.User;
import com.instamngmt.service.AuthService;
import com.instamngmt.service.MediaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaService mediaService;
    private final AuthService authService;

    public MediaController(MediaService mediaService, AuthService authService) {
        this.mediaService = mediaService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<MediaDTOs.MediaDTO> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mediaType", required = false) MediaType mediaType,
            @RequestParam(value = "width", required = false) Integer width,
            @RequestParam(value = "height", required = false) Integer height,
            @RequestParam(value = "durationSeconds", required = false) Double durationSeconds) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(mediaService.uploadMedia(user, file, mediaType, width, height, durationSeconds));
    }

    @GetMapping
    public ResponseEntity<List<MediaDTOs.MediaDTO>> getUserMedia() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(mediaService.getUserMedia(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MediaDTOs.MediaDTO> getMediaById(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(mediaService.getMediaById(user, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedia(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        mediaService.deleteMedia(user, id);
        return ResponseEntity.noContent().build();
    }
}
