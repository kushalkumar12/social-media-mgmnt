package com.instamngmt.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${instagram.graph-api-base-url:https://graph.facebook.com}")
    private String graphApiBaseUrl;

    @Bean
    public WebClient instagramWebClient() {
        return WebClient.builder()
                .baseUrl(graphApiBaseUrl)
                .build();
    }
}
