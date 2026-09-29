package com.instamngmt.controller;

import com.instamngmt.dto.DashboardDTOs;
import com.instamngmt.entity.User;
import com.instamngmt.service.AuthService;
import com.instamngmt.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthService authService;

    public DashboardController(DashboardService dashboardService, AuthService authService) {
        this.dashboardService = dashboardService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<DashboardDTOs.DashboardSummaryDTO> getDashboardSummary() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(dashboardService.getDashboardSummary(currentUser));
    }
}
