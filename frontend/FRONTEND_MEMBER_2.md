# Arogya Lens — Frontend Member 2 Documentation & Handoff

**Author / Scope:** Frontend Member 2 (Post-Screening & User Data Domain)  
**Role:** Profile, Screening History, Screening Details, Hb Trend Visualization, Dashboard, and Data Services  
**Technology Stack:** React 18, TypeScript 5.6, Vite 6, Tailwind CSS 3.4, Lucide React  
**Integration Status:** Production-ready & Merge-friendly with Frontend Member 1 and FastAPI backend

---

## 1. Features Implemented

1. **User Profile (`/profile`)**:
   - Comprehensive user demographic & medical screening record profile.
   - Displays: Name, Mobile Number, Age, Sex, Member since, Total screenings, Latest estimated Hb (g/dL), and Last screening date.
   - Interactive **Edit Profile** modal with full validation for updating personal information (Name, Age, Sex, Mobile, Blood Group, Email).
   - Clinical privacy and HIPAA / ABDM security standard notices.

2. **Screening History (`/history`)**:
   - Complete responsive list of previous optical screenings.
   - Each card displays: Date, Time, Estimated Hb (g/dL), Optical Confidence percentage & tier (`HIGH`, `MEDIUM`, `LOW`), Status badge, and self-reported symptom chips.
   - Status filters (`All`, `Possible Anaemia`, `Normal Hb Range`).
   - Clickable cards linking directly to individual assessment detail pages.
   - Purely non-destructive design (no accidental deletion of clinical records).

3. **Individual Screening Details (`/history/:screeningId`)**:
   - Reusable, detailed assessment summary component.
   - Accepts full screening metadata (`screening_id`, `date`, `time`, `estimated_hb`, `confidence`, `status`, `image_quality`, `symptoms`, `notes`).
   - Clearly labels metric as **"Estimated Hb"** with standard adult reference range benchmark (12.0 – 16.0 g/dL).
   - Prominent, unmissable medical disclaimer:  
     > **"Screening estimate — not a laboratory diagnosis."**
   - Optical image quality breakdown (Good / Fair / Poor) and self-reported symptoms context.
   - Clinical next steps & dietary guidance card.

4. **Hb Trend / Progress Visualization (`/trends` and chart component)**:
   - Bespoke, responsive, zero-dependency SVG interactive chart.
   - **X-axis**: Screening dates (chronological progression).
   - **Y-axis**: Estimated Hb in g/dL with standard adult normal reference range band (12.0 – 16.0 g/dL).
   - Interactive data point selection with real-time callout banner showing date, Hb, status, and confidence.
   - Fully optimized for mobile viewports (360px, 390px, 430px) and wide desktop screens.

5. **Health Screening Dashboard (`/dashboard`)**:
   - 4 High-impact summary cards:
     1. **Total Screenings**
     2. **Latest Estimated Hb (g/dL)**
     3. **Latest Optical Confidence (%)**
     4. **Last Screening Date**
   - Embedded Hb Trend progression chart.
   - Recent screenings preview (top 3) with `[ View All History ]` navigation.
   - Quick "Start Scan" primary action trigger.

6. **Unified Navigation & Layout**:
   - Responsive `AppLayout` component supporting desktop header navigation tabs and a mobile bottom navigation bar (`Dashboard`, `History`, `Scan`, `Trends`, `Profile`).

---

## 2. Files & Components Created

