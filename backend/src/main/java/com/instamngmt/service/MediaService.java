package com.instamngmt.service;

import com.instamngmt.dto.MediaDTOs;
import com.instamngmt.entity.Media;
import com.instamngmt.entity.MediaType;
import com.instamngmt.entity.User;
import com.instamngmt.exception.ResourceNotFoundException;
import com.instamngmt.repository.MediaRepository;
import com.instamngmt.util.MediaValidator;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MediaService {

    private final MediaRepository mediaRepository;
    private final StorageService storageService;
    private final MediaValidator mediaValidator;

    public MediaService(MediaRepository mediaRepository, StorageService storageService, MediaValidator mediaValidator) {
        this.mediaRepository = mediaRepository;
        this.storageService = storageService;
        this.mediaValidator = mediaValidator;
    }

    public MediaDTOs.MediaDTO uploadMedia(User user, MultipartFile file, MediaType mediaType, Integer width, Integer height, Double durationSeconds) {
        if (mediaType == null) {
            String contentType = file.getContentType();
            if (contentType != null && contentType.startsWith("video")) {
                mediaType = MediaType.VIDEO;
            } else {
                mediaType = MediaType.IMAGE;
            }
        }

        // Validate file per Meta Graph API rules
        mediaValidator.validateMedia(mediaType, file.getContentType(), file.getSize(), width, height, durationSeconds);

        StorageService.StorageResult storageResult = storageService.storeFile(file);

        double aspectRatio = 1.0;
        if (width != null && height != null && height > 0) {
            aspectRatio = (double) width / height;
        }

        Media media = Media.builder()
                .user(user)
                .fileName(file.getOriginalFilename())
                .mediaType(mediaType)
                .storageKey(storageResult.storageKey())
                .cdnUrl(storageResult.cdnUrl())
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .width(width != null ? width : 1080)
                .height(height != null ? height : 1080)
                .durationSeconds(durationSeconds)
                .aspectRatio(aspectRatio)
                .build();

        media = mediaRepository.save(media);
        return mapToDTO(media);
    }

    public List<MediaDTOs.MediaDTO> getUserMedia(User user) {
        return mediaRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public MediaDTOs.MediaDTO getMediaById(User user, Long id) {
        Media media = mediaRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Media", "id", id));
        return mapToDTO(media);
    }

    public void deleteMedia(User user, Long id) {
        Media media = mediaRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Media", "id", id));
        mediaRepository.delete(media);
    }

    public MediaDTOs.MediaDTO mapToDTO(Media media) {
        return MediaDTOs.MediaDTO.builder()
                .id(media.getId())
                .fileName(media.getFileName())
                .mediaType(media.getMediaType())
                .cdnUrl(media.getCdnUrl())
                .fileSize(media.getFileSize())
                .mimeType(media.getMimeType())
                .width(media.getWidth())
                .height(media.getHeight())
                .durationSeconds(media.getDurationSeconds())
                .codec(media.getCodec())
                .aspectRatio(media.getAspectRatio())
                .createdAt(media.getCreatedAt())
                .build();
    }
}
