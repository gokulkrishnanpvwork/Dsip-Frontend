# API Documentation

This project includes comprehensive API documentation in multiple formats:

## 📚 Available Documentation

### 1. **Markdown Documentation** 📖
**File:** `API_DOCUMENTATION.md`

Complete API reference with:
- All 22 endpoints documented
- Request/response examples
- Field descriptions and validations
- Error response formats
- Enum references

### 2. **Postman Collection** 📮
**File:** `DSIP_Backend_Postman_Collection.json`

Ready-to-import Postman collection with:
- All endpoints pre-configured
- Example request bodies
- Environment variables for base URL and admin API key
- Organized into logical folders

**How to Import:**
1. Open Postman
2. Click "Import" button
3. Select `DSIP_Backend_Postman_Collection.json`
4. Start testing!

### 3. **Quick Reference Guide** ⚡
**File:** `API_QUICK_REFERENCE.md`

Quick lookup guide with:
- Endpoint summary table
- Common cURL examples
- Enum reference
- Development tips

### 4. **Interactive Swagger UI** 🎯
**URL:** `http://localhost:8080/swagger-ui.html`

Interactive API documentation with:
- Try-it-out functionality
- Real-time testing
- Auto-generated from code
- OpenAPI 3.0 specification

**OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

## 🚀 Quick Start

### Option 1: Use Swagger UI (Recommended for Testing)
```bash
# Start the backend
docker-compose up -d

# Open browser
open http://localhost:8080/swagger-ui.html
```

### Option 2: Use Postman
```bash
# Import the collection file
# DSIP_Backend_Postman_Collection.json

# Update variables if needed:
# - baseUrl: http://localhost:8080
# - adminApiKey: <your-admin-api-key>
```

### Option 3: Use cURL
```bash
# Example: Get stock price
curl "http://localhost:8080/api/stocks/close?symbol=AAPL&exchange=US"

# Example: Create tracker (requires authentication)
curl -X POST http://localhost:8080/api/dsip-trackers \
  -H "Content-Type: application/json" \
  -d '{
    "stock_symbol": "AAPL",
    "conviction_period_years": 5,
    "total_capital_planned": 100000,
    "partition_days": 30,
    "deployment_style": 1,
    "base_conviction_score": 75
  }'
```

## 📊 API Overview

**Total Endpoints:** 22

| Category | Endpoints | Authentication Required |
|----------|-----------|------------------------|
| Health & Info | 2 | ❌ No |
| Authentication | 1 | ✅ Yes |
| User Management | 3 | ✅ Yes |
| DSIP Tracker Management | 8 | ✅ Yes |
| Stock Management | 3 | ❌ No |
| Admin - Whitelist | 5 | 🔐 Admin Key Required |

## 🔑 Authentication

### User Endpoints
Most endpoints require Google OAuth2 authentication:
1. Navigate to `/oauth2/authorization/google`
2. Complete Google login
3. Session cookie is automatically set
4. Use session cookie for subsequent requests

### Admin Endpoints
Admin endpoints require the `X-Admin-API-Key` header:
```bash
curl -H "X-Admin-API-Key: YOUR_API_KEY" \
  http://localhost:8080/api/admin/whitelist
```

**Default Admin API Key:** Set in `.env` file as `ADMIN_API_KEY`

## 📝 Common Use Cases

### 1. Create a New Investment Tracker
```json
POST /api/dsip-trackers
{
  "stock_symbol": "AAPL",
  "conviction_period_years": 5,
  "total_capital_planned": 100000,
  "partition_days": 30,
  "deployment_style": 1,
  "base_conviction_score": 75,
  "is_fractional_shares_allowed": true
}
```

### 2. Execute a Trade
```json
POST /api/dsip-trackers/{trackerId}/execute
{
  "lock_in_percentage": 50,
  "conviction_override": 85,
  "executed_amount": 5000,
  "execution_price": 176.25
}
```

### 3. Get Portfolio Overview
```
GET /api/dsip-trackers
```

### 4. Get Stock Price (with caching)
```
GET /api/stocks/close?symbol=AAPL&exchange=US
```

### 5. Manage Whitelist (Admin)
```json
POST /api/admin/whitelist
Headers: X-Admin-API-Key: YOUR_KEY
{
  "email": "newuser@example.com"
}
```

## 🛠️ Development

### View All Endpoints
```bash
# Using Swagger
open http://localhost:8080/swagger-ui.html

# Using OpenAPI JSON
curl http://localhost:8080/v3/api-docs | jq
```

### Test Endpoints
```bash
# Health check
curl http://localhost:8080/health

# Get all trackers (requires auth)
curl -b cookies.txt http://localhost:8080/api/dsip-trackers
```

## 📖 Additional Resources

- **Full API Documentation:** See `API_DOCUMENTATION.md`
- **Quick Reference:** See `API_QUICK_REFERENCE.md`
- **Postman Collection:** Import `DSIP_Backend_Postman_Collection.json`
- **Swagger UI:** Visit `http://localhost:8080/swagger-ui.html` when running

## 🔄 API Versioning

Current API Version: **v1.0.0**

All endpoints are prefixed with `/api/` except:
- Health check: `/health`
- Root info: `/`
- OAuth2 endpoints: `/oauth2/*`

## 📞 Support

For API questions or issues:
1. Check the Swagger UI for interactive documentation
2. Review the detailed API documentation in `API_DOCUMENTATION.md`
3. Use the Postman collection for testing
4. Check application logs: `docker-compose logs -f app`
