# Fake Instagram API Simulator & Meta Graph API Mock Monolith

## 1. Executive Summary & Architecture Overview

The **Fake Instagram API Simulator** is an isolated, stateful monolith service built inside this repository (`/fake-instagram-service`) using **Java 21, Spring Boot 3.3.4, Spring Data JPA, and H2 (PostgreSQL compatibility mode)**, featuring an embedded **Real-Time Admin Dashboard** (`http://localhost:8085/`).

It allows the InstaMngmt application to be stress-tested at extreme scale (10, 100, 1,000, 10,000, 20,000+ accounts and 100,000+ posts) without requiring real Instagram accounts, public CDN media dependencies, or Meta app review approvals.

```mermaid
graph TD
    UI["InstaMngmt Frontend (React 18 / Vite)"] -->|REST / JWT| App["InstaMngmt Backend (Spring Boot 3 :8080)"]
    
    subgraph Upstream Instagram Integration
        App --> Client["InstagramClientService (Centralized Integration Layer)"]
        Client -->|provider: real| Meta["Meta Graph API (https://graph.facebook.com)"]
        Client -->|provider: fake| Sim["Fake Instagram API Simulator (http://localhost:8085)"]
    end

    subgraph Fake Instagram Monolith (:8085)
        Sim --> Filter["SimulationFilter (Latency, Rate Limits 429, Forced Errors)"]
        Filter --> GraphAPI["Meta Graph API REST Controllers (/{version}/...)"]
        Filter --> AdminAPI["Admin & Benchmark Controllers (/admin/...)"]
        Sim --> Dash["Embedded Admin Control Dashboard (/)"]
        GraphAPI & AdminAPI --> H2[("Stateful H2 Database (fakeinstagramdb)")]
    end
```

---

## 2. Upstream Endpoint Mapping Inventory

Every endpoint consumed upstream by InstaMngmt's services is reproduced with the exact same HTTP method, URL structure, parameter contracts, and response schemas:

| # | Real Meta Endpoint | Fake Simulator Endpoint | Consumed By Application Service | HTTP Method | Supported Payload / Query Params |
|---|---|---|---|---|---|
| **1** | `https://graph.facebook.com/{v}/me` | `http://localhost:8085/{v}/me` | `InstagramClientService.getAccountInfo()` | `GET` | `fields=id,username,account_type&access_token=...` |
| **2** | `https://graph.facebook.com/{v}/{ig-user-id}` | `http://localhost:8085/{v}/{ig-user-id}` | `InstagramClientService.fetchAccountDetails()`, `InstagramAuthService.verifyAccountDetails()`, `getUserAccounts()` | `GET` | `fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,account_type&access_token=...` |
| **3** | `https://graph.facebook.com/{v}/{ig-user-id}/media` | `http://localhost:8085/{v}/{ig-user-id}/media` | `InstagramClientService.createMediaContainer()`, `InstagramPublishingWorker.executePublishing()` | `POST` | `application/x-www-form-urlencoded`<br>`access_token`, `image_url`, `video_url`, `media_type`, `caption`, `is_carousel_item`, `children` |
| **4** | `https://graph.facebook.com/{v}/{container-id}` | `http://localhost:8085/{v}/{container-id}` | `InstagramClientService.checkContainerStatus()`, `InstagramPublishingWorker.executePublishing()` | `GET` | `fields=status_code,status&access_token=...` |
| **5** | `https://graph.facebook.com/{v}/{ig-user-id}/media_publish` | `http://localhost:8085/{v}/{ig-user-id}/media_publish` | `InstagramClientService.publishMedia()`, `InstagramPublishingWorker.executePublishing()` | `POST` | `application/x-www-form-urlencoded`<br>`creation_id`, `access_token` |
| **6** | `https://graph.facebook.com/{v}/oauth/access_token` | `http://localhost:8085/{v}/oauth/access_token` | `InstagramClientService.refreshLongLivedToken()` | `GET` | `grant_type=fb_exchange_token&client_id=...&client_secret=...&fb_exchange_token=...` |
| **7** | `https://graph.facebook.com/{v}/{ig-user-id}/media` | `http://localhost:8085/{v}/{ig-user-id}/media` | Media Feed & Post Browser (Standard Meta Graph API) | `GET` | `fields=...&limit=25&after=...&before=...&access_token=...` (Cursor Pagination) |
| **8** | `https://graph.facebook.com/{v}/{media-id}` | `http://localhost:8085/{v}/{media-id}` | Media Post Details | `GET` | `fields=...&access_token=...` |
| **9** | `https://graph.facebook.com/{v}/{media-id}/comments` | `http://localhost:8085/{v}/{media-id}/comments` | Post Engagement & Comments | `GET` | `limit=...&access_token=...` |
| **10**| `https://graph.facebook.com/{v}/{ig-user-id}/insights` | `http://localhost:8085/{v}/{ig-user-id}/insights` | Account Analytics & Intelligence | `GET` | `metric=impressions,reach,profile_views&period=day&access_token=...` |

