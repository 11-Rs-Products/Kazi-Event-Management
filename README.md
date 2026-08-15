# Kaziranga House - Inter-House Event Portal 🦏

A production-quality, secure, modern, mobile-first web application built for **Kaziranga House** students to discover, register for, and track inter-house events. Administrators can create and manage events and registrations, while Super Admins can manage allowed-user spreadsheets, user permissions, and security audit logs.

---

## 🌟 Key Features

- **Kaziranga House Branding & UI**: Primary Kaziranga emerald (`#013D34`) styling, responsive dark/light modes, micro-interactions, responsive bottom and sidebar navigation.
- **Google Authentication & Name Normalization**: Firebase Google Sign-In automatically strips student IDs (e.g. `24F2002110 Amrutanshu Sahoo` -> `Amrutanshu Sahoo`).
- **Allowed-Users Security Boundary**: Unallowed email accounts are redirected to an Access Denied screen.
- **Smart Registration System**: Auto-prefills student details, prompts for phone number if missing, auto-saves phone to profile, and records participant snapshots into registrations.
- **Admin Dashboard**: Event CRUD, publish/unpublish toggles, registration filtering, participant detail views, and CSV export with formula injection protection.
- **Super Admin Suite**:
  - **Allowed User Spreadsheet Synchronization**: Upload CSV/XLSX files, parse, validate formatting, filter duplicates, preview changes, and replace the active allowed list atomically (preserving student profiles and historical registration data).
  - **Role Management**: Promote/demote users (`USER`, `ADMIN`, `SUPER_ADMIN`).
  - **Security Audit Trail**: Immutable logs for privileged administrative actions.
- **In-App Notification Engine**: Real-time notification updates, unread badge counter, and history page.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript (`strict: true`), Tailwind CSS, Lucide React, Framer Motion
- **Backend & Database**: Firebase Authentication (Google Sign-In), Cloud Firestore, Firebase Admin SDK
- **Data Parsing & Utilities**: PapaParse, XLSX, Zod validation
- **Security**: Firestore Security Rules (`firestore.rules`), server-side role verification, CSV formula sanitization

---

## 🚀 Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd "Kazi Event Management"
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set up your Firebase credentials in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK Configuration for server API routes
# Use either FIREBASE_SERVICE_ACCOUNT_KEY as raw JSON/base64 JSON, or the individual fields below.
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your_project_id",...}

# Demo Mode Toggle (Set to "true" for instant testing without Firebase setup)
NEXT_PUBLIC_USE_MOCK_FIREBASE=true
```

### 3. Local Development

Run the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Firebase & Security Deployment

### 1. Deploy Firestore Security Rules

Deploy the included `firestore.rules` using Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

### 2. Seed Initial Super Admin Accounts

Bootstrap the initial Super Admin accounts (`24f2002110@ds.study.iitm.ac.in` and `25f2002531@ds.study.iitm.ac.in`) into Cloud Firestore by calling the seed API route:

```bash
curl -X POST http://localhost:3000/api/seed
```

---

## 🧪 Testing

Run type checking:

```bash
npx tsc --noEmit
```

Build production bundle:

```bash
npm run build
```

---

## 📄 License

Developed for **Kaziranga House** - IIT Madras BS Degree Program.
