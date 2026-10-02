# PTE Master

**Practice Smart. Score Better.**

Free unofficial PTE Academic practice frontend built with React, Vite, and Tailwind CSS.

## Features

- Landing page with skills overview and illustrative testimonials
- Mock authentication (login, register, forgot/reset password)
- Student dashboard with charts, streaks, and progress
- Speaking, Writing, Reading, and Listening practice modules
- Timed mock tests with unofficial scoring
- Admin panel for students, questions, tests, and results
- Dark mode support
- LocalStorage drafts, history, and saved questions

## Demo accounts

| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| Student | student@ptemaster.com | student123  |
| Admin   | admin@ptemaster.com   | admin123    |

Authentication is **frontend-only** and stores sessions in localStorage.

## Setup

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Tech stack

- React + Vite
- Tailwind CSS v4
- React Router DOM
- React Icons
- React Toastify
- React Spinners
- Recharts
- Axios (available for future API integration)

## Notes

- All practice content is unofficial educational sample material.
- Not affiliated with Pearson PTE Academic.
- Speaking scores are not auto-generated; recordings stay in the browser when MediaRecorder is available.
- Admin edits update in-session mock data only.

## Project structure

```
src/
  components/   # reusable UI, layout, practice, dashboard
  context/      # auth + theme
  data/         # mock questions, tests, navigation
  layouts/      # admin layout
  pages/        # route pages
  routes/       # AppRoutes
  utils/        # helpers and scoring
```
