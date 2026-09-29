package com.fakeinstagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountGenerateRequest {
    @Builder.Default
    private int count = 10;
    
    @Builder.Default
    private boolean generatePosts = true;
    
    @Builder.Default
    private int postsPerAccount = 5;
    
    @Builder.Default
    private boolean generateFollowers = true;
    
    @Builder.Default
    private int minFollowers = 50;
    
    @Builder.Default
    private int maxFollowers = 250000;
    
    @Builder.Default
    private boolean randomizeNames = true;
}
