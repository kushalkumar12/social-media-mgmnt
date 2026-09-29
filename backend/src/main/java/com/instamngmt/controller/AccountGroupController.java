package com.instamngmt.controller;

import com.instamngmt.dto.AccountGroupDTOs;
import com.instamngmt.entity.User;
import com.instamngmt.service.AccountGroupService;
import com.instamngmt.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class AccountGroupController {

    private final AccountGroupService accountGroupService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<AccountGroupDTOs.GroupDTO>> getGroups() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(accountGroupService.getUserGroups(currentUser));
    }

    @PostMapping
    public ResponseEntity<AccountGroupDTOs.GroupDTO> createGroup(@Valid @RequestBody AccountGroupDTOs.CreateGroupRequest request) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(accountGroupService.createGroup(currentUser, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountGroupDTOs.GroupDTO> updateGroup(@PathVariable Long id, @RequestBody AccountGroupDTOs.UpdateGroupRequest request) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(accountGroupService.updateGroup(currentUser, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        accountGroupService.deleteGroup(currentUser, id);
        return ResponseEntity.noContent().build();
    }
}
