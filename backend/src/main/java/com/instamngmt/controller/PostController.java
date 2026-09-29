package com.instamngmt.controller;

import com.instamngmt.dto.ExcelDTOs;
import com.instamngmt.dto.PostDTOs;
import com.instamngmt.entity.User;
import com.instamngmt.service.AuthService;
import com.instamngmt.service.ExcelImportService;
import com.instamngmt.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final AuthService authService;
    private final ExcelImportService excelImportService;

    @PostMapping
    public ResponseEntity<PostDTOs.ScheduledPostDTO> createPost(@Valid @RequestBody PostDTOs.CreatePostRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(postService.createPost(user, request));
    }

    @GetMapping
    public ResponseEntity<List<PostDTOs.ScheduledPostDTO>> getUserPosts() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(postService.getUserPosts(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDTOs.ScheduledPostDTO> getPostById(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(postService.getPostById(user, id));
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<PostDTOs.ScheduledPostDTO>> getCalendarPosts(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(postService.getCalendarPosts(user, start, end));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostDTOs.ScheduledPostDTO> updatePost(
            @PathVariable Long id,
            @RequestBody PostDTOs.UpdatePostRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(postService.updateScheduledPost(user, id, request));
    }

    @PostMapping("/{id}/publish-now")
    public ResponseEntity<PostDTOs.ScheduledPostDTO> publishNow(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(postService.publishNow(user, id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PostDTOs.ScheduledPostDTO> cancelPost(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(postService.cancelPost(user, id));
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<PostDTOs.ScheduledPostDTO> retryPost(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(postService.retryPost(user, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        postService.deletePost(user, id);
        return ResponseEntity.noContent().build();
    }

    // --- BULK EXCEL SCHEDULING ENDPOINTS ---

    @GetMapping("/excel-template")
    public ResponseEntity<byte[]> downloadExcelTemplate() {
        byte[] templateBytes = excelImportService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=instagram_posts_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(templateBytes);
    }

    @PostMapping("/upload-excel")
    public ResponseEntity<ExcelDTOs.ExcelUploadResponse> uploadAndPreviewExcel(
            @RequestParam("file") MultipartFile file) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(excelImportService.uploadAndPreviewExcel(user, file));
    }

    @PostMapping("/commit-excel-batch")
    public ResponseEntity<ExcelDTOs.CommitBatchResponse> commitExcelBatch(
            @RequestBody ExcelDTOs.CommitBatchRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(excelImportService.commitBatchMultithreaded(user, request));
    }
}
