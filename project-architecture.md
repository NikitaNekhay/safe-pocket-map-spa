# Safe Pocket Map (SPM) — Project Architecture

## 1. Project Overview

Safe Pocket Map (SPM) is a public, open-source, commercial-ready startup landing SPA.

This SPA is NOT the actual map product.
It is a startup presentation website that:

- Explains the future product
- Shows roadmap (backlog)
- Displays media mentions
- Shows documentation & use cases
- Provides jobs listing
- Sends vacancy applications to Google Sheets
- Supports i18n (EN, FR, ES, AR)
- Uses TailwindCSS
- Uses Node.js (Express) backend
- Deploys on Vercel
- Uses GitHub CI/CD
- Uses Google Analytics

No authentication.
No admin panel.
No registration.

---

## 2. High-Level Architecture

Frontend:
- React (Vite)
- React Router
- i18next
- TailwindCSS
- Headless UI / Radix UI (lightweight components)
- Redux for REST communication

Backend:
- Node.js
- Express
- Google APIs (Sheets API v4)
- REST API
- CORS enabled

Storage:
- Google Sheets (for vacancy form submissions)
- Static jobs data (hardcoded JSON initially)

Deployment:
- Frontend → Vercel
- Backend → Vercel serverless functions

CI/CD:
- GitHub repository
- Vercel auto-deploy from main branch

---

## 3. Language Strategy

Supported languages:
- English (en)
- French (fr)
- Spanish (es)
- Arabic (ar)

URL format:
- /en/...
- /fr/...
- /es/...
- /ar/...

Auto-detect language on first visit.
Allow manual language switcher.
Persist language in localStorage.

---

## 4. Routing Structure

Main routes:

/:lang/
    Home (startup landing)

/:lang/documents/privacy-policy
/:lang/documents/cookies
/:lang/backlog
/:lang/media
/:lang/documentation
/:lang/use-cases
/:lang/jobs

Jobs page includes apply form.

---

## 5. SEO Requirements

- Meta tags per page
- Language alternate tags
- Sitemap generation (static)
- Robots.txt

---

## 6. Analytics

Integrate Google Analytics 4.
Use environment variable for GA_ID.

---

## 7. Styling

- TailwindCSS
- Clean startup minimal style
- Dark/Light optional (not mandatory for MVP)
- Responsive mobile-first layout