```text
src/
├── types/
│   └── health.ts                               # Centralized Profile, Screening, Dashboard types & helpers
│
├── services/
│   ├── mocks/
│   │   ├── mockProfileService.ts               # In-memory / session profile storage & updater
│   │   ├── mockHistoryService.ts               # Multi-date historical screening records
│   │   └── mockDashboardService.ts             # Aggregated stats & trend generator
│   └── api/
│       ├── profileService.ts                   # Production API bridge for /api/profile
│       ├── historyService.ts                   # Production API bridge for /api/history
│       └── dashboardService.ts                 # Production API bridge for /api/dashboard
│
├── components/
│   ├── navigation/
│   │   ├── BottomNav.tsx                       # Mobile bottom navigation bar
│   │   └── AppLayout.tsx                       # Responsive wrapper with top & bottom navigation
│   ├── charts/
│   │   └── HbTrendChart.tsx                    # Pure SVG interactive Hb trend chart
│   ├── dashboard/
│   │   ├── SummaryCards.tsx                    # 4 Metric cards grid
│   │   └── RecentScreenings.tsx                # Recent 3 screenings list with "View All"
│   ├── history/
│   │   └── HistoryCard.tsx                     # Reusable individual screening history card
│   ├── screeningDetails/
│   │   └── ScreeningDetailsView.tsx            # Comprehensive single-screening detail view
│   └── profile/
│       ├── ProfileCard.tsx                     # Profile details & statistics presentation
│       └── EditProfileModal.tsx                # Modal for updating demographic data
│
└── pages/
    ├── dashboard/
    │   └── DashboardPage.tsx                   # /dashboard page
    ├── history/
    │   ├── HistoryPage.tsx                     # /history list page
    │   └── ScreeningDetailPage.tsx             # /history/:screeningId page
    ├── profile/
    │   └── ProfilePage.tsx                     # /profile page
    └── trends/
        └── TrendsPage.tsx                      # /trends in-depth analytics page
```

---

## 3. Routes Created

| Route | Description | Scope |
| :--- | :--- | :--- |
| `/dashboard` | Main health screening dashboard summary | Frontend Member 2 |
| `/history` | Complete filterable screening history | Frontend Member 2 |
| `/history/:screeningId` | Detailed clinical report for specific screening | Frontend Member 2 |
| `/profile` | User profile & editable demographic settings | Frontend Member 2 |
| `/trends` | In-depth longitudinal Hb trend analytics | Frontend Member 2 |

---

## 4. API Endpoints Expected from FastAPI Backend

When integrating with the live FastAPI backend, set `VITE_USE_MOCK=false` in `.env`. The UI seamlessly interacts with the following endpoints:

### User Profile Endpoints
- `GET /api/profile`
  - **Returns**: `ProfileData` object
- `PUT /api/profile`
  - **Body**: `ProfileUpdateRequest` (`{ name, age, sex, mobile, email, bloodGroup }`)
  - **Returns**: Updated `ProfileData` object

### Screening History Endpoints
- `GET /api/history`
  - **Returns**: `Array<ScreeningRecord>`
- `GET /api/history/{screening_id}`
  - **Returns**: `ScreeningRecord`

### Dashboard Endpoints
- `GET /api/dashboard`
  - **Returns**: `DashboardSummary` (`{ total_screenings, latest_hb, latest_confidence, last_screening, trend, recent_screenings }`)
- `GET /api/dashboard/trend`
  - **Returns**: `Array<TrendPoint>` (`[{ date, displayDate, estimated_hb, confidence, status, screening_id }]`)

---

## 5. Confidence Tiering & Clinical UX Rules

- **High Confidence**: \(\ge 80\%\) (e.g. \(86\%\)) $\rightarrow$ Emerald status, clear estimate.
- **Medium Confidence**: \(60\% - 79\%\) (e.g. \(68\%\)) $\rightarrow$ Amber warning, advises potential lighting check.
- **Low Confidence**: \(< 60\%\) (e.g. \(48\%\)) $\rightarrow$ Prompt for retake due to optical occlusion/lighting.
- **Language Standards**: Always state **"Estimated Hb"** and display **"Screening estimate — not a laboratory diagnosis."**

---

## 6. How to Run

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production (TypeScript + Vite)
npm run build
```

---

## 7. Merge Guide for Final Frontend Integration

The following files are owned by **Frontend Member 2** and must be preserved during merge:
- `src/types/health.ts`
- `src/services/api/profileService.ts`, `src/services/api/historyService.ts`, `src/services/api/dashboardService.ts`
- `src/services/mocks/mockProfileService.ts`, `src/services/mocks/mockHistoryService.ts`, `src/services/mocks/mockDashboardService.ts`
- `src/components/navigation/*`
- `src/components/charts/*`
- `src/components/dashboard/*`
- `src/components/history/*`
- `src/components/screeningDetails/*`
- `src/components/profile/*`
- `src/pages/dashboard/*`, `src/pages/history/*`, `src/pages/profile/*`, `src/pages/trends/*`
- `src/routes/AppRoutes.tsx` (Contains both Frontend 1 and Frontend 2 routes)
