package com.instamngmt.service;

import com.instamngmt.exception.APIException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class StorageService {

    private final String localDir;
    private final String publicUrlPrefix;

    public StorageService(
            @Value("${app.storage.local-dir:./uploads}") String localDir,
            @Value("${app.storage.public-url-prefix:http://localhost:8080/uploads/}") String publicUrlPrefix) {
        this.localDir = localDir;
        this.publicUrlPrefix = publicUrlPrefix;
        File dir = new File(localDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    public StorageResult storeFile(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String storageKey = UUID.randomUUID().toString() + extension;
        Path targetPath = Paths.get(localDir).resolve(storageKey);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new APIException(HttpStatus.INTERNAL_SERVER_ERROR, "STORAGE_ERROR", "Failed to store uploaded media file");
        }

        String cdnUrl = publicUrlPrefix + storageKey;
        return new StorageResult(storageKey, cdnUrl);
    }

    public record StorageResult(String storageKey, String cdnUrl) {}
}
