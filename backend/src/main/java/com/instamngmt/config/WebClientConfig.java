package com.instamngmt.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${instagram.provider:real}")
    private String provider;

    @Value("${instagram.graph-api-base-url:https://graph.facebook.com}")
    private String graphApiBaseUrl;

    @Value("${instagram.simulator-base-url:http://localhost:8085}")
    private String simulatorBaseUrl;

    @Bean
    public WebClient instagramWebClient() {
        String effectiveBaseUrl = "fake".equalsIgnoreCase(provider) ? simulatorBaseUrl : graphApiBaseUrl;
        return WebClient.builder()
                .baseUrl(effectiveBaseUrl)
                .build();
    }
}
