# Frontend Structure — SPM

## 1. Tech Stack

- React 18+
- Vite
- React Router DOM
- i18next + react-i18next
- TailwindCSS
- Axios
- Headless UI or Radix UI
- React Helmet (for SEO)

---

## 2. Folder Structure

/src
    /components
        Navbar.tsx
        Footer.tsx
        LanguageSwitcher.tsx
        PageContainer.tsx
        Section.tsx

    /pages
        Home.tsx
        PrivacyPolicy.tsx
        Cookies.tsx
        Backlog.tsx
        Media.tsx
        Documentation.tsx
        UseCases.tsx
        Jobs.tsx

    /i18n
        index.ts
        /locales
            en.json
            fr.json
            es.json
            ar.json

    /data
        jobs.ts (static jobs data)

    /services
        api.ts (axios config)

    main.tsx
    App.tsx
    router.tsx

---

## 3. Core Page Responsibilities

### Home
- Hero section
- Startup description
- Mission
- Problem in Africa
- Future map solution explanation
- CTA to Jobs
- CTA to Documentation

### Privacy Policy
Static legal text.

### Cookies
Static cookies text.

### Backlog
Public roadmap:
- Phase 1: Research
- Phase 2: Map prototype
- Phase 3: Data validation
- Phase 4: AI enhancement

Use simple list or Kanban-style UI.

### Media
Manual posts:
- Title
- Date
- Link
Future: RSS placeholder

### Documentation
User guide describing:
- How SPM will work
- Incident categories
- Heatmap concept
- Safety scoring explanation

### Use Cases
- Local citizen navigation
- NGO data planning
- Travel safety
- Government collaboration

### Jobs
- List of open roles (static)
- Apply form

Apply form fields:
- Full name
- Email
- Country
- Position
- LinkedIn
- CV link
- Message

On submit:
POST to backend endpoint.

---

## 4. i18n Configuration

- Use i18next
- JSON translation files
- Namespace: common
- All UI text must use translation keys
- No hardcoded text

Arabic:
- Set dir="rtl" when ar active
- Tailwind must support RTL

---

## 5. Language Detection

- Check URL param
- If none → detect browser language
- Fallback → en

---

## 6. API Service

Create axios instance:
- Base URL from VITE_API_URL
- JSON headers
- Timeout 10s

---

## 7. Google Analytics

Initialize in main.tsx.
Load only in production.
Use VITE_GA_ID.
