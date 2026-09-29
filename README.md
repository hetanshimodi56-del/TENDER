# AI E-Tender Platform

### Personalized Tender Discovery, Explainable AI Recommendation, Eligibility Checker & Controlled Official Tender Publishing Platform
**Academic Level**: B.Sc. IT (Hons), Semester 7 Final Project  
**System Architecture**: Full-Stack (React 18 + Node.js Express REST API + Relational JSON Database + Grounded AI Engine)

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Company / Bidder**: Discover tenders, multi-factor explainable AI match score, one-click eligibility checker, side-by-side comparison, grounded tender Q&A, saved tenders, custom notes, deadline calendar.
   - **Authorized Tender Authority**: Multi-step Create Tender Wizard (Draft &rarr; Submit &rarr; Published &rarr; Closed), document upload, organization scope enforcement.
   - **Super Admin / Platform Owner**: Full platform governance, authority approvals, bulk CSV/Excel tender ingestion with duplicate detection, real-time analytics KPIs, immutable audit ledger.
   - **Technical Evaluator**: Assigned bid review, technical scoring (0–100), compliance criteria evaluation, evaluator remarks.

2. **Core AI & Decision Support**:
   - **Multi-Factor Explainable Match Scoring**: Evaluates Domain Fit (25%), Financial Turnover Capacity (20%), Operational Experience (20%), Geographical Alignment (15%), Accreditations/Certifications (15%), and Core Capabilities (5%).
   - **One-Click Eligibility Checker**: Evaluates mandatory turnover, track record, active accreditations (ISO, CMMI, MSME), and tax registrations with actionable remedies for missing criteria.
   - **Grounded "Ask Your Tender AI" Q&A**: Answers queries regarding EMD, deadlines, turnover, and penalties with direct RFP section citations and strict refusal to hallucinate facts.
   - **Side-by-Side Tender Comparison**: Compares 2 to 5 opportunities side-by-side with CSV matrix export.
   - **Smart Calendar & Urgency Monitor**: 72-hour critical locks, 7-day upcoming warnings, and active procurement horizons.

---

## 🚀 Quick Start Guide

### 1. One-Click Direct Open (Windows - Recommended)
Simply double-click **`run.bat`** in the project root, or execute from your terminal:
```bash
./run.bat
```
This automatically:
- Checks system prerequisites (Node.js & npm)
- Installs any missing dependencies in `server` and `client`
- Compiles the frontend production bundle (if needed)
- Verifies and initializes seed data
- Launches the unified server on **http://localhost:5000**
- **Directly opens the application in your default web browser**

---

### 2. Manual Launch
From the project root directory, run:
```bash
# In the server directory:
cd server
npm start
```
The unified platform will start and be accessible at:
👉 **http://localhost:5000**

*(The server serves both the REST API on `/api` and the modern React production application).*

### 2. Development Mode (Optional)
If you want hot-reloading for frontend modifications:
```bash
# Terminal 1 (Backend):
cd server
npm start

# Terminal 2 (Frontend):
cd client
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## ⚡ Quick Demo Personas (For Viva Demonstration)
On the first screen (or via the persona switcher in the top navbar), you can instantly switch between all four roles with 1 click:

| Role | Demo User | Email | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Company / Bidder** | Aarav Mehta (TechInfra) | `aarav@techinfra.com` | Search, Eligibility, AI Match, Compare, AI Q&A |
| **Tender Authority** | Dr. Rajeshwari Patel (GUDM) | `authority@gudm.gov.in` | Create Tender Wizard, Publish Official Bids |
| **Super Admin** | Vikramaditya Sharma | `admin@etender.gov.in` | Bulk CSV Import, Approve Authorities, Audit Logs |
| **Evaluator** | Prof. S. N. Bannerjee | `evaluator@etender.gov.in` | Technical Scoring, Compliance Review |

*(All demo accounts use password: `Password@123`)*

---

## 📂 Project Structure
```
final project/
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── db.js          # Relational JSON storage engine (ACID atomic write)
│   │   │   └── seed.js        # Realistic seed dataset (8 government/PSU tenders)
│   │   ├── services/
│   │   │   └── aiEngine.js    # Explainable match scorer, eligibility & grounded Q&A
│   │   ├── controllers/       # Modular controllers (Auth, Tender, Admin, AI, Eval)
│   │   ├── middleware/        # JWT authentication, RBAC, and audit log tracking
│   │   ├── routes/api.js      # Central REST API routes
│   │   └── server.js          # Express app entrypoint & static client server
│   └── test_api.js            # Automated API verification test suite
│
├── client/
│   ├── src/
│   │   ├── components/        # Navbar, TenderCard, Modals (Details, Eligibility, AI, Compare)
│   │   ├── views/             # TenderDiscovery, MyTenders, Calendar, Profile, Authority, Admin, Evaluator
│   │   ├── services/api.js    # Client-side API connector
│   │   ├── index.css          # Modern glassmorphism & typography design tokens
│   │   └── App.jsx            # Main app shell and state coordinator
│   └── dist/                  # Optimized production bundle
```