---

## 3. Environment Switching: Real vs Fake

InstaMngmt uses a centralized configuration property to toggle between providers without altering business logic:

### Configuration in `application.yml`:
```yaml
instagram:
  provider: ${INSTAGRAM_PROVIDER:real} # 'real' or 'fake'
  graph-api-base-url: ${INSTAGRAM_GRAPH_API_BASE_URL:https://graph.facebook.com}
  simulator-base-url: ${INSTAGRAM_SIMULATOR_BASE_URL:http://localhost:8085}
  api-version: v23.0
  app-id: ${INSTAGRAM_APP_ID:dummy-app-id}
  app-secret: ${INSTAGRAM_APP_SECRET:dummy-app-secret}
```

### Switching via Environment Variables:
- **Switch to Fake Simulator**:
  ```bash
  export INSTAGRAM_PROVIDER=fake
  export INSTAGRAM_SIMULATOR_BASE_URL=http://localhost:8085
  ```
- **Switch to Real Meta API**:
  ```bash
  export INSTAGRAM_PROVIDER=real
  export INSTAGRAM_GRAPH_API_BASE_URL=https://graph.facebook.com
  ```

---

## 4. How to Start the Simulator

The simulator is a self-contained Spring Boot monolith located in `fake-instagram-service/`:

```bash
cd fake-instagram-service
mvn spring-boot:run
```

Once started, access the Web Dashboard at:
👉 **`http://localhost:8085/`**

Database console (H2):
👉 **`http://localhost:8085/h2-console`** (JDBC URL: `jdbc:h2:file:./data/fakeinstagramdb`, User: `sa`, Password: `password`)

---

## 5. Bulk Generation Commands & Benchmarks

The simulator utilizes optimized JDBC batch insertions (`JdbcTemplate.batchUpdate` with batch chunking) to insert tens of thousands of accounts and posts with sub-second latency:

### Generate 1,000 Accounts:
```bash
curl -X POST http://localhost:8085/admin/test-data/accounts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "count": 1000,
    "generatePosts": true,
    "postsPerAccount": 5,
    "generateFollowers": true,
    "minFollowers": 100,
    "maxFollowers": 250000,
    "randomizeNames": true
  }'
```
*Benchmark Execution Time*: **~580 ms** for 1,000 accounts + 5,000 posts.

### Generate 10,000 Accounts:
```bash
curl -X POST http://localhost:8085/admin/test-data/accounts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "count": 10000,
    "generatePosts": true,
    "postsPerAccount": 2,
    "generateFollowers": true,
    "minFollowers": 50,
    "maxFollowers": 500000,
    "randomizeNames": true
  }'
```
*Benchmark Execution Time*: **~1.73 seconds** for 10,000 accounts + 20,000 posts.

