# Hire Path — Frontend

React + Vite frontend for the Online Job Recruitment & Vacancy Management System.

## Setup

1. Delete your old `frontend/` folder entirely and unzip this one in its place — don't merge files into
   the old folder, since a previous zip may have a leftover stray directory in it.
2. Install Node.js 18+ if you don't have it.
3. `cd frontend`
4. Install dependencies:
   ```
   npm install
   ```
5. Copy the environment file:
   ```
   copy .env.example .env
   ```
   Confirm `VITE_API_BASE_URL` in `.env` matches wherever `php artisan serve` is running
   (default: `http://127.0.0.1:8000/api`).
6. Start the dev server:
   ```
   npm run dev
   ```
7. Open the printed local URL (usually http://localhost:5173).

## What's built so far

- Design system (`src/index.css`) — navy/amber palette, Space Grotesk + Inter, reusable `StatusPipeline` component
- Auth: register (job seeker), login, logout, session restore on refresh
- Public job browsing: `/jobs` (list + search), `/jobs/:id` (detail)
- Apply flow: `/jobs/:id/apply` (cover letter + resume upload)
- Job seeker dashboard: `/my-applications` (real status pipeline per application)

## Not built yet

- Employer/HR dashboard, manager requisition flow, admin panel, bookmarks, notifications
