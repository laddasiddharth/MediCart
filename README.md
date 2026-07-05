# MediCart

MediCart is a full-stack e-commerce and medical supply management application. The project is split into a standalone Next.js frontend and a separate Next.js API backend to allow for independent deployments (e.g., Vercel for the frontend and Render for the backend).

## Project Structure

- **/frontend**: A Next.js application containing all UI components, pages, and React contexts. It is configured to proxy API requests to the backend during local development.
- **/backend**: A Next.js server configured strictly as an API backend. It handles all database connections (via PostgreSQL and Drizzle ORM) and serves API routes.

## Features

**For Users:**
- **Wishlist & Subscriptions:** Save favorite medicines and subscribe for auto-refills.
- **Pill Tracker:** Manage and track daily medication schedules with reminders.
- **Family Profiles:** Keep track of family members' health records and allergies.
- **Prescription Uploads & Chat:** Upload prescriptions for review and chat directly with pharmacists.

**For Administrators:**
- **Purchase Orders:** Draft and manage supplier restock orders directly from the dashboard.
- **Invoice Generation:** Generate and print PDF invoices for customer orders.
- **Order & User Management:** Manage all e-commerce operations, order statuses, and verify prescriptions.

## Prerequisites

- Node.js (v18+)
- PostgreSQL installed locally or a cloud database connection string (e.g., Neon or Supabase).

## Getting Started

### 1. Environment Variables

Create a `.env` file in the **backend** directory:
```env
# backend/.env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres"
JWT_SECRET="medicart-secret-key-2024"
```

*(Note: The frontend does not strictly require a .env file for local development because `next.config.ts` automatically proxies `/api` requests to `localhost:3001`).*

### 2. Install Dependencies

You need to install dependencies in both folders:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Database Setup

Ensure your PostgreSQL database is running, then generate the tables using Drizzle ORM:
```bash
cd backend
npx drizzle-kit push
```

### 4. Running Locally

You will need two separate terminals to run both servers simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*The backend will run on http://localhost:3001*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*The frontend will run on http://localhost:3000*

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application!

## Deployment

- **Frontend**: Deploy the `frontend` folder directly to Vercel. Be sure to add `NEXT_PUBLIC_API_URL` to your Vercel environment variables pointing to your live backend.
- **Backend**: Deploy the `backend` folder to a Node.js hosting provider (like Render, Railway, or Heroku). Set your `DATABASE_URL` and `JWT_SECRET` in their environment variable settings.
