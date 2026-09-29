package com.fakeinstagram.service;

import com.fakeinstagram.entity.FakeAccount;
import com.fakeinstagram.entity.FakeComment;
import com.fakeinstagram.entity.FakeMediaContainer;
import com.fakeinstagram.entity.FakePublishedMedia;
import com.fakeinstagram.repository.FakeAccountRepository;
import com.fakeinstagram.repository.FakeCommentRepository;
import com.fakeinstagram.repository.FakeMediaContainerRepository;
import com.fakeinstagram.repository.FakePublishedMediaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class FakeMediaService {

    private final FakeMediaContainerRepository fakeMediaContainerRepository;
    private final FakePublishedMediaRepository fakePublishedMediaRepository;
    private final FakeCommentRepository fakeCommentRepository;
    private final FakeAccountRepository fakeAccountRepository;

    public FakeMediaService(
            FakeMediaContainerRepository fakeMediaContainerRepository,
            FakePublishedMediaRepository fakePublishedMediaRepository,
            FakeCommentRepository fakeCommentRepository,
            FakeAccountRepository fakeAccountRepository) {
        this.fakeMediaContainerRepository = fakeMediaContainerRepository;
        this.fakePublishedMediaRepository = fakePublishedMediaRepository;
        this.fakeCommentRepository = fakeCommentRepository;
        this.fakeAccountRepository = fakeAccountRepository;
    }

    @Transactional
    public String createContainer(String igUserId, String postType, String mediaUrl, String caption, boolean isCarouselItem, String childrenJson) {
        String containerId = String.format("179%014d", ThreadLocalRandom.current().nextLong(10000000000000L, 99999999999999L));
        FakeMediaContainer container = FakeMediaContainer.builder()
                .containerId(containerId)
                .igUserId(igUserId != null ? igUserId.trim() : "17841400000000001")
                .postType(postType != null ? postType : "IMAGE")
                .mediaUrl(mediaUrl)
                .caption(caption)
                .isCarouselItem(isCarouselItem)
                .childrenJson(childrenJson)
                .statusCode("FINISHED")
                .statusMessage("Container successfully prepared and transcode finished.")
                .createdAt(LocalDateTime.now())
                .build();

        fakeMediaContainerRepository.save(container);
        return containerId;
    }

    public Optional<FakeMediaContainer> getContainer(String containerId) {
        if (containerId == null) return Optional.empty();
        return fakeMediaContainerRepository.findByContainerId(containerId.trim());
    }

    @Transactional
    public String publishMedia(String igUserId, String containerId) {
        String cleanContainerId = containerId != null ? containerId.trim() : "";
        Optional<FakeMediaContainer> containerOpt = fakeMediaContainerRepository.findByContainerId(cleanContainerId);

        String postType = "IMAGE";
        String mediaUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800";
        String caption = "";

        if (containerOpt.isPresent()) {
            FakeMediaContainer c = containerOpt.get();
            postType = c.getPostType();
            mediaUrl = c.getMediaUrl();
            caption = c.getCaption();
        }

        String mediaId = String.format("180%014d", ThreadLocalRandom.current().nextLong(10000000000000L, 99999999999999L));
        String permalink = "https://www.instagram.com/p/" + mediaId + "/";

        FakePublishedMedia publishedMedia = FakePublishedMedia.builder()
                .mediaId(mediaId)
                .igUserId(igUserId != null ? igUserId.trim() : (containerOpt.map(FakeMediaContainer::getIgUserId).orElse("17841400000000001")))
                .containerId(cleanContainerId)
                .postType(postType)
                .mediaUrl(mediaUrl)
                .caption(caption)
                .permalink(permalink)
                .likeCount(ThreadLocalRandom.current().nextInt(5, 50))
                .commentsCount(0)
                .publishedAt(LocalDateTime.now())
                .build();

        fakePublishedMediaRepository.save(publishedMedia);

        // Update account media count
        if (igUserId != null) {
            fakeAccountRepository.findByIgUserId(igUserId.trim()).ifPresent(acc -> {
                acc.setMediaCount(acc.getMediaCount() + 1);
                fakeAccountRepository.save(acc);
            });
        }

        return mediaId;
    }

    public Page<FakePublishedMedia> getUserMedia(String igUserId, Pageable pageable) {
        return fakePublishedMediaRepository.findByIgUserIdOrderByPublishedAtDesc(igUserId, pageable);
    }

    public Optional<FakePublishedMedia> getMediaById(String mediaId) {
        return fakePublishedMediaRepository.findByMediaId(mediaId);
    }

    public Page<FakeComment> getComments(String mediaId, Pageable pageable) {
        return fakeCommentRepository.findByMediaIdOrderByTimestampDesc(mediaId, pageable);
    }
}
