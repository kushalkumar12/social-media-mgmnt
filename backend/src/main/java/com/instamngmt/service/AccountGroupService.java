package com.instamngmt.service;

import com.instamngmt.dto.AccountGroupDTOs;
import com.instamngmt.entity.AccountGroup;
import com.instamngmt.entity.AccountStatus;
import com.instamngmt.entity.InstagramAccount;
import com.instamngmt.entity.User;
import com.instamngmt.exception.APIException;
import com.instamngmt.repository.AccountGroupRepository;
import com.instamngmt.repository.InstagramAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountGroupService {

    private final AccountGroupRepository accountGroupRepository;
    private final InstagramAccountRepository instagramAccountRepository;

    public List<AccountGroupDTOs.GroupDTO> getUserGroups(User user) {
        List<AccountGroup> groups = accountGroupRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<InstagramAccount> userAccounts = instagramAccountRepository.findByUserId(user.getId());

        Map<Long, AccountStatus> accountStatusMap = userAccounts.stream()
                .collect(Collectors.toMap(InstagramAccount::getId, InstagramAccount::getStatus, (a, b) -> a));

        return groups.stream().map(g -> mapToDTO(g, accountStatusMap)).collect(Collectors.toList());
    }

    @Transactional
    public AccountGroupDTOs.GroupDTO createGroup(User user, AccountGroupDTOs.CreateGroupRequest request) {
        AccountGroup group = AccountGroup.builder()
                .userId(user.getId())
                .groupName(request.getGroupName().trim())
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "ACTIVE")
                .accountIds(request.getAccountIds() != null ? request.getAccountIds() : new HashSet<>())
                .build();

        group = accountGroupRepository.save(group);
        return mapToDTO(group, Collections.emptyMap());
    }

    @Transactional
    public AccountGroupDTOs.GroupDTO updateGroup(User user, Long groupId, AccountGroupDTOs.UpdateGroupRequest request) {
        AccountGroup group = accountGroupRepository.findById(groupId)
                .orElseThrow(() -> new APIException(HttpStatus.NOT_FOUND, "GROUP_NOT_FOUND", "Account group not found"));

        if (!group.getUserId().equals(user.getId())) {
            throw new APIException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access denied to group");
        }

        if (request.getGroupName() != null && !request.getGroupName().isBlank()) {
            group.setGroupName(request.getGroupName().trim());
        }
        if (request.getStatus() != null) {
            group.setStatus(request.getStatus().toUpperCase());
        }
        if (request.getAccountIds() != null) {
            group.setAccountIds(request.getAccountIds());
        }

        group = accountGroupRepository.save(group);
        return mapToDTO(group, Collections.emptyMap());
    }

    @Transactional
    public void deleteGroup(User user, Long groupId) {
        AccountGroup group = accountGroupRepository.findById(groupId)
                .orElseThrow(() -> new APIException(HttpStatus.NOT_FOUND, "GROUP_NOT_FOUND", "Account group not found"));

        if (!group.getUserId().equals(user.getId())) {
            throw new APIException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access denied to group");
        }

        accountGroupRepository.delete(group);
    }

    private AccountGroupDTOs.GroupDTO mapToDTO(AccountGroup g, Map<Long, AccountStatus> accountStatusMap) {
        Set<Long> members = g.getAccountIds() != null ? g.getAccountIds() : Collections.emptySet();
        int inactiveCount = 0;

        for (Long accId : members) {
            AccountStatus st = accountStatusMap.get(accId);
            if (st != null && st != AccountStatus.ACTIVE) {
                inactiveCount++;
            }
        }

        return AccountGroupDTOs.GroupDTO.builder()
                .id(g.getId())
                .groupName(g.getGroupName())
                .status(g.getStatus())
                .memberCount(members.size())
                .inactiveCount(inactiveCount)
                .accountIds(members)
                .createdAt(g.getCreatedAt())
                .build();
    }
}
