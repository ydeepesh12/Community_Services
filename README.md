# 💊 MedRemind — Medicine Reminder & Medication Tracking System

> **A modern, accessible, full-stack healthcare web application designed specifically for elderly individuals and their family caregivers.**

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-purple.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-emerald.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%203.4-sky.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)]()

---

## 🌟 Overview

**MedRemind** solves the critical daily challenge faced by seniors who may forget to take their medications on time, accidentally duplicate doses, or struggle with complex prescription schedules.

Built from the ground up with **elderly-first UX principles**, MedRemind combines large typography, high-contrast visual cues, pleasant audio chime alerts via the Web Audio API, voice readout via the Web Speech API, and a caregiver support system that allows family members (sons, daughters, nurses) to link accounts and manage schedules.

---

## ✨ Key Features

### 👴 Elderly-Friendly UI/UX
- **Accessible Typography**: Instant one-click font size toggling (**Normal: 16px**, **Large: 18px**, **Extra Large: 20px**).
- **High-Contrast Mode**: Enhanced visual borders, distinct pill color badges, and high-legibility contrasts.
- **Audio Chime Synthesizer**: Web Audio API melodic alert chime (C5 → E5 → G5) without external sound file dependencies.
- **Voice Readout (SpeechSynthesis)**: Reads medicine names, dosages, and instructions aloud at an accessible pace for visually impaired seniors.
- **Emergency Contact Quick Dial**: Pinned one-tap call button (`tel:...`) directly on the sidebar for immediate family or doctor assistance.

### ⏰ Intelligent Reminder System
- **Real-Time Polling & In-App Alert Modal**: Pops up immediately when a scheduled dose is due with large, one-tap "Mark as Taken" and "Snooze" buttons.
- **Desktop Browser Notifications**: HTML5 Notifications API integration with permission handling and guidance.
- **Snooze Engine**: Configurable snooze durations (5m, 10m, 15m, 30m).
- **Transparent Browser Limits**: Clear explanations regarding browser background lifecycle limitations.

### 📅 Medication Scheduling & Tracking
- **Categorized Time Slots**: Doses automatically categorized into **Morning** (05:00–11:59), **Afternoon** (12:00–16:59), **Evening** (17:00–20:59), and **Night** (21:00–04:59).
- **Interactive Calendar Navigation**: View schedules for Today, Yesterday, Tomorrow, or any calendar date.
- **Status Lifecycle**: Track doses as `Pending`, `Taken`, `Missed`, or `Skipped`.
- **Dose Notes**: Add intake observations (e.g., *"Took with warm milk"*).
- **Strict Duplicate Prevention**: MongoDB compound unique index `(user, medicine, scheduledDate, scheduledTime)` prevents duplicate records.

### 💊 Medicine Management
- Full CRUD operations (Add, Edit, Delete, View details).
- Track Dosage, Units (mg, ml, Tablet, Capsule, Drops, Puffs), Form, Instructions, and Prescribing Doctor.
- Visual Pill Color Tags (`blue`, `emerald`, `amber`, `rose`, `purple`, `teal`, `yellow`).
- **Inventory & Refill Alerts**: Low-stock indicator triggered when inventory drops below alert thresholds.
- **Pause & Resume**: Pause medications temporarily with reason logging.

### 📊 Adherence Analytics
- **Live Daily Adherence %**: Dynamically excludes future scheduled doses from missed-dose ratios.
- **7-Day & 30-Day Longitudinal Trends**: Custom responsive SVG bar charts.
- **Outcome Distribution**: Visual Breakdown of Taken vs. Missed vs. Skipped doses.
- **Medicine-Wise Breakdown**: Compliance percentages for each individual medication.
- **Adherence Streak Counter**: Consecutive days achieving ≥ 80% adherence.