### Generate 20,000 Accounts:
```bash
curl -X POST http://localhost:8085/admin/test-data/accounts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "count": 20000,
    "generatePosts": true,
    "postsPerAccount": 2,
    "generateFollowers": true,
    "minFollowers": 50,
    "maxFollowers": 1000000,
    "randomizeNames": true
  }'
```
*Benchmark Execution Time*: **~3.1 seconds** for 20,000 accounts + 40,000 posts.

---

## 6. Predefined Test Scenarios (1-Click Controls)

The simulator includes 8 predefined test scenarios activated via `POST /admin/scenarios/{scenarioName}` or through the Web UI:

| Scenario Name | Description | Simulated Condition |
|---|---|---|
| `NORMAL` | Standard operational baseline | 0ms latency, unlimited rate limits, active tokens |
| `LARGE_DATASET` | 10,000 accounts + 50,000 posts | Tests database indexing and UI pagination at scale |
| `EXTREME_DATASET`| 20,000 accounts + 100,000 posts | Extreme stress testing |
| `SLOW_API` | 2,000ms – 5,000ms artificial delay | Tests skeleton loaders, progress bars, and HTTP timeouts |
| `RATE_LIMITED` | 5 requests per minute limit | Returns HTTP 429 with Meta code 4 and `Retry-After: 60` |
| `TOKEN_FAILURE` | Forces token validation failure | Returns HTTP 401 with OAuthException code 190 |
| `SERVER_FAILURE` | Forces HTTP 500 server crash | Tests Resilience4j circuit breakers & exponential backoff |
| `EMPTY_DATA` | Drops all accounts and tokens | Tests empty states and new user onboarding |

---

## 7. Simulation Controls

### 7.1 Artificial Latency / Slow Network
```bash
curl -X POST http://localhost:8085/admin/simulation/latency \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "minMs": 1000, "maxMs": 3000}'
```

### 7.2 Rate Limit Simulation (HTTP 429)
```bash
curl -X POST http://localhost:8085/admin/simulation/rate-limit \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "maxRequestsPerMinute": 10}'
```

### 7.3 Token Expiration & Revocation
```bash
# Expire a specific token (triggers 401 on next call)
curl -X POST http://localhost:8085/admin/tokens/{token}/expire

# Revoke a token
curl -X POST http://localhost:8085/admin/tokens/{token}/revoke

# Restore token back to VALID
curl -X POST http://localhost:8085/admin/tokens/{token}/restore
```

### 7.4 Force HTTP Status Codes (400, 403, 500, 503)
```bash
curl -X POST http://localhost:8085/admin/simulation/force-error \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "statusCode": 500, "errorCode": 2, "errorMessage": "Meta internal outage"}'
```

### 7.5 Reset Simulator Data
```bash
curl -X DELETE http://localhost:8085/admin/test-data/reset
```

---

## 8. Automated Test Suite

Both the simulator and the existing application have full automated test suites:

### 1. Run Simulator Unit & Integration Tests:
```bash
cd fake-instagram-service
mvn test
```
*Coverage*:
- `testBulkAccountGeneration`: Bulk 500 generation speed (< 500ms), ID and username uniqueness.
- `testAccountRetrievalEndpoint`: `/v23.0/{id}` schema verification.
- `testMeEndpoint`: `/v23.0/me` resolution.
- `testMediaContainerAndPublishFlow`: Container creation, polling status (`FINISHED`), and publishing.
- `testTokenExpirationLifecycle`: Token expiration, 401 code 190 verification, and restoration.
- `testLongLivedTokenExchange`: 60-day token extension endpoint.
- `testRateLimitSimulation`: HTTP 429 trigger and headers.
- `testForcedErrorSimulation`: HTTP 500 error injection.
- `testMediaPagination`: Meta cursor pagination with `limit`, `after`, and `cursors`.

### 2. Run Backend Contract Tests:
```bash
cd backend
mvn test -Dtest=InstagramClientServiceFakeContractTest
```

### 3. Run Live End-to-End Integration Tests (against running simulator):
```bash
cd backend
mvn test -Dtest=LiveSimulatorIntegrationTest
```
