# FindMyhome: Student Accommodation System

A web app where students find accommodation near campus, apply for a room and track their application. Applications are reviewed automatically by the system.

**Stack:** React + Vite (frontend) · Node.js + Express (backend API) · PostgreSQL · Cloudinary (images) · JWT + bcrypt (authentication)

## How it works

1. **Register** and log in.
2. **Search** homes on Explore by area, price, room type, availability, facilities and distance from campus.
3. **View** a home's details, rooms and prices, facilities, rules, contact details and photos.
4. **Apply** for a room type that has space.
5. **Track** the application: Pending → Under Review (after 1 minute) → a decision (after 2 minutes), with a notification at each step.
6. **Decision:** approved if that room type still has space and the student has no other approved home; otherwise rejected, with the reason. When approved, the lease runs from the 1st of next month to 30 November, and the student signs it on the dashboard.

## Project structure

```
Backend/    Express REST API: auth, homes (read-only), applications, automatic review, notifications, profile
Frontend/   React app: Explore, home details, login and registration, dashboard, notifications, profile
```

Homes, room types, facilities, distances and photos come from `Backend/scripts/seed-accommodations.js`.

## Running it locally

You need Node.js and PostgreSQL installed.

**1. Backend**

```bash
cd Backend
npm install
cp .env.example .env   # then fill in your database password, JWT secret and Cloudinary keys
npm run db:setup       # creates or updates the tables
npm run db:seed        # adds the homes
npm run images:upload  # optional: moves the photos to Cloudinary
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

## Testing

Import `Backend/postman/FindMyhome-CRUD.postman_collection.json` into Postman and run the collection. It registers its own test account, tests create, read, update and delete for the account, profile, applications and notifications, waits for the automatic decision, and deletes the account at the end.

`npm run test:accounts` creates a student account for trying the website: `student@findmyhome.test` / `Student12345`.

## Security notes

- Passwords are hashed with bcrypt.
- The JWT is stored in an `httpOnly`, `SameSite=Lax` cookie, so JavaScript cannot read it.
- Students can only see and change their own profile, applications and notifications. Application statuses are changed only by the automatic review on the server.
- Deleting an account needs the password.
- Real `.env` files are excluded from Git. Only the `.env.example` templates are committed.
