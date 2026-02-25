# Backend Structure — SPM

## 1. Tech Stack

- Node.js 18+
- Express
- googleapis
- cors
- dotenv
- body-parser

---

## 2. Folder Structure

/backend
    index.js
    /routes
        jobs.js
    /controllers
        jobsController.js
    /services
        googleSheetsService.js
    /config
        google.js
    .env

---

## 3. Environment Variables

GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
PORT=
CORS_ORIGIN=

---

## 4. API Endpoints

POST /api/jobs/apply

Body:
{
    fullName,
    email,
    country,
    position,
    linkedin,
    cvLink,
    message
}

Returns:
{
    success: true
}

---

## 5. Google Sheets Integration

- Use service account
- Share sheet with service account email
- Append rows
- Use Sheets API v4

Columns:
Timestamp
Full Name
Email
Country
Position
LinkedIn
CV Link
Message

---

## 6. Validation

- Validate required fields
- Email format check
- Reject empty fields
- Sanitize inputs

---

## 7. CORS

Allow frontend origin from env variable.

---

## 8. Error Handling

- Centralized error middleware
- 400 validation errors
- 500 internal errors

---

## 9. Deployment on Vercel

Convert Express to serverless:
- Use Vercel configuration
- Export handler

Keep structure modular for future growth.