### 👨‍👩‍👧 Family & Caregiver Support
- **Role-Based Access Control**: Discrete `patient` and `caregiver` roles.
- **Invite Code Linking System**: Seniors generate short, secure codes (e.g., `CARE-77192`) to link family accounts.
- **Granular Permissions**: Configurable access to view schedules, log doses, or edit prescriptions.
- **Caregiver Patient Switcher**: Caregivers can switch between patients and manage multiple elderly relatives.

### 📜 Dose History & Doctor Reports
- Historical logs with flexible date presets (7 days, 14 days, 30 days, 90 days, or custom).
- Filter by status and medicine.
- **Print / Doctor Visit Export**: Formatted printable summary for doctor consultations.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 7, Tailwind CSS, Lucide React, Axios, date-fns |
| **Backend** | Node.js, Express.js, JSON Web Tokens (JWT), bcryptjs, Morgan, Cors, Dotenv |
| **Database** | MongoDB, Mongoose 8 (Indexes, Schemas, Compound Unique Constraints) |
| **Accessibility** | Web Audio API (Synthesized Chimes), Web Speech API (Voice Synthesis) |
| **Dev Tools** | Concurrently, Nodemon |

---

## 📂 Project Architecture

```
medicine-reminder-system/
├── client/                              # Vite + React Frontend
│   ├── public/                          # Static assets and favicon
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, ProtectedRoute, ReminderModal
│   │   ├── context/                     # AuthContext, AccessibilityContext, ReminderContext
│   │   ├── layouts/                     # DashboardLayout
│   │   ├── pages/                       # Dashboard, Medicines, Schedule, History, Analytics, Caregivers, Settings, Login, Register
│   │   ├── services/                    # Axios api instance with JWT interceptors
│   │   ├── utils/                       # Web Audio synthesizer, Speech synthesis
│   │   ├── App.jsx                      # Route definitions
│   │   ├── index.css                    # Tailwind & accessibility font-scaling styles
│   │   └── main.jsx                     # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                              # Node.js + Express Backend
│   ├── config/                          # MongoDB connection setup
│   ├── controllers/                     # Auth, Medicine, Schedule, Log, Analytics, Caregiver, Settings
│   ├── middleware/                      # JWT auth verification, caregiver delegation, centralized error handler
│   ├── models/                          # User, Medicine, DoseLog, CaregiverRelationship, NotificationSettings
│   ├── routes/                          # Express REST API routes
│   ├── utils/                           # Dose generator scheduler, test suite, seed script
│   ├── server.js                        # Express server entry point
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── README.md                            # Comprehensive documentation
├── .gitignore                           # Git ignore rules
└── package.json                         # Root orchestration scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a **MongoDB Atlas** connection string.

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "Community Service"
   ```

2. **Install all dependencies (Root, Server, Client):**
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables:**
   The backend environment file is located at `server/.env`. A default template is provided in `server/.env.example`:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/medicine_reminder_db
   JWT_SECRET=super_secret_jwt_key_medicine_reminder_2026_elderly_care
   JWT_EXPIRE=30d
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   ```
   *(For MongoDB Atlas, replace `MONGODB_URI` with your connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/medicine_reminder_db?retryWrites=true&w=majority`)*

---

### Seeding Realistic Sample Data

To populate realistic elderly medications, historical logs, today's doses, and pre-linked caregiver accounts, run:

```bash
npm run seed
```

#### Seeded Test Credentials:

| Role | Email | Password | Details |
|---|---|---|---|
| **Elderly Patient** | `patient@example.com` | `password123` | Eleanor Vance (Age 74), 5 daily prescriptions |
| **Family Caregiver** | `caregiver@example.com` | `password123` | Mark Vance (Son), pre-linked to Eleanor |

*(Quick demo buttons are also provided directly on the Login page for one-click filling!)*

---

### Running the Application

