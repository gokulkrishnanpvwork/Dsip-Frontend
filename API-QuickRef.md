# DSIP Backend API - Quick Reference

## 📋 Base Information
- **Base URL:** `http://localhost:8080`
- **Authentication:** Session-based (Google OAuth2)
- **Admin API Key Header:** `X-Admin-API-Key`
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI Spec:** `http://localhost:8080/v3/api-docs`

---

## 🚀 Quick Start

### 1. Import Postman Collection
```bash
# Import the file: DSIP_Backend_Postman_Collection.json
```

### 2. Start the Backend
```bash
docker-compose up --build -d
```

### 3. Access Swagger UI
Open browser: `http://localhost:8080/swagger-ui.html`

---

## 📊 API Endpoints Summary

### Health & Info (2 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | Application info |

### Authentication (1 endpoint)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/status` | Get authentication status |

### User Management (3 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/me` | Get current user |
| GET | `/api/user/sessions/count` | Get active session count |
| POST | `/api/user/sessions/invalidate-all` | Invalidate all sessions |

### DSIP Tracker Management (8 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dsip-trackers` | Create tracker |
| GET | `/api/dsip-trackers` | Get all trackers (portfolio) |
| GET | `/api/dsip-trackers/{trackerId}` | Get tracker details |
| PUT | `/api/dsip-trackers/{trackerId}` | Update tracker |
| POST | `/api/dsip-trackers/{trackerId}/execute` | Execute trade |
| GET | `/api/dsip-trackers/{trackerId}/executions` | Get tracker executions |
| GET | `/api/dsip-trackers/{trackerId}/partitions/{partitionIndex}` | Get partition details |
| DELETE | `/api/dsip-trackers/{trackerId}` | Delete tracker |

### Stock Management (3 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stocks/close` | Get stock closing price |
| GET | `/api/stocks/cached` | Check if stock is cached |
| DELETE | `/api/stocks/cache` | Remove stock from cache |

### Admin - Whitelist Management (5 endpoints) 🔐
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/whitelist` | Get all whitelisted emails |
| POST | `/api/admin/whitelist` | Add whitelisted email |
| POST | `/api/admin/whitelist/bulk` | Bulk add whitelisted emails |
| DELETE | `/api/admin/whitelist/{email}` | Remove whitelisted email |
| GET | `/api/admin/whitelist/check/{email}` | Check if email is whitelisted |

**Total Endpoints:** 22

---

## 🔑 Common Request Examples

### Create Tracker
```bash
curl -X POST http://localhost:8080/api/dsip-trackers \
  -H "Content-Type: application/json" \
  -d '{
    "stock_symbol": "AAPL",
    "conviction_period_years": 5,
    "total_capital_planned": 100000,
    "partition_days": 30,
    "deployment_style": 1,
    "base_conviction_score": 75,
    "is_fractional_shares_allowed": true
  }'
```

### Execute Trade
```bash
curl -X POST http://localhost:8080/api/dsip-trackers/1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "lock_in_percentage": 50,
    "conviction_override": 85,
    "executed_amount": 5000,
    "execution_price": 176.25
  }'
```

### Get Stock Price
```bash
curl "http://localhost:8080/api/stocks/close?symbol=AAPL&exchange=US"
```

### Admin: Add Whitelist Email
```bash
curl -X POST http://localhost:8080/api/admin/whitelist \
  -H "Content-Type: application/json" \
  -H "X-Admin-API-Key: YOUR_API_KEY" \
  -d '{
    "email": "newuser@example.com"
  }'
```

---

## 📝 Enums Reference

### Deployment Style
```
0 = UNIFORM
1 = AGGRESSIVE
2 = CONSERVATIVE
```

### Tracker Status
```
0 = INACTIVE
1 = ACTIVE
2 = COMPLETED
3 = PAUSED
```

### Partition Status
```
0 = PENDING
1 = ACTIVE
2 = COMPLETED
```

### Exchange
```
US  = US Stock Market
NSE = National Stock Exchange (India)
BSE = Bombay Stock Exchange (India)
```

---

## 🔒 Authentication Flow

1. **Login:** Navigate to `http://localhost:8080/oauth2/authorization/google`
2. **Callback:** Redirected to `http://localhost:3000/auth/callback` (frontend)
3. **Session:** Session cookie is set automatically
4. **API Calls:** Include session cookie in subsequent requests

---

## 📦 Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (invalid admin key) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🛠️ Development Tools

### View Database
```bash
docker-compose exec -T postgres psql -U postgres -d dsip
```

### Check Logs
```bash
docker-compose logs -f app
```

### Restart Backend
```bash
docker-compose restart app
```

---

## 📚 Documentation Files

1. **API_DOCUMENTATION.md** - Complete API documentation with examples
2. **DSIP_Backend_Postman_Collection.json** - Postman collection (import this!)
3. **API_QUICK_REFERENCE.md** - This file
4. **Swagger UI** - Interactive API docs at `http://localhost:8080/swagger-ui.html`

---

## 💡 Tips

- Use Swagger UI for interactive testing
- Import Postman collection for organized API testing
- Admin endpoints require `X-Admin-API-Key` header
- Stock prices are cached daily (UTC timezone)
- All monetary values support decimals (DOUBLE PRECISION)
- Fractional shares are supported when enabled on tracker
