package com.fakeinstagram.service;

import com.fakeinstagram.dto.AccountGenerateRequest;
import com.fakeinstagram.dto.PostGenerateRequest;
import com.fakeinstagram.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class TestDataGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(TestDataGeneratorService.class);

    private final JdbcTemplate jdbcTemplate;
    private final FakeAccountRepository fakeAccountRepository;
    private final FakeTokenRepository fakeTokenRepository;
    private final FakeMediaContainerRepository fakeMediaContainerRepository;
    private final FakePublishedMediaRepository fakePublishedMediaRepository;
    private final FakeCommentRepository fakeCommentRepository;

    private static final String[] FIRST_NAMES = {
            "Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Casey", "Riley", "Avery", "Jamie",
            "Elena", "Marcus", "Sophia", "Liam", "Noah", "Olivia", "Emma", "Lucas", "Maya", "Ethan"
    };

    private static final String[] LAST_NAMES = {
            "Vance", "Sterling", "Kovacs", "Sinclair", "Chen", "Novak", "Mercer", "Dubois", "Rossi", "Sato",
            "Patel", "Miller", "Davis", "Wilson", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris"
    };

    private static final String[] NICHES = {
            "tech", "fitness", "travel", "foodie", "design", "fashion", "crypto", "gaming", "music", "photo",
            "startup", "coffee", "art", "cinema", "marketing", "lifestyle", "coding", "beauty", "nature", "auto"
    };

    private static final String[] BIOS = {
            "Building next-gen digital experiences ✨ | DM for collabs",
            "Visual storyteller & content creator 📸 | New post daily",
            "Coffee lover, globetrotter & creative director ☕✈️",
            "Engineering high-performance applications 🚀 | Follow my journey",
            "Official brand channel. Elevating your everyday life 🌟",
            "Fitness & nutrition tips for peak productivity 💪",
            "Sharing honest insights into tech, business, and modern design 💡",
            "Exploring the world one snapshot at a time 🌍"
    };

    private static final String[] POST_CAPTIONS = {
            "Behind the scenes of our latest release! What do you think? 🚀 #launch #innovation",
            "Golden hour in the city never disappoints 🌇✨ #cityvibes #aesthetic",
            "Excited to announce our newest partnership! Link in bio 🔗 #collab #milestone",
            "A quick reminder to keep pushing forward today 💡 #motivation #focus",
            "Drop a comment with your favorite feature so far 👇 #community #feedback",
            "Sunday reflections & weekly prep ☕📖 #weekend #clarity",
            "Crafting perfection into every detail ✨ #quality #craftsmanship"
    };

    private static final String[] SAMPLE_IMAGES = {
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop"
    };

    public TestDataGeneratorService(
            JdbcTemplate jdbcTemplate,
            FakeAccountRepository fakeAccountRepository,
            FakeTokenRepository fakeTokenRepository,
            FakeMediaContainerRepository fakeMediaContainerRepository,
            FakePublishedMediaRepository fakePublishedMediaRepository,
            FakeCommentRepository fakeCommentRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.fakeAccountRepository = fakeAccountRepository;
        this.fakeTokenRepository = fakeTokenRepository;
        this.fakeMediaContainerRepository = fakeMediaContainerRepository;
        this.fakePublishedMediaRepository = fakePublishedMediaRepository;
        this.fakeCommentRepository = fakeCommentRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedInitialDataIfEmpty() {
        long count = fakeAccountRepository.count();
        if (count == 0) {
            log.info("Database is empty. Seeding initial baseline accounts and default tokens for immediate testing...");
            generateAccounts(AccountGenerateRequest.builder()
                    .count(25)
                    .generatePosts(true)
                    .postsPerAccount(6)
                    .generateFollowers(true)
                    .minFollowers(500)
                    .maxFollowers(85000)
                    .randomizeNames(true)
                    .build());
            log.info("Seeding complete. Ready for instant use.");
        }
    }

    /**
     * High-speed bulk account and token generation using batchUpdate.
     */
    public Map<String, Object> generateAccounts(AccountGenerateRequest request) {
        int count = Math.max(1, request.getCount());
        log.info("Starting high-throughput bulk generation of {} fake Instagram accounts...", count);
        long startTime = System.currentTimeMillis();

        Long maxExistingId = fakeAccountRepository.findMaxId();
        long startSeq = (maxExistingId != null ? maxExistingId : 0L) + 1;

        final int batchSize = 1000;
        List<Object[]> accountBatch = new ArrayList<>(batchSize);
        List<Object[]> tokenBatch = new ArrayList<>(batchSize);
        List<Object[]> postBatch = new ArrayList<>(batchSize);

        String insertAccountSql = "INSERT INTO fake_accounts " +
                "(ig_user_id, username, name, profile_picture_url, followers_count, following_count, media_count, biography, account_type, status, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        String insertTokenSql = "INSERT INTO fake_tokens " +
                "(token, ig_user_id, status, scopes, expires_at, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        String insertPostSql = "INSERT INTO fake_published_media " +
                "(media_id, ig_user_id, post_type, media_url, caption, permalink, like_count, comments_count, published_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        Timestamp now = Timestamp.valueOf(LocalDateTime.now());
        Timestamp sixtyDaysLater = Timestamp.valueOf(LocalDateTime.now().plusDays(60));

        List<Map<String, String>> sampleAccounts = new ArrayList<>();
        int totalPostsGenerated = 0;

        for (int i = 0; i < count; i++) {
            long currentSeq = startSeq + i;
            String igUserId = String.format("178414%011d", currentSeq);

            String firstName = FIRST_NAMES[ThreadLocalRandom.current().nextInt(FIRST_NAMES.length)];
            String lastName = LAST_NAMES[ThreadLocalRandom.current().nextInt(LAST_NAMES.length)];
            String niche = NICHES[ThreadLocalRandom.current().nextInt(NICHES.length)];
            String username = String.format("%s_%s_%d", niche, firstName.toLowerCase(), currentSeq);
            String fullName = firstName + " " + lastName;
            String avatarUrl = String.format("https://api.dicebear.com/7.x/identicon/svg?seed=%s", username);
            String bio = BIOS[ThreadLocalRandom.current().nextInt(BIOS.length)];

            int followers = request.isGenerateFollowers()
                    ? ThreadLocalRandom.current().nextInt(request.getMinFollowers(), request.getMaxFollowers() + 1)
                    : 1200;
            int following = ThreadLocalRandom.current().nextInt(20, Math.min(followers + 10, 1500));
            int postsCount = request.isGeneratePosts() ? request.getPostsPerAccount() : 0;

            accountBatch.add(new Object[]{
                    igUserId, username, fullName, avatarUrl, followers, following, postsCount, bio, "BUSINESS", "ACTIVE", now, now
            });

            // Token format: EAAG_fake_<seq>_<hash>
            String token = String.format("EAAG_fake_token_%s_%04d", igUserId, ThreadLocalRandom.current().nextInt(1000, 9999));
            tokenBatch.add(new Object[]{
                    token, igUserId, "VALID", "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement", sixtyDaysLater, now
            });

            if (sampleAccounts.size() < 10) {
                Map<String, String> sample = new LinkedHashMap<>();
                sample.put("igUserId", igUserId);
                sample.put("username", username);
                sample.put("name", fullName);
                sample.put("accessToken", token);
                sample.put("followersCount", String.valueOf(followers));
                sampleAccounts.add(sample);
            }

            if (request.isGeneratePosts() && request.getPostsPerAccount() > 0) {
                for (int p = 0; p < request.getPostsPerAccount(); p++) {
                    long postSeq = currentSeq * 100 + p;
                    String mediaId = String.format("18%015d", postSeq);
                    String postType = (p % 4 == 0) ? "REELS" : ((p % 3 == 0) ? "CAROUSEL" : "IMAGE");
                    String mediaUrl = SAMPLE_IMAGES[p % SAMPLE_IMAGES.length];
                    String caption = POST_CAPTIONS[p % POST_CAPTIONS.length];
                    String permalink = "https://www.instagram.com/p/" + mediaId + "/";
                    int likes = ThreadLocalRandom.current().nextInt(10, Math.max(15, followers / 10));
                    int comments = ThreadLocalRandom.current().nextInt(0, Math.max(2, likes / 20));
                    Timestamp postTime = Timestamp.valueOf(LocalDateTime.now().minusHours((long) p * 12));

                    postBatch.add(new Object[]{
                            mediaId, igUserId, postType, mediaUrl, caption, permalink, likes, comments, postTime
                    });
                    totalPostsGenerated++;

                    if (postBatch.size() >= batchSize) {
                        jdbcTemplate.batchUpdate(insertPostSql, postBatch);
                        postBatch.clear();
                    }
                }
            }

            if (accountBatch.size() >= batchSize) {
                jdbcTemplate.batchUpdate(insertAccountSql, accountBatch);
                jdbcTemplate.batchUpdate(insertTokenSql, tokenBatch);
                accountBatch.clear();
                tokenBatch.clear();
            }
        }

        // Flush remaining batches
        if (!accountBatch.isEmpty()) {
            jdbcTemplate.batchUpdate(insertAccountSql, accountBatch);
            jdbcTemplate.batchUpdate(insertTokenSql, tokenBatch);
            accountBatch.clear();
            tokenBatch.clear();
        }

        if (!postBatch.isEmpty()) {
            jdbcTemplate.batchUpdate(insertPostSql, postBatch);
            postBatch.clear();
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("Bulk generation completed: {} accounts and {} posts inserted in {} ms.", count, totalPostsGenerated, duration);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("generatedAccounts", count);
        result.put("generatedPosts", totalPostsGenerated);
        result.put("timeTakenMs", duration);
        result.put("sampleAccounts", sampleAccounts);
        return result;
    }

    /**
     * Bulk post generation for existing accounts.
     */
    public Map<String, Object> generatePosts(PostGenerateRequest request) {
        long startTime = System.currentTimeMillis();
        List<String> targetUserIds;

        if (request.getIgUserId() != null && !request.getIgUserId().isBlank()) {
            targetUserIds = List.of(request.getIgUserId().trim());
        } else {
            // Get up to 1000 accounts
            targetUserIds = jdbcTemplate.query("SELECT ig_user_id FROM fake_accounts LIMIT 1000",
                    (rs, rowNum) -> rs.getString("ig_user_id"));
        }

        if (targetUserIds.isEmpty()) {
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("success", false);
            res.put("message", "No accounts found to generate posts for.");
            return res;
        }

        String insertPostSql = "INSERT INTO fake_published_media " +
                "(media_id, ig_user_id, post_type, media_url, caption, permalink, like_count, comments_count, published_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        List<Object[]> postBatch = new ArrayList<>(1000);
        int totalPosts = 0;

        for (String igUserId : targetUserIds) {
            for (int p = 0; p < request.getCount(); p++) {
                String mediaId = String.format("18%015d", System.nanoTime() % 1000000000000000L);
                String postType = request.getPostType() != null && !request.getPostType().isBlank()
                        ? request.getPostType()
                        : ((p % 3 == 0) ? "REELS" : "IMAGE");
                String mediaUrl = SAMPLE_IMAGES[p % SAMPLE_IMAGES.length];
                String caption = POST_CAPTIONS[p % POST_CAPTIONS.length];
                String permalink = "https://www.instagram.com/p/" + mediaId + "/";
                int likes = ThreadLocalRandom.current().nextInt(5, 500);
                int comments = ThreadLocalRandom.current().nextInt(0, 50);
                Timestamp postTime = Timestamp.valueOf(LocalDateTime.now().minusHours((long) p * 6));

                postBatch.add(new Object[]{
                        mediaId, igUserId, postType, mediaUrl, caption, permalink, likes, comments, postTime
                });
                totalPosts++;

                if (postBatch.size() >= 1000) {
                    jdbcTemplate.batchUpdate(insertPostSql, postBatch);
                    postBatch.clear();
                }
            }

            // Update account media_count
            jdbcTemplate.update("UPDATE fake_accounts SET media_count = media_count + ? WHERE ig_user_id = ?",
                    request.getCount(), igUserId);
        }

        if (!postBatch.isEmpty()) {
            jdbcTemplate.batchUpdate(insertPostSql, postBatch);
            postBatch.clear();
        }

        long duration = System.currentTimeMillis() - startTime;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("generatedPosts", totalPosts);
        result.put("accountsUpdated", targetUserIds.size());
        result.put("timeTakenMs", duration);
        return result;
    }

    /**
     * Resets all simulator database records.
     */
    @Transactional
    public void resetAllData() {
        log.info("Resetting all simulator test data...");
        jdbcTemplate.execute("DELETE FROM fake_comments");
        jdbcTemplate.execute("DELETE FROM fake_published_media");
        jdbcTemplate.execute("DELETE FROM fake_media_containers");
        jdbcTemplate.execute("DELETE FROM fake_tokens");
        jdbcTemplate.execute("DELETE FROM fake_accounts");
        log.info("All simulator test data cleared.");
    }
}