To run both the **Backend API** and the **Vite React Frontend** concurrently in development mode:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5001](http://localhost:5001)
- **API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🧪 Automated Testing

A complete automated API test suite is included in `server/utils/testSuite.js`. It runs 14 automated verification steps including authentication, CRUD operations, scheduling, adherence analytics, caregiver invitations, and settings updates:

```bash
cd server && node utils/testSuite.js
```

---

## 📡 API Endpoints Overview

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (patient or caregiver) | Public |
| `POST` | `/api/auth/login` | Log in and receive JWT token | Public |
| `GET` | `/api/auth/me` | Fetch currently logged in user profile | Private |
| `PUT` | `/api/auth/profile` | Update profile and emergency contacts | Private |
| `PUT` | `/api/auth/change-password` | Update account password | Private |
| `POST` | `/api/auth/forgot-password` | Forgot/Reset password verification | Public |
| `POST` | `/api/auth/logout` | Discard session | Private |

### Medicines (`/api/medicines`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/medicines` | Get all active and paused medicines | Private |
| `POST` | `/api/medicines` | Add new prescribed medicine | Private |
| `GET` | `/api/medicines/:id` | Get single medicine details | Private |
| `PUT` | `/api/medicines/:id` | Update medicine information | Private |
| `DELETE` | `/api/medicines/:id` | Remove medicine and pending future doses | Private |
| `PATCH` | `/api/medicines/:id/pause` | Pause or resume medication | Private |

### Schedules & Doses (`/api/schedules`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/schedules/today` | Get today's categorized schedule (Morning, Afternoon, Evening, Night) | Private |
| `GET` | `/api/schedules?date=YYYY-MM-DD` | Get schedule for any specific date | Private |
| `GET` | `/api/schedules/upcoming` | Get upcoming pending doses for real-time alerts | Private |
| `PUT` | `/api/schedules/:id/status` | Mark dose as Taken, Missed, Skipped, or Pending | Private |
| `POST` | `/api/schedules/:id/snooze` | Snooze reminder by specified minutes | Private |

### Logs & History (`/api/logs`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/logs` | Query filtered history logs (search, status, date) | Private |
| `GET` | `/api/logs/history` | Get date-grouped history summary | Private |
| `POST` | `/api/logs` | Log an unscheduled or as-needed (PRN) dose | Private |
| `PUT` | `/api/logs/:id` | Update dose log or add intake notes | Private |
| `DELETE` | `/api/logs/:id` | Delete an ad-hoc log record | Private |

### Analytics (`/api/analytics`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | KPI stats, streak, weekly trend, low stock | Private |
| `GET` | `/api/analytics/weekly` | 7-day adherence breakdown | Private |
| `GET` | `/api/analytics/monthly` | 30-day adherence trend and totals | Private |

### Caregivers (`/api/caregivers`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/caregivers` | Fetch linked caregivers or patients | Private |
| `POST` | `/api/caregivers/invite` | Generate caregiver invite code with permissions | Private |
| `POST` | `/api/caregivers/link` | Link caregiver account via invite code | Private |
| `PUT` | `/api/caregivers/:id` | Update caregiver permissions | Private |
| `DELETE` | `/api/caregivers/:id` | Remove caregiver connection | Private |

### Settings (`/api/settings`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/settings` | Get user settings and notification configuration | Private |
| `PUT` | `/api/settings/notifications` | Update sound, snooze, and quiet hours | Private |
| `PUT` | `/api/settings/preferences` | Update font size, contrast, and voice assistance | Private |

---

## 🔒 Security Practices

- **Zero Plain-Text Passwords**: Passwords hashed using `bcryptjs` with salt work factor of 10.
- **JWT Protection**: Secured REST endpoints verified with token expiration.
- **Resource Ownership Validation**: Mongoose queries scoped strictly to `req.effectiveUserId`.
- **Caregiver Verification**: Accessing on behalf of a patient requires verified relationship with accepted status.
- **Sanitized Responses**: User password hashes are stripped (`select: false`) from all responses.
- **XSS & CORS Protection**: CORS configured with whitelist and secure JSON headers.

---

## 📄 License

This project is licensed under the MIT License.
