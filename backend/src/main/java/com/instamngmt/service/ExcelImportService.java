package com.instamngmt.service;

import com.instamngmt.dto.ExcelDTOs;
import com.instamngmt.entity.*;
import com.instamngmt.exception.APIException;
import com.instamngmt.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URL;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelImportService {

    private final BulkImportBatchRepository bulkImportBatchRepository;
    private final ScheduledPostRepository scheduledPostRepository;
    private final OutboxJobRepository outboxJobRepository;
    private final MediaRepository mediaRepository;
    private final InstagramAccountRepository instagramAccountRepository;
    private final AccountGroupRepository accountGroupRepository;

    private static final List<DateTimeFormatter> DATE_ONLY_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"));

    private static final List<DateTimeFormatter> TIME_ONLY_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("HH:mm:ss"),
            DateTimeFormatter.ofPattern("HH:mm"),
            DateTimeFormatter.ofPattern("hh:mm:ss a", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("h:mm:ss a", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH));

    private static final List<DateTimeFormatter> COMBINED_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

    /**
     * Generates a downloadable Excel (.xlsx) template with sample data.
     */
    public byte[] generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Post Scheduling Template");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.VIOLET.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            String[] headers = {
                    "S No",
                    "Post Name", "Caption & Hashtags", "Schedule Time (YYYY-MM-DD HH:mm:ss)",
                    "Media Source URL (ImgBB/S3)", "Post Type (IMAGE/REEL/STORY)", "Location (Optional)"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Add Sample Data Rows
            LocalDateTime tomorrow = LocalDateTime.now().plusDays(1).withMinute(0).withSecond(0);

            Object[][] sampleData = {
                    {
                            "1",
                            "Summer Product Launch",
                            "Excited to reveal our new collection! ✨ #summer #launch #fashion",
                            tomorrow.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                            "https://i.ibb.co/L95MkgM/sample-post-1.jpg",
                            "IMAGE",
                            "New York, NY"
                    },
                    {
                            "2",
                            "Weekly Reel Highlight",
                            "Check out our behind the scenes action! 🎥🚀 #behindthescenes #reel",
                            tomorrow.plusHours(4).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                            "https://i.ibb.co/zXp94YV/sample-reel-video.mp4",
                            "REEL",
                            "Los Angeles, CA"
                    }
            };

            for (int r = 0; r < sampleData.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < sampleData[r].length; c++) {
                    row.createCell(c).setCellValue((String) sampleData[r][c]);
                }
            }

            // Excel Data Validation: Add Dropdown List for Post Type (Column index 5)
            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, 5, 5);
            DataValidationConstraint constraint = validationHelper.createExplicitListConstraint(
                    new String[] { "IMAGE", "REEL", "STORY", "CAROUSEL", "VIDEO" });
            DataValidation validation = validationHelper.createValidation(constraint, addressList);
            validation.setShowErrorBox(true);
            validation.createErrorBox("Invalid Post Type",
                    "Please select a valid Post Type from the dropdown list (IMAGE, REEL, STORY, CAROUSEL, VIDEO).");
            sheet.addValidationData(validation);

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate Excel template", e);
            throw new APIException(HttpStatus.INTERNAL_SERVER_ERROR, "TEMPLATE_ERROR",
                    "Failed to generate Excel template");
        }
    }

    /**
     * Stores uploaded Excel directly into DB and previews parsed rows with
     * validation.
     */
    @Transactional
    public ExcelDTOs.ExcelUploadResponse uploadAndPreviewExcel(User user, MultipartFile file) {
        if (file.isEmpty()) {
            throw new APIException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "Uploaded file is empty");
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new APIException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_READ_ERROR", "Could not read uploaded file");
        }

        // 1. Save raw Excel directly into DB
        BulkImportBatch batch = BulkImportBatch.builder()
                .userId(user.getId())
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "bulk_posts.xlsx")
                .fileData(fileBytes)
                .status("PREVIEW")
                .build();

        batch = bulkImportBatchRepository.save(batch);

        // 2. Parse Rows with Apache POI
        List<ExcelDTOs.ExcelRowPreview> rowPreviews = parseExcelRows(fileBytes);

        int validCount = (int) rowPreviews.stream().filter(ExcelDTOs.ExcelRowPreview::isValid).count();
        int errorCount = rowPreviews.size() - validCount;

        batch.setTotalRows(rowPreviews.size());
        batch.setValidRows(validCount);
        batch.setErrorRows(errorCount);
        bulkImportBatchRepository.save(batch);

        return ExcelDTOs.ExcelUploadResponse.builder()
                .batchId(batch.getId())
                .fileName(batch.getFileName())
                .totalRows(rowPreviews.size())
                .validRows(validCount)
                .errorRows(errorCount)
                .rows(rowPreviews)
                .build();
    }

    /**
     * Multithreaded insertion of selected or all valid Excel rows into DB.
     */
    public ExcelDTOs.CommitBatchResponse commitBatchMultithreaded(User user, ExcelDTOs.CommitBatchRequest request) {
        BulkImportBatch batch = bulkImportBatchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new APIException(HttpStatus.NOT_FOUND, "BATCH_NOT_FOUND", "Batch file not found"));

        if (!batch.getUserId().equals(user.getId())) {
            throw new APIException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_BATCH", "Access denied to this import batch");
        }

        List<ExcelDTOs.ExcelRowPreview> rowPreviews = parseExcelRows(batch.getFileData());

        // Determine target Instagram Account(s)
        List<InstagramAccount> targetAccounts = new ArrayList<>();

        if (request.getTargetGroupId() != null) {
            AccountGroup group = accountGroupRepository.findById(request.getTargetGroupId())
                    .orElseThrow(() -> new APIException(HttpStatus.NOT_FOUND, "GROUP_NOT_FOUND", "Account group not found"));
            if (!group.getUserId().equals(user.getId())) {
                throw new APIException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access denied to this group");
            }
            if (group.getAccountIds() != null && !group.getAccountIds().isEmpty()) {
                targetAccounts = instagramAccountRepository.findAllById(group.getAccountIds()).stream()
                        .filter(acc -> acc.getUser().getId().equals(user.getId()))
                        .toList();
            }
            if (targetAccounts.isEmpty()) {
                throw new APIException(HttpStatus.BAD_REQUEST, "EMPTY_GROUP",
                        "The selected account group does not contain any connected accounts");
            }
        } else if (request.getTargetAccountIds() != null && !request.getTargetAccountIds().isEmpty()) {
            targetAccounts = instagramAccountRepository.findAllById(request.getTargetAccountIds()).stream()
                    .filter(acc -> acc.getUser().getId().equals(user.getId()))
                    .toList();
        } else if (request.getDefaultInstagramAccountId() != null) {
            InstagramAccount targetAccount = instagramAccountRepository.findById(request.getDefaultInstagramAccountId()).orElse(null);
            if (targetAccount != null && targetAccount.getUser().getId().equals(user.getId())) {
                targetAccounts.add(targetAccount);
            }
        }

        if (targetAccounts.isEmpty()) {
            InstagramAccount defaultAcc = instagramAccountRepository.findByUserId(user.getId()).stream().findFirst().orElse(null);
            if (defaultAcc != null) {
                targetAccounts.add(defaultAcc);
            }
        }

        if (targetAccounts.isEmpty()) {
            throw new APIException(HttpStatus.BAD_REQUEST, "NO_TARGET_ACCOUNT",
                    "No target Instagram account available. Please connect an account first.");
        }

        // Filter rows by selection or valid status
        Set<Integer> selectedIndices = (request.getSelectedRowIndices() != null
                && !request.getSelectedRowIndices().isEmpty())
                        ? new HashSet<>(request.getSelectedRowIndices())
                        : null;

        List<ExcelDTOs.ExcelRowPreview> rowsToProcess = rowPreviews.stream()
                .filter(ExcelDTOs.ExcelRowPreview::isValid)
                .filter(r -> selectedIndices == null || selectedIndices.contains(r.getRowIndex()))
                .toList();

        if (rowsToProcess.isEmpty()) {
            throw new APIException(HttpStatus.BAD_REQUEST, "NO_VALID_ROWS_SELECTED",
                    "No valid rows selected for scheduling");
        }

        // Multithreaded persistence using Java ExecutorService across all target accounts & rows
        int totalTasks = rowsToProcess.size() * targetAccounts.size();
        ExecutorService executor = Executors.newFixedThreadPool(Math.min(Math.max(totalTasks, 1), 8));
        List<Future<Boolean>> futures = new ArrayList<>();

        for (InstagramAccount account : targetAccounts) {
            for (ExcelDTOs.ExcelRowPreview row : rowsToProcess) {
                futures.add(executor.submit(() -> processAndSaveSingleRow(user, account, row)));
            }
        }

        int successCount = 0;
        for (Future<Boolean> future : futures) {
            try {
                if (future.get(15, TimeUnit.SECONDS)) {
                    successCount++;
                }
            } catch (Exception e) {
                log.error("Error processing row asynchronously", e);
            }
        }

        executor.shutdown();

        batch.setStatus("COMMITTED");
        bulkImportBatchRepository.save(batch);

        String message = targetAccounts.size() > 1
                ? String.format("Successfully scheduled %d post(s) across %d account(s) in group via multithreaded processing.", successCount, targetAccounts.size())
                : String.format("Successfully scheduled %d post(s) via multithreaded processing.", successCount);

        return ExcelDTOs.CommitBatchResponse.builder()
                .batchId(batch.getId())
                .committedCount(successCount)
                .message(message)
                .build();
    }

    private boolean processAndSaveSingleRow(User user, InstagramAccount account, ExcelDTOs.ExcelRowPreview row) {
        try {
            // 1. Create Media Entity
            MediaType mediaType = "REEL".equalsIgnoreCase(row.getPostType())
                    || "VIDEO".equalsIgnoreCase(row.getPostType())
                            ? MediaType.VIDEO
                            : MediaType.IMAGE;

            Media media = Media.builder()
                    .user(user)
                    .fileName(row.getName() != null && !row.getName().isBlank() ? row.getName() : "Bulk Imported Media")
                    .storageKey("external-url-" + UUID.randomUUID())
                    .cdnUrl(row.getMediaUrl())
                    .mediaType(mediaType)
                    .fileSize(1024L * 1024L) // placeholder 1MB
                    .build();
            media = mediaRepository.save(media);

            // 2. Map Post Type
            PostType postType = PostType.SINGLE_IMAGE;
            if ("REEL".equalsIgnoreCase(row.getPostType()) || "REELS".equalsIgnoreCase(row.getPostType())) {
                postType = PostType.REELS;
            } else if ("VIDEO".equalsIgnoreCase(row.getPostType())) {
                postType = PostType.SINGLE_VIDEO;
            } else if ("STORY".equalsIgnoreCase(row.getPostType())) {
                postType = PostType.STORY;
            } else if ("CAROUSEL".equalsIgnoreCase(row.getPostType())) {
                postType = PostType.CAROUSEL;
            }

            // 3. Create Scheduled Post
            ScheduledPost post = ScheduledPost.builder()
                    .user(user)
                    .instagramAccount(account)
                    .caption(row.getCaption())
                    .postType(postType)
                    .idempotencyKey(UUID.randomUUID().toString())
                    .scheduledAt(row.getScheduledTime())
                    .timezone("Asia/Kolkata")
                    .status(PostStatus.SCHEDULED)
                    .retryCount(0)
                    .maxAttempts(3)
                    .build();

            PostMediaItem mediaItem = PostMediaItem.builder()
                    .scheduledPost(post)
                    .media(media)
                    .position(0)
                    .build();
            post.getMediaItems().add(mediaItem);

            post = scheduledPostRepository.save(post);

            // 4. Create Outbox Job for Async Execution by OutboxPollerScheduler
            OutboxJob outboxJob = OutboxJob.builder()
                    .scheduledPostId(post.getId())
                    .postType(post.getPostType())
                    .scheduledAt(post.getScheduledAt())
                    .status(OutboxJobStatus.PENDING)
                    .retryCount(0)
                    .build();

            outboxJobRepository.save(outboxJob);
            log.info("Async bulk post persisted successfully: id={} scheduledAt={}", post.getId(),
                    post.getScheduledAt());
            return true;
        } catch (Exception e) {
            log.error("Failed to persist bulk post row {}", row.getRowIndex(), e);
            return false;
        }
    }

    private List<ExcelDTOs.ExcelRowPreview> parseExcelRows(byte[] fileBytes) {
        List<ExcelDTOs.ExcelRowPreview> rows = new ArrayList<>();

        try (ByteArrayInputStream in = new ByteArrayInputStream(fileBytes);
                Workbook workbook = WorkbookFactory.create(in)) {
            Sheet sheet = workbook.getSheetAt(0);

            if (sheet.getLastRowNum() < 1) return rows;

            // Detect if first column is S No
            Row headerRow = sheet.getRow(0);
            boolean hasSNo = false;
            if (headerRow != null && headerRow.getCell(0) != null) {
                String firstCol = getCellValueAsString(headerRow.getCell(0)).toLowerCase();
                if (firstCol.contains("s no") || firstCol.contains("s.no") || firstCol.contains("sno")) {
                    hasSNo = true;
                }
            }

            int colOffset = hasSNo ? 1 : 0;

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row))
                    continue;

                String name = getCellValueAsString(row.getCell(0 + colOffset));
                String caption = getCellValueAsString(row.getCell(1 + colOffset));
                String scheduledTimeStr = getCellValueAsString(row.getCell(2 + colOffset));
                Cell timeCell = row.getCell(2 + colOffset);
                String mediaUrl = getCellValueAsString(row.getCell(3 + colOffset));
                String postType = getCellValueAsString(row.getCell(4 + colOffset));
                String location = getCellValueAsString(row.getCell(5 + colOffset));

                ExcelDTOs.ExcelRowPreview rowPreview = ExcelDTOs.ExcelRowPreview.builder()
                        .rowIndex(r)
                        .name(name)
                        .caption(caption)
                        .scheduledTimeStr(scheduledTimeStr)
                        .mediaUrl(mediaUrl)
                        .postType(postType)
                        .location(location)
                        .validationErrors(new ArrayList<>())
                        .build();

                validateRow(rowPreview, timeCell, hasSNo);
                rows.add(rowPreview);
            }
        } catch (Exception e) {
            log.error("Error parsing Excel file", e);
            throw new APIException(HttpStatus.BAD_REQUEST, "EXCEL_PARSING_ERROR",
                    "Failed to parse Excel file format: " + e.getMessage());
        }

        return rows;
    }

    private void validateRow(ExcelDTOs.ExcelRowPreview row, Cell timeCell, boolean hasSNo) {
        List<String> errors = row.getValidationErrors();
        int colOffset = hasSNo ? 1 : 0;

        // 1. Post Name Default / Validation
        if (row.getName() == null || row.getName().isBlank()) {
            row.setName("Bulk Post Row #" + row.getRowIndex());
        }

        // 2. Caption & Hashtags Validation
        if (row.getCaption() == null || row.getCaption().isBlank()) {
            errors.add("[Caption & Hashtags] Caption is required (Column " + (2 + colOffset) + "). Please enter post text or hashtags.");
        } else if (row.getCaption().length() > 2200) {
            errors.add("[Caption & Hashtags] Caption length (" + row.getCaption().length()
                    + " chars) exceeds Instagram's 2,200 character limit.");
        }

        // 3. Post Type Validation
        if (row.getPostType() == null || row.getPostType().isBlank()) {
            errors.add("[Post Type] Post Type is required (Column " + (5 + colOffset) + "). Allowed options: IMAGE, REEL, STORY, CAROUSEL, VIDEO.");
        } else {
            String pt = row.getPostType().trim().toUpperCase();
            if (!Set.of("IMAGE", "VIDEO", "REEL", "REELS", "STORY", "CAROUSEL").contains(pt)) {
                errors.add("[Post Type] Invalid Post Type '" + row.getPostType()
                        + "' (Column " + (5 + colOffset) + "). Allowed options: IMAGE, REEL, STORY, CAROUSEL, VIDEO.");
            } else {
                if ("REELS".equalsIgnoreCase(pt))
                    pt = "REEL";
                row.setPostType(pt);
            }
        }

        // 4. Media Source URL Validation
        if (row.getMediaUrl() == null || row.getMediaUrl().isBlank()) {
            errors.add("[Media Source URL] Media URL is required (Column " + (4 + colOffset) + "). Please enter a valid image/video web link.");
        } else {
            try {
                new URL(row.getMediaUrl()).toURI();
                String lowerUrl = row.getMediaUrl().toLowerCase();
                if ("REEL".equalsIgnoreCase(row.getPostType()) && (lowerUrl.endsWith(".jpg")
                        || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png") || lowerUrl.endsWith(".webp"))) {
                    errors.add("[Media Source URL] Post Type is 'REEL' but media URL points to an image file. Reels require a video file (.mp4, .mov).");
                }
            } catch (Exception e) {
                errors.add("[Media Source URL] Invalid URL format '" + row.getMediaUrl()
                        + "' (Column " + (4 + colOffset) + "). URL must start with http:// or https://.");
            }
        }

        // 5. Schedule Time Validation (Single Column)
        LocalDateTime parsedTime = parseCellCombinedDate(timeCell, row.getScheduledTimeStr());
        if (parsedTime == null) {
            parsedTime = parseDateTimeFallback(timeCell, row.getScheduledTimeStr(), errors, colOffset);
        }

        if (parsedTime != null) {
            row.setScheduledTime(parsedTime);
            row.setScheduledTimeStr(parsedTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            if (parsedTime.isBefore(LocalDateTime.now().minusMinutes(1))) {
                errors.add("[Schedule Time] The scheduled timestamp '" + row.getScheduledTimeStr()
                        + "' is in the past. Schedule time must be in the future.");
            }
        }

        if (!errors.isEmpty()) {
            row.setValid(false);
        }
    }

    private LocalDateTime parseDateTimeFallback(Cell cell, String cellStr, List<String> errors, int colOffset) {
        if (cellStr == null || cellStr.isBlank()) {
            errors.add("[Schedule Time] Schedule Time is required (Column " + (3 + colOffset) + "). Expected format: YYYY-MM-DD HH:mm:ss.");
            return null;
        }

        LocalDate localDate = parseLocalDate(cell, cellStr);
        if (localDate != null) {
            return localDate.atStartOfDay();
        }

        errors.add("[Schedule Time] Could not parse Schedule Time '" + cellStr
                + "' (Column " + (3 + colOffset) + "). Expected format: YYYY-MM-DD HH:mm:ss or YYYY-MM-DD HH:mm.");
        return null;
    }

    private LocalDate parseLocalDate(Cell dateCell, String dateStr) {
        if (dateCell != null && dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
            Date date = dateCell.getDateCellValue();
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }

        if (dateStr == null || dateStr.isBlank())
            return null;
        String trimmed = dateStr.trim();

        for (DateTimeFormatter fmt : COMBINED_FORMATTERS) {
            try {
                return LocalDateTime.parse(trimmed, fmt).toLocalDate();
            } catch (DateTimeParseException ignored) {
            }
        }

        for (DateTimeFormatter fmt : DATE_ONLY_FORMATTERS) {
            try {
                return LocalDate.parse(trimmed, fmt);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private LocalDateTime parseCellCombinedDate(Cell cell, String cellStr) {
        if (cell != null && cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            Date date = cell.getDateCellValue();
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        }

        if (cellStr == null || cellStr.isBlank())
            return null;

        for (DateTimeFormatter formatter : COMBINED_FORMATTERS) {
            try {
                return LocalDateTime.parse(cellStr.trim(), formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                    ? cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                            .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                    : String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK && !getCellValueAsString(cell).isBlank()) {
                return false;
            }
        }
        return true;
    }
}
