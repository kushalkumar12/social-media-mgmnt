package com.fakeinstagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostGenerateRequest {
    private String igUserId;
    @Builder.Default
    private int count = 10;
    private String postType; // IMAGE, VIDEO, REELS, CAROUSEL, or null for random
}
