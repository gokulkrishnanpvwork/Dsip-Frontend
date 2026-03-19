# DSIP Backend API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:8080`  
**Authentication:** Session-based (Google OAuth2)  
**Swagger UI:** `http://localhost:8080/swagger-ui.html`  
**OpenAPI Spec:** `http://localhost:8080/v3/api-docs`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Info](#health--info)
3. [User Management](#user-management)
4. [DSIP Tracker Management](#dsip-tracker-management)
5. [DSIP Sync](#dsip-sync)
6. [Stock Management](#stock-management)
7. [Admin - Whitelist Management](#admin---whitelist-management)
8. [Data Models](#data-models)
9. [Enums Reference](#enums-reference)
10. [Error Responses](#error-responses)

---

## Authentication

### OAuth2 Flow

1. **Initiate Login:** Navigate to `/oauth2/authorization/google`
2. **Google Authentication:** User completes Google OAuth2 flow
3. **Callback:** Redirected to frontend with session cookie
4. **Session Cookie:** Automatically included in subsequent requests

### Admin Endpoints

Admin endpoints require the `X-Admin-API-Key` header:

```bash
X-Admin-API-Key: <your-admin-api-key>
```

**Admin API Key:** Set in `.env` file as `ADMIN_API_KEY`

---

## Health & Info

### 1. Health Check

**Endpoint:** `GET /health`  
**Authentication:** None  
**Description:** Check if the application is running

**Response:**
```json
{
  "status": "UP",
  "timestamp": "2026-02-14T12:00:00.000Z"
}
```

**cURL Example:**
```bash
curl http://localhost:8080/health
```

---

### 2. Application Info

**Endpoint:** `GET /`  
**Authentication:** None  
**Description:** Get basic application information

**Response:**
```json
{
  "application": "DSIP Backend",
  "version": "1.0.0"
}
```

**cURL Example:**
```bash
curl http://localhost:8080/
```

---

## User Management

### 1. Get Authentication Status

**Endpoint:** `GET /api/auth/status`  
**Authentication:** Optional  
**Description:** Check current authentication status

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "profilePicture": "https://example.com/photo.jpg",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

**cURL Example:**
```bash
curl -b cookies.txt http://localhost:8080/api/auth/status
```

---

### 2. Get Current User

**Endpoint:** `GET /api/user/me`  
**Authentication:** Required (Session)  
**Description:** Get details of the currently authenticated user

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "profilePicture": "https://example.com/photo.jpg",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -b cookies.txt http://localhost:8080/api/user/me
```

---

### 3. Get Active Session Count

**Endpoint:** `GET /api/user/sessions/count`  
**Authentication:** Required (Session)  
**Description:** Get the number of active sessions for the current user

**Response:**
```json
{
  "activeSessions": 3
}
```

**cURL Example:**
```bash
curl -b cookies.txt http://localhost:8080/api/user/sessions/count
```

---

### 4. Invalidate All Sessions

**Endpoint:** `POST /api/user/sessions/invalidate-all`  
**Authentication:** Required (Session)  
**Description:** Invalidate all active sessions for the current user

**Response:**
```json
{
  "message": "All sessions invalidated"
}
```

**cURL Example:**
```bash
curl -X POST -b cookies.txt http://localhost:8080/api/user/sessions/invalidate-all
```

---

## DSIP Tracker Management

### 1. Create Tracker

**Endpoint:** `POST /api/dsip-trackers`  
**Authentication:** Required (Session)  
**Description:** Create a new DSIP investment tracker

**Request Body:**
```json
{
  "stock_symbol": "AAPL",
  "conviction_period_years": 5.0,
  "total_capital_planned": 100000.0,
  "partition_months": 1,
  "deployment_style": "AGGRESSIVE",
  "base_conviction_score": 75,
  "initial_invested_amount": 5000.0,
  "initial_shares_held": 25.5,
  "is_fractional_shares_allowed": true
}
```

**Field Descriptions:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `stock_symbol` | string | Yes | Not blank | Stock ticker symbol (e.g., "AAPL") |
| `conviction_period_years` | number | Yes | ≥ 1 | Investment period in years |
| `total_capital_planned` | number | Yes | ≥ 1 | Total capital to invest |
| `partition_months` | integer | Yes | ≥ 1 | Months between investment partitions |
| `deployment_style` | enum | Yes | UNIFORM, AGGRESSIVE, CONSERVATIVE | Investment deployment strategy |
| `base_conviction_score` | integer | Yes | 0-100 | Base conviction score |
| `initial_invested_amount` | number | No | ≥ 0 | Already invested amount (default: 0) |
| `initial_shares_held` | number | No | ≥ 0 | Already held shares (default: 0) |
| `is_fractional_shares_allowed` | boolean | No | - | Allow fractional shares (default: false) |

**Response:**
```json
{
  "trackerId": 1,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "stock_id": 123,
  "stock_symbol": "AAPL",
  "conviction_period_years": 5.0,
  "total_capital_planned": 100000.0,
  "partition_months": 1,
  "deployment_style": "AGGRESSIVE",
  "base_conviction_score": 75,
  "initial_invested_amount": 5000.0,
  "initial_shares_held": 25.5,
  "status": "ACTIVE",
  "active_partition_index": 1,
  "total_capital_invested_so_far": 5000.0,
  "shares_held_so_far": 25.5,
  "is_fractional_shares_allowed": true,
  "createdAt": "2026-02-14T10:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/dsip-trackers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "stock_symbol": "AAPL",
    "conviction_period_years": 5.0,
    "total_capital_planned": 100000.0,
    "partition_months": 1,
    "deployment_style": "AGGRESSIVE",
    "base_conviction_score": 75,
    "is_fractional_shares_allowed": true
  }'
```

---

### 2. Get All Trackers (Portfolio)

**Endpoint:** `GET /api/dsip-trackers`  
**Authentication:** Required (Session)  
**Description:** Get all trackers for the current user with portfolio summary

**Response:**
```json
{
  "total_market_value": 125000.0,
  "total_capital_invested_so_far": 100000,
  "net_profit_percentage": 25.0,
  "dsip_total_market_value": 120000.0,
  "dsip_total_capital_invested_so_far": 95000,
  "dsip_total_net_profit_percentage": 26.3,
  "dsip_trackers": [
    {
      "id": 1,
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "total_capital_invested_so_far": 50000.0,
      "current_total_value": 62500.0,
      "net_profit_percentage": 25.0,
      "dsip_total_market_value": 60000.0,
      "dsip_total_capital_invested_so_far": 47500.0,
      "dsip_net_profit_percentage": 26.3,
      "active_partition_index": 3,
      "status": "ACTIVE"
    }
  ]
}
```

**cURL Example:**
```bash
curl -b cookies.txt http://localhost:8080/api/dsip-trackers
```

---

### 3. Get Tracker Details

**Endpoint:** `GET /api/dsip-trackers/{trackerId}`  
**Authentication:** Required (Session)  
**Description:** Get detailed information about a specific tracker

**Path Parameters:**
- `trackerId` (integer) - The tracker ID

**Response:**
```json
{
  "id": 1,
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "conviction_period_years": 5.0,
  "total_capital_planned": 100000.0,
  "partition_months": 1,
  "deployment_style": "AGGRESSIVE",
  "base_conviction_score": 75,
  "status": "ACTIVE",
  "total_capital_invested_so_far": 50000.0,
  "current_total_value": 62500.0,
  "net_profit_percentage": 25.0,
  "dsip_total_market_value": 60000.0,
  "dsip_total_capital_invested_so_far": 47500.0,
  "dsip_net_profit_percentage": 26.3,
  "active_partition_index": 3,
  "total_cycles": 10,
  "history": [
    {
      "date": "2026-02-10T14:30:00Z",
      "executed_amount": 5000.0,
      "executed_price": 175.50
    }
  ],
  "live_investment_cycle": {
    "total_capital_invested_so_far": 7500.0,
    "partition_progress": 75.0,
    "net_profit_percentage": 5.2
  }
}
```

**cURL Example:**
```bash
curl -b cookies.txt http://localhost:8080/api/dsip-trackers/1
```

---

### 4. Update Tracker

**Endpoint:** `PUT /api/dsip-trackers/{trackerId}`  
**Authentication:** Required (Session)  
**Description:** Update tracker settings

**Path Parameters:**
- `trackerId` (integer) - The tracker ID

**Request Body:**
```json
{
  "deployment_style": "CONSERVATIVE",
  "base_conviction_score": 80,
  "status": "ACTIVE",
  "total_capital_planned": 120000.0,
  "conviction_period_years": 6.0,
  "partition_months": 2
}
```

**Field Descriptions:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `deployment_style` | enum | No | UNIFORM, AGGRESSIVE, CONSERVATIVE | Investment deployment strategy |
| `base_conviction_score` | integer | No | 0-100 | Base conviction score |
| `status` | enum | No | INACTIVE, ACTIVE, COMPLETED, PAUSED | Tracker status |
| `total_capital_planned` | number | No | ≥ 1 | Total capital to invest |
| `conviction_period_years` | number | No | ≥ 1 | Investment period in years |
| `partition_months` | integer | No | ≥ 1 | Months between partitions |

**Note:** All fields are optional. Only include fields you want to update.

**Response:** Same as "Get Tracker Details"

**cURL Example:**
```bash
curl -X PUT http://localhost:8080/api/dsip-trackers/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "deployment_style": "CONSERVATIVE",
    "base_conviction_score": 80
  }'
```

---

### 5. Execute Trade

**Endpoint:** `POST /api/dsip-trackers/{trackerId}/execute`  
**Authentication:** Required (Session)  
**Description:** Execute a trade for a tracker

**Path Parameters:**
- `trackerId` (integer) - The tracker ID

**Request Body:**
```json
{
  "lock_in_percentage": -5.0,
  "conviction_override": 85,
  "executed_amount": 5000.0,
  "execution_price": 176.25
}
```

**Field Descriptions:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `lock_in_percentage` | number | Yes | ≤ 100 | Lock-in percentage (negative for below previous close) |
| `conviction_override` | integer | Yes | 0-100 | Override conviction score |
| `executed_amount` | number | Yes | ≥ 1 | Amount invested in this execution |
| `execution_price` | number | Yes | ≥ 1 | Price per share at execution |

**Response:**
```json
{
  "status": "EXECUTED",
  "end_reason": "SUCCESS"
}
```

**Field Descriptions:**
- `status`: Always "EXECUTED" when successful
- `end_reason`: Reason partition ended (if applicable)
  - `SUCCESS` - Partition completed successfully
  - `KILL_SWITCH` - Partition killed due to poor performance
  - `NEUTRAL_PARTITION` - Partition ended as neutral
  - `null` - Partition still active

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/dsip-trackers/1/execute \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "lock_in_percentage": -5.0,
    "conviction_override": 85,
    "executed_amount": 5000.0,
    "execution_price": 176.25
  }'
```

---

### 6. Get Investment Recommendation ⭐ NEW

**Endpoint:** `GET /api/dsip-trackers/{trackerId}/recommendation`  
**Authentication:** Required (Session)  
**Description:** Get daily investment recommendation with calculation breakdown

**Path Parameters:**
- `trackerId` (integer) - The tracker ID

**Query Parameters:**
- `lock_in_pct` (number, required) - Lock-in percentage (e.g., -5.0 for 5% below previous close)

**Response:**
```json
{
  "tracker_id": 1,
  "recommended_amount": 7500.0,
  "breakdown": {
    "neutral_capital": 5000.0,
    "opportunity_multiplier": 1.2,
    "contingency_multiplier": 1.25,
    "final_multiplier": 1.5
  },
  "signals": {
    "avg_holding_price": 170.50,
    "avg_deviation_pct": -3.2,
    "avg_signal": 0.8,
    "lock_in_pct": -5.0,
    "lock_in_signal": 1.0,
    "raw_opportunity_signal": 1.8,
    "conviction_amplifier": 0.75,
    "is_abnormal_dip": true
  },
  "partition_status": {
    "partition_index": 3,
    "partition_progress_pct": 60.0,
    "return_progress_pct": 45.0,
    "growth_persistence_pct": 80.0,
    "time_progress_pct": 50.0,
    "capital_progress_pct": 70.0,
    "capital_deployed": 7000.0,
    "capital_remaining": 3000.0,
    "cumulative_return_pct": 12.5
  }
}
```

**Field Descriptions:**

**Breakdown:**
- `neutral_capital`: Base capital allocation for the day
- `opportunity_multiplier`: Multiplier based on market opportunity
- `contingency_multiplier`: Multiplier based on partition progress
- `final_multiplier`: Combined multiplier applied to neutral capital

**Signals:**
- `avg_holding_price`: Average price of held shares
- `avg_deviation_pct`: Percentage deviation from average holding price
- `avg_signal`: Signal strength from average deviation
- `lock_in_pct`: Lock-in percentage provided
- `lock_in_signal`: Signal strength from lock-in percentage
- `raw_opportunity_signal`: Raw opportunity signal before conviction amplification
- `conviction_amplifier`: Conviction-based amplifier
- `is_abnormal_dip`: Whether current price is an abnormal dip

**Partition Status:**
- `partition_index`: Current partition index
- `partition_progress_pct`: Overall partition progress
- `return_progress_pct`: Return progress percentage
- `growth_persistence_pct`: Growth persistence percentage
- `time_progress_pct`: Time progress percentage
- `capital_progress_pct`: Capital deployment progress
- `capital_deployed`: Capital deployed in partition
- `capital_remaining`: Capital remaining in partition
- `cumulative_return_pct`: Cumulative return percentage

**cURL Example:**
```bash
curl -b cookies.txt "http://localhost:8080/api/dsip-trackers/1/recommendation?lock_in_pct=-5.0"
```

---

### 7. Get Tracker Executions

**Endpoint:** `GET /api/dsip-trackers/{trackerId}/executions`  
**Authentication:** Required (Session)  
**Description:** Get recent executions for a tracker

**Path Parameters:**
- `trackerId` (integer) - The tracker ID

**Query Parameters:**
- `limit` (integer, optional) - Number of recent executions to return (default: 6)

**Response:**
```json
[
  {
    "executionId": 5,
    "trackerId": 1,
    "partitionId": 3,
    "lockInPercentage": -5.0,
    "convictionOverride": 85,
    "executedAmount": 5000.0,
    "executionPrice": 176.25,
    "createdAt": "2026-02-14T14:30:00Z"
  }
]
```

**cURL Example:**
```bash
curl -b cookies.txt "http://localhost:8080/api/dsip-trackers/1/executions?limit=10"
```

---

### 8. Get Partition Details

**Endpoint:** `GET /api/dsip-trackers/{trackerId}/partitions/{partitionIndex}`  
**Authentication:** Required (Session)  
**Description:** Get details of a specific partition

**Path Parameters:**
- `trackerId` (integer) - The tracker ID
- `partitionIndex` (integer) - The partition index (1-based)

**Response:**
```json
{
  "partitionId": 3,
  "trackerId": 1,
  "partitionIndex": 3,
  "expectedPartitionDays": 30,
  "partitionCapitalAllocated": 10000.0,
  "capitalInvestedSoFar": 7500.0,
  "noOfSharesBought": 42.5,
  "successfulGrowthCount": 15,
  "status": "ACTIVE",
  "partitionEndDate": null,
  "createdAt": "2026-02-01T10:00:00Z"
}
```

**cURL Example:**
```bash
curl -b cookies.txt http://localhost:8080/api/dsip-trackers/1/partitions/3
```

---

### 9. Delete Tracker

**Endpoint:** `DELETE /api/dsip-trackers/{trackerId}`  
**Authentication:** Required (Session)  
**Description:** Delete a tracker

**Path Parameters:**
- `trackerId` (integer) - The tracker ID

**Response:**
```json
{
  "message": "Tracker deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE -b cookies.txt http://localhost:8080/api/dsip-trackers/1
```

---

### 10. End Partition Action ⭐ NEW

**Endpoint:** `POST /api/dsip-trackers/end-action`  
**Authentication:** Required (Session)  
**Description:** Manually end a partition

**Query Parameters:**
- `trackerId` (integer, required) - The tracker ID
- `partitionIndex` (integer, required) - The partition index to end

**Response:** 200 OK (empty body)

**cURL Example:**
```bash
curl -X POST -b cookies.txt \
  "http://localhost:8080/api/dsip-trackers/end-action?trackerId=1&partitionIndex=3"
```

---

## DSIP Sync

### Sync Tracker Data ⭐ NEW

**Endpoint:** `POST /api/dsip/sync`  
**Authentication:** Required (Session)  
**Description:** Sync tracker data with external holdings (e.g., from broker)

**Request Body:**
```json
{
  "tracker_id": 1,
  "current_total_shares": 150.5,
  "current_total_invested_amount": 75000.0,
  "reason": "Manual sync from broker statement"
}
```

**Field Descriptions:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `tracker_id` | integer | Yes | - | The tracker ID to sync |
| `current_total_shares` | number | Yes | ≥ 0 | Current total shares held |
| `current_total_invested_amount` | number | Yes | ≥ 0 | Current total invested amount |
| `reason` | string | No | - | Reason for sync (optional) |

**Response (Success):**
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "dsip_shares": 125.0,
  "dsip_capital_deployed": 62500.0,
  "total_shares": 150.5,
  "total_invested_amount": 75000.0
}
```

**Response (Blocked):**
```json
{
  "success": false,
  "message": "Sync blocked: Active partition in progress"
}
```

**Field Descriptions:**
- `success`: Whether sync was successful
- `message`: Status message
- `dsip_shares`: Shares acquired through DSIP (excluding initials)
- `dsip_capital_deployed`: Capital deployed through DSIP (excluding initials)
- `total_shares`: Total shares after sync
- `total_invested_amount`: Total invested amount after sync

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/dsip/sync \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "tracker_id": 1,
    "current_total_shares": 150.5,
    "current_total_invested_amount": 75000.0,
    "reason": "Manual sync from broker"
  }'
```

---

## Stock Management

### 1. Get Stock Closing Price

**Endpoint:** `GET /api/stocks/close`  
**Authentication:** None  
**Description:** Get the latest closing price for a stock (cached daily)

**Query Parameters:**
- `symbol` (string, required) - Stock ticker symbol
- `exchange` (enum, required) - Exchange code: `US`, `NSE`, or `BSE`

**Response:**
```json
{
  "symbol": "AAPL",
  "stockName": "Apple Inc.",
  "closePrice": 175.50,
  "lastUpdatedDate": "2026-02-14T00:00:00Z",
  "source": "cache"
}
```

**Field Descriptions:**
- `source`: `"cache"` (from DB) or `"api"` (freshly fetched)

**cURL Example:**
```bash
curl "http://localhost:8080/api/stocks/close?symbol=AAPL&exchange=US"
```

---

### 2. Check if Stock is Cached

**Endpoint:** `GET /api/stocks/cached`  
**Authentication:** None  
**Description:** Check if a stock is cached in the database

**Query Parameters:**
- `symbol` (string, required) - Stock ticker symbol

**Response:**
```json
{
  "symbol": "AAPL",
  "cached": true
}
```

**cURL Example:**
```bash
curl "http://localhost:8080/api/stocks/cached?symbol=AAPL"
```

---

### 3. Remove Stock from Cache

**Endpoint:** `DELETE /api/stocks/cache`  
**Authentication:** None  
**Description:** Remove a stock from the cache

**Query Parameters:**
- `symbol` (string, required) - Stock ticker symbol

**Response:**
```json
{
  "symbol": "AAPL",
  "message": "Stock removed from cache",
  "status": "success"
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8080/api/stocks/cache?symbol=AAPL"
```

---

## Admin - Whitelist Management

**All admin endpoints require the `X-Admin-API-Key` header.**

### 1. Get All Whitelisted Emails

**Endpoint:** `GET /api/admin/whitelist`  
**Authentication:** Admin API Key  
**Description:** Get all whitelisted emails

**Headers:**
```
X-Admin-API-Key: <your-admin-api-key>
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "addedBy": "admin",
    "createdAt": "2026-01-10T08:00:00Z"
  }
]
```

**cURL Example:**
```bash
curl -H "X-Admin-API-Key: YOUR_KEY" \
  http://localhost:8080/api/admin/whitelist
```

---

### 2. Add Whitelisted Email

**Endpoint:** `POST /api/admin/whitelist`  
**Authentication:** Admin API Key  
**Description:** Add an email to the whitelist

**Headers:**
```
X-Admin-API-Key: <your-admin-api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com"
}
```

**Response:** 201 Created
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "email": "newuser@example.com",
  "addedBy": "admin",
  "createdAt": "2026-02-14T17:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/admin/whitelist \
  -H "Content-Type: application/json" \
  -H "X-Admin-API-Key: YOUR_KEY" \
  -d '{"email": "newuser@example.com"}'
```

---

### 3. Bulk Add Whitelisted Emails

**Endpoint:** `POST /api/admin/whitelist/bulk`  
**Authentication:** Admin API Key  
**Description:** Add multiple emails to the whitelist

**Headers:**
```
X-Admin-API-Key: <your-admin-api-key>
Content-Type: application/json
```

**Request Body:**
```json
[
  "user1@example.com",
  "user2@example.com",
  "user3@example.com"
]
```

**Response:**
```json
{
  "added": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "email": "user1@example.com",
      "addedBy": "admin",
      "createdAt": "2026-02-14T17:00:00Z"
    }
  ],
  "alreadyExists": ["user2@example.com"],
  "totalAdded": 1,
  "totalAlreadyExists": 1
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/admin/whitelist/bulk \
  -H "Content-Type: application/json" \
  -H "X-Admin-API-Key: YOUR_KEY" \
  -d '["user1@example.com", "user2@example.com"]'
```

---

### 4. Remove Whitelisted Email

**Endpoint:** `DELETE /api/admin/whitelist/{email}`  
**Authentication:** Admin API Key  
**Description:** Remove an email from the whitelist

**Headers:**
```
X-Admin-API-Key: <your-admin-api-key>
```

**Path Parameters:**
- `email` (string) - Email to remove

**Response:**
```json
{
  "message": "Email removed from whitelist"
}
```

**cURL Example:**
```bash
curl -X DELETE \
  -H "X-Admin-API-Key: YOUR_KEY" \
  http://localhost:8080/api/admin/whitelist/user@example.com
```

---

### 5. Check if Email is Whitelisted

**Endpoint:** `GET /api/admin/whitelist/check/{email}`  
**Authentication:** Admin API Key  
**Description:** Check if an email is whitelisted

**Headers:**
```
X-Admin-API-Key: <your-admin-api-key>
```

**Path Parameters:**
- `email` (string) - Email to check

**Response:**
```json
{
  "whitelisted": true
}
```

**cURL Example:**
```bash
curl -H "X-Admin-API-Key: YOUR_KEY" \
  http://localhost:8080/api/admin/whitelist/check/user@example.com
```

---

## Data Models

### UserDto
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "profilePicture": "string (URL)",
  "createdAt": "timestamp"
}
```

### DsipTrackerDto
```json
{
  "trackerId": "integer",
  "userId": "uuid",
  "stock_id": "integer",
  "stock_symbol": "string",
  "conviction_period_years": "number",
  "total_capital_planned": "number",
  "partition_months": "integer",
  "deployment_style": "enum",
  "base_conviction_score": "integer (0-100)",
  "initial_invested_amount": "number",
  "initial_shares_held": "number",
  "status": "enum",
  "active_partition_index": "integer",
  "total_capital_invested_so_far": "number",
  "shares_held_so_far": "number",
  "is_fractional_shares_allowed": "boolean",
  "createdAt": "timestamp"
}
```

### DsipExecutionRequestDto
```json
{
  "lock_in_percentage": "number (≤100)",
  "conviction_override": "integer (0-100)",
  "executed_amount": "number (≥1)",
  "execution_price": "number (≥1)"
}
```

### SyncRequest
```json
{
  "tracker_id": "integer",
  "current_total_shares": "number (≥0)",
  "current_total_invested_amount": "number (≥0)",
  "reason": "string (optional)"
}
```

### SyncResponse
```json
{
  "success": "boolean",
  "message": "string",
  "dsip_shares": "number",
  "dsip_capital_deployed": "number",
  "total_shares": "number",
  "total_invested_amount": "number"
}
```

---

## Enums Reference

### DeploymentStyle
- `UNIFORM` - Uniform capital deployment
- `AGGRESSIVE` - Aggressive deployment (front-loaded)
- `CONSERVATIVE` - Conservative deployment (back-loaded)

### TrackerStatus
- `INACTIVE` - Tracker is inactive
- `ACTIVE` - Tracker is active
- `COMPLETED` - Tracker completed
- `PAUSED` - Tracker paused

### PartitionStatus
- `PENDING` - Partition pending
- `ACTIVE` - Partition active
- `COMPLETED` - Partition completed

### EndReason
- `SUCCESS` - Partition completed successfully
- `KILL_SWITCH` - Partition killed due to poor performance
- `NEUTRAL_PARTITION` - Partition ended as neutral

### Exchange
- `US` - US Stock Market
- `NSE` - National Stock Exchange (India)
- `BSE` - Bombay Stock Exchange (India)

---

## Error Responses

All endpoints may return the following error formats:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "message": "Total capital planned must be at least 1",
  "timestamp": "2026-02-14T17:00:00Z"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "timestamp": "2026-02-14T17:00:00Z"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Invalid admin API key",
  "timestamp": "2026-02-14T17:00:00Z"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Tracker not found",
  "timestamp": "2026-02-14T17:00:00Z"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2026-02-14T17:00:00Z"
}
```

---

## Summary

**Total Endpoints:** 25

| Category | Endpoints | Authentication |
|----------|-----------|----------------|
| Health & Info | 2 | None |
| Authentication | 1 | Optional |
| User Management | 3 | Session |
| DSIP Tracker Management | 10 | Session |
| DSIP Sync | 1 | Session |
| Stock Management | 3 | None |
| Admin - Whitelist | 5 | API Key |

**New Endpoints:**
- ⭐ `POST /api/dsip/sync` - Sync tracker data
- ⭐ `GET /api/dsip-trackers/{trackerId}/recommendation` - Get investment recommendation
- ⭐ `POST /api/dsip-trackers/end-action` - End partition action
