# Hire Path — Frontend

React + Vite frontend for the Online Job Recruitment & Vacancy Management System.

## Setup

1. Install Node.js 18+ if you don't have it.
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the environment file and point it at your local Laravel backend:
   ```
   copy .env.example .env
   ```
   (On Windows PowerShell, `copy` works; on Mac/Linux use `cp`.)
   Make sure `VITE_API_BASE_URL` matches where `php artisan serve` is running, e.g. `http://127.0.0.1:8000/api`.
4. Start the dev server:
   ```
   npm run dev
   ```
5. Open the printed local URL (usually http://localhost:5173).

## Backend CORS reminder

Your Laravel `config/cors.php` currently only allows `http://localhost:5173` — that already matches Vite's default port, so no change needed unless you run the frontend on a different port.

## What's built so far

- Design system (`src/index.css`) — navy/amber palette, Space Grotesk + Inter type, and a reusable `StatusPipeline` component for stage tracking (used later for requisition and application statuses).
- Auth: register (job seeker), login, logout, session restore on refresh — talks to `/register`, `/login`, `/logout`, `/me`.
- Public job browsing: `/jobs` (list + search) and `/jobs/:id` (detail).
- Role-aware navbar and an `Apply` button that redirects to login if logged out, or blocks non-job-seekers.

## Not built yet

- The actual apply flow (`/jobs/:id/apply`) — button currently navigates to a route with no page yet.
- Job seeker dashboard / my-applications page.
- Employer, manager, and admin dashboards.
- Bookmarks, notifications.

Next session: pick up with the apply flow and job seeker dashboard.
