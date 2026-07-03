# MediCart

MediCart is a full-stack e-commerce and medical supply management application. The project is split into a standalone Next.js frontend and a separate Next.js API backend to allow for independent deployments (e.g., Vercel for the frontend and Render for the backend).

## Project Structure

- **/frontend**: A Next.js application containing all UI components, pages, and React contexts. It is configured to proxy API requests to the backend during local development.
- **/backend**: A Next.js server configured strictly as an API backend. It handles all database connections (via PostgreSQL and Drizzle ORM) and serves API routes.

## Prerequisites

- Node.js (v18+)
- PostgreSQL installed locally or a cloud database connection string (e.g., Neon or Supabase).

## Getting Started

### 1. Environment Variables

Create a .env file in the **backend** directory:
\\\env
# backend/.env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres"
JWT_SECRET="medicart-secret-key-2024"
\\\

*(Note: The frontend does not strictly require a .env file for local development because 
ext.config.ts automatically proxies /api requests to localhost:3001).*

### 2. Install Dependencies

You need to install dependencies in both folders:
\\\ash
cd backend && npm install
cd ../frontend && npm install
\\\

### 3. Database Setup

Ensure your PostgreSQL database is running, then generate the tables using Drizzle ORM:
\\\ash
cd backend
npx drizzle-kit push
\\\

### 4. Running Locally

You will need two separate terminals to run both servers simultaneously.

**Terminal 1 (Backend):**
\\\ash
cd backend
npm run dev
\\\
*The backend will run on http://localhost:3001*

**Terminal 2 (Frontend):**
\\\ash
cd frontend
npm run dev
\\\
*The frontend will run on http://localhost:3000*

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application!

## Deployment

- **Frontend**: Deploy the rontend folder directly to Vercel. Be sure to add NEXT_PUBLIC_API_URL to your Vercel environment variables pointing to your live backend.
- **Backend**: Deploy the ackend folder to a Node.js hosting provider (like Render, Railway, or Heroku). Set your DATABASE_URL and JWT_SECRET in their environment variable settings.
