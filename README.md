# Insurance Policy Management API

A **production-grade** Node.js + Express + MongoDB REST API for managing insurance policies, built as part of a technical assessment.

---

## 📁 Project Structure

```
├── src/
│   ├── server.js               # Entry point – bootstrap, graceful shutdown
│   ├── app.js                  # Express app factory (middleware stack)
│   ├── config/
│   │   ├── database.js         # Mongoose connection with retry logic
│   │   ├── logger.js           # Winston logger (daily rotating files)
│   │   └── multer.js           # File upload config (XLSX/CSV only)
│   ├── models/
│   │   ├── agent.model.js      # Agent collection
│   │   ├── user.model.js       # User collection
│   │   ├── account.model.js    # User Account collection
│   │   ├── category.model.js   # LOB (Line of Business) collection
│   │   ├── carrier.model.js    # Policy Carrier collection
│   │   ├── policy.model.js     # Policy collection
│   │   └── scheduledMessage.model.js
│   ├── controllers/
│   │   ├── upload.controller.js
│   │   ├── policy.controller.js
│   │   ├── scheduledMessage.controller.js
│   │   └── system.controller.js
│   ├── services/
│   │   ├── upload.service.js       # Orchestrates Worker + bulk DB writes
│   │   ├── policy.service.js       # Search + aggregation logic
│   │   ├── scheduledMessage.service.js
│   │   ├── cpuMonitor.service.js   # Real-time CPU monitoring + auto-restart
│   │   └── cronScheduler.service.js # node-cron message delivery
│   ├── workers/
│   │   ├── fileParser.worker.js    # Worker Thread: parses XLSX/CSV
│   │   └── workerPool.js           # Promise wrapper for the worker
│   ├── routes/
│   │   ├── index.js
│   │   ├── upload.routes.js
│   │   ├── policy.routes.js
│   │   ├── scheduledMessage.routes.js
│   │   └── system.routes.js
│   ├── middleware/
│   │   ├── errorHandler.middleware.js
│   │   └── validate.middleware.js
│   └── utils/
│       ├── AppError.js        # Custom operational error
│       └── apiResponse.js     # Standardised JSON responses
├── tests/
│   ├── upload.test.js
│   ├── policy.test.js
│   └── scheduledMessage.test.js
├── scripts/
│   └── generateSampleData.js  # Generates sample XLSX for upload testing
├── .env.example
├── .gitignore
└── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (or provide a URI in `.env`)

```bash
# 1. Clone and install
git clone <your-repo-url>
cd insurance-policy-management-api
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MONGO_URI

# 3. Generate sample data (optional)
node scripts/generateSampleData.js

# 4. Start development server
npm run dev
```

---

## 🔌 API Reference

### Base URL: `http://localhost:3000/api/v1`

---

### Task 1 – Data Management

#### 1. Upload XLSX/CSV → MongoDB (Worker Threads)
```
POST /upload
Content-Type: multipart/form-data
Field: file (xlsx | xls | csv)
```
**Response:**
```json
{
  "success": true,
  "message": "File uploaded and data inserted successfully.",
  "data": {
    "totalRowsParsed": 5,
    "agents": 3,
    "users": 4,
    "accounts": 4,
    "categories": 3,
    "carriers": 3,
    "policies": 5
  }
}
```

#### 2. Search Policy by Username
```
GET /policies/search?username=John&page=1&limit=10
```

#### 3. Aggregated Policies Per User
```
GET /policies/aggregated
```

---

### Task 2 – System Services

#### 4. Real-time CPU Stats
```
GET /system/cpu
```
> The server **automatically restarts** when CPU usage ≥ `CPU_THRESHOLD` (default 70%). Use PM2 or systemd to manage the process.

#### 5. Schedule a Message
```
POST /messages/schedule
Content-Type: application/json

{
  "message": "Team standup reminder",
  "day": "monday",
  "time": "09:00"
}
```
> A cron job runs every minute. When `day` and `time` match wall-clock time (UTC), the message is marked as delivered.

#### 6. List Scheduled Messages
```
GET /messages/schedule?isDelivered=false&page=1&limit=20
```

#### 7. Health Check
```
GET /health
```

---

## 📊 MongoDB Collections

| Collection | Key Fields |
|---|---|
| `agents` | `agentName` |
| `users` | `firstName`, `dob`, `address`, `phone`, `state`, `zipCode`, `email`, `gender`, `userType` |
| `accounts` | `accountName`, `userId` (→ User) |
| `categories` | `categoryName` |
| `carriers` | `companyName` |
| `policies` | `policyNumber`, `policyStartDate`, `policyEndDate`, `categoryId`, `companyId`, `userId` |

---

## 🛡️ Production Features

| Feature | Implementation |
|---|---|
| **Worker Threads** | XLSX/CSV parsing runs in `worker_threads`, never blocking the event loop |
| **Bulk upserts** | `Model.bulkWrite()` with `$setOnInsert` for idempotent data loading |
| **CPU Monitoring** | Delta-based measurement every 5s; graceful close + `process.exit(0)` on threshold breach |
| **Cron Scheduler** | `node-cron` at `* * * * *`; marks messages delivered atomically |
| **Security** | `helmet`, `cors`, `express-mongo-sanitize`, `express-rate-limit` |
| **Validation** | `express-validator` on all input fields |
| **Logging** | Winston with daily rotating files (14-day retention) |
| **Error Handling** | Global handler covers Mongoose validation, duplicates, CastErrors, Multer limits |
| **Graceful Shutdown** | `SIGTERM`/`SIGINT` → close server → stop cron + CPU monitor → exit |
| **Retry Logic** | MongoDB connection retries up to 5 times with exponential backoff |

---

## 🧪 Running Tests

```bash
npm test
npm run test:coverage
```

---

## 🚀 Production Deployment (PM2)

```bash
npm install -g pm2
pm2 start src/server.js --name insurance-api --watch
pm2 save
pm2 startup
```

When the CPU monitor triggers `process.exit(0)`, PM2 automatically restarts the process.

---

## 📋 Expected XLSX/CSV Columns

| Column | Required | Notes |
|---|---|---|
| `agent_name` | ✅ | |
| `first_name` | ✅ | |
| `dob` | ✅ | ISO date |
| `address` | ✅ | |
| `phone` | ✅ | |
| `state` | ✅ | |
| `zip_code` | ✅ | |
| `email` | ✅ | Unique key for users |
| `gender` | ⬜ | male/female/other/prefer_not_to_say |
| `user_type` | ⬜ | admin/standard/premium/guest |
| `account_name` | ✅ | |
| `category_name` | ✅ | LOB |
| `company_name` | ✅ | Carrier |
| `policy_number` | ✅ | Unique |
| `policy_start_date` | ✅ | ISO date |
| `policy_end_date` | ✅ | ISO date |
