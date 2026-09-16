# Celestial AI — Palmistry & Tarot Intelligence Platform

An advanced full-stack AI-powered spiritual intelligence platform combining computer vision palmistry line detection, interactive 78-card Rider-Waite tarot spreads, astrological planetary alignments, weighted multi-factor scoring engines, and multi-role dashboards (Seeker, Reader, Consultant, Admin).

---

## 🌟 Key Features & Milestone 1 Components

- **Palmistry Mesh Scanner & Line Detection**: Capture live camera input or upload palm photos. Detect 21 MediaPipe hand landmarks, map major palm lines (Life, Head, Heart, Fate, Sun), and analyze hand element types (Fire, Earth, Air, Water).
- **Interactive Tarot Studio**: Support for multiple spread types (1-Card Daily Insight, 3-Card Past/Present/Future, 5-Card Cross of Truth, 7-Card Horoscope Spread) with full 78-card Rider-Waite dataset, card reversals, and AI-driven card synergy interpretations.
- **Unified Synthesis Engine**: Combines Palmistry, Tarot, and Astrological birth chart data into a single comprehensive spiritual intelligence report featuring a weighted multi-factor scoring algorithm.
- **Multi-Role Role-Based Dashboards**:
  - **Spiritual Seeker**: Personalized readings history, trend graphs, daily guidance, and PDF report downloads.
  - **Tarot Reader**: Active client queue, card spread designer, client notes, and reading session logger.
  - **Spiritual Consultant**: Analytics overview, archetype distribution, client progress metrics, and appointment scheduler.
  - **Platform Administrator**: System logs, user management, API latency tracking, and dataset health.
- **Seamless Authentication & Social Login**: Direct sign-in via Google, Apple, or Email with account existence checking and automatic new user registration.
- **Astrological Profile Customization**: Birth date, birth time, location, zodiac sign, natal moon/rising sign input, and reading preferences.

---

## 🛠️ Tech Stack & Prerequisites

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React Icons, Motion (Framer Motion)
- **Backend**: Node.js, Express v4, `tsx` TypeScript runtime, `esbuild`
- **AI & Vision Engine**: `@google/genai` (Gemini 2.5 Flash), MediaPipe Hand Mesh geometry, FreiHAND landmark coordinate system
- **PDF Generation**: `jspdf` for exporting high-resolution downloadable spiritual reports

---

## 🚀 How to Run the Application

### 1. Clone & Install Dependencies
```bash
# Clone repository
git clone https://github.com/your-org/celestial-ai.git
cd celestial-ai

# Install node dependencies
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root or copy from `.env.example`:

```env
# Optional: Google Gemini API Key for server-side AI interpretations
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If `GEMINI_API_KEY` is omitted, the application seamlessly falls back to the embedded computer vision and heuristic rule engines.*

### 3. Terminal Commands

#### Development Mode (With Hot Reloading)
Runs the Express backend server with Vite middleware on `http://localhost:3000`:
```bash
npm run dev
```

#### Code Quality & Type Check
Runs TypeScript type validation across all components:
```bash
npm run lint
```

#### Production Build
Bundles the React frontend with Vite and compiles the Express backend server with `esbuild` into `dist/server.cjs`:
```bash
npm run build
```

#### Start Production Server
Executes the production server build:
```bash
npm run start
```

---

## 📁 Frontend / UI File Directory Structure & Milestone 1 Mapping


| :--- | :--- | :--- |
| **Header Navigation & Logo** | `/src/components/Navbar.tsx` | Top sticky navbar with tab switches, brand badge, notification counter, and user profile drawer button. |
| **Home Landing Page** | `/src/components/FrontPageLanding.tsx` | Hero section, feature highlight cards, quick start CTA buttons, and celestial theme presentation. |
| **Palmistry Computer Vision Scanner** | `/src/components/PalmScanner.tsx` | Webcam video feed capture, photo upload, 21-landmark MediaPipe overlay, Life/Head/Heart/Fate line mapping, and AI analysis. |
| **Interactive Tarot Studio** | `/src/components/TarotStudio.tsx` | 78-card Rider-Waite deck shuffler, 1/3/5/7 card spread selector, interactive card flip, upright/reversed state, and synergy reader. |
| **Unified Synthesis & Weighted Scoring** | `/src/components/UnifiedReadingView.tsx` | Unified intelligence view, weighted multi-factor calculation breakdown, personality archetype, life trend timeline, and PDF exporter. |
| **User Seeker Dashboard** | `/src/components/Dashboards/UserDashboard.tsx` | Seeker dashboard displaying past readings, score charts, daily spiritual quests, and downloadable reports. |
| **Tarot Reader Dashboard** | `/src/components/Dashboards/ReaderDashboard.tsx` | Reader workspace with live client queue, card spread designer, client notes, and reading session logger. |
| **Spiritual Consultant Dashboard** | `/src/components/Dashboards/ConsultantDashboard.tsx` | Consultant analytics, client archetype distribution, progress tracking, and appointment scheduler. |
| **Platform Administrator Dashboard** | `/src/components/Dashboards/AdminDashboard.tsx` | Admin panel with system status logs, user account control, API latency metrics, and database health. |
| **Authentication & SSO Portal** | `/src/components/AuthModal.tsx` | Sign-in modal featuring Google & Apple SSO buttons, email/password form, database account checking, and new registration prompt. |
| **User Profile & Astrological Modal** | `/src/components/UserProfileModal.tsx` | User profile editor for birth date/time/place, zodiac signs, spiritual goals, and deck preferences. |
| **Notification Drawer** | `/src/components/NotificationCenter.tsx` | Right slide-over notification drawer displaying daily horoscopes, tarot alerts, and system notifications. |
| **Main Orchestrator & State Container** | `/src/App.tsx` | Main application shell managing tab navigation, modal visibility, active user state, and session reports. |

---

## 🗄️ Backend & Database Directory Structure Mapping

| Domain / Layer | File Path | Description |
| :--- | :--- | :--- |
| **User Credentials Vault Database** | `/src/database/userCredentialsDatabase.ts` | Persistent credentials layer (`celestial_user_credentials_vault`) tracking User ID, password, and login timestamps with auto-sync on registration. |
| **User Credentials Seed & Model** | `/src/data/userCredentials.ts` | `UserCredentialRecord` interface and initial seed credential accounts for seekers, readers, consultants, and admins. |
| **User Database Storage** | `/src/database/userDatabase.ts` | Multi-store DB managing accounts (`celestial_user_accounts_db`) and email-isolated reports, scans, and tarot draws (`celestial_user_data_db`). |
| **Auto Storage Manager** | `/src/database/autoStorageManager.ts` | Automated real-time persistence manager, database snapshots, integrity audits, and full JSON export/import engine. |
| **Express Backend Server** | `/server.ts` | Express server hosting Gemini AI analysis, auth verification, static asset hosting, and `/api/auth/credentials` sync. |

---

## 📜 License
This project is licensed under the MIT License.
