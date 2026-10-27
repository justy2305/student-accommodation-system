# FindMyhome: Student Accommodation System

A web app where students find accommodation, apply for rooms and track their applications, and where administrators manage listings and review applications.

**Stack:** React + Vite (frontend) · Node.js + Express (backend API) · PostgreSQL · Cloudinary (images) · JWT authentication

## Project structure

```
Backend/    Express REST API (auth, accommodations, rooms, applications, notifications, admin)
Frontend/   React app (login, registration, student dashboard)
```

## Features so far

- Student registration and login, with the session kept in an httpOnly cookie
- Role-based access (student / admin) on the API and in the frontend routes
- Student dashboard: application status, stats and latest updates
- Accommodation, room, application and notification APIs

## Running it locally

You need Node.js and PostgreSQL installed.

**1. Backend**

```bash
cd Backend
npm install
cp .env.example .env   # then fill in your database password, JWT secret and Cloudinary keys
npm run dev            # runs on http://localhost:5000
```

Check the database connection at http://localhost:5000/api/test-db.

**2. Frontend** (in a second terminal)

```bash
cd Frontend
npm install
cp .env.example .env
npm run dev            # opens on http://localhost:5173
```

The frontend forwards `/api` requests to the backend through the Vite proxy (`Frontend/vite.config.js`).

## Security notes

- Passwords are hashed with bcrypt.
- The JWT is stored in an `httpOnly`, `SameSite=Lax` cookie, so JavaScript cannot read it.
- Real `.env` files are excluded from Git. Only the `.env.example` templates are committed.
