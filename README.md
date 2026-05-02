# RailMadad

AI-assisted railway complaint management platform built with the MERN stack.

RailMadad helps passengers submit and track complaints, while giving admins tools to triage, dispatch, and resolve issues faster.

Live apps:

- RailMadad: https://railmadad-gamma.vercel.app/
- Hotel Booking System: https://hotel-booking-system-eight-self.vercel.app/

## Key Features

## Projects

- **RailMadad** — Railway Complaint & Helpdesk Platform
  - Repo: https://github.com/cjhimanshu/railmadad
  - Live: https://railmadad-gamma.vercel.app/

- **Hotel Booking System** — Full-Stack Reservation Platform
  - Repo: https://github.com/cjhimanshu/hotel-booking-system
  - Live: https://hotel-booking-system-eight-self.vercel.app/

### Passenger Experience

- Submit complaints with or without a full account flow.
- Receive complaint tracking credentials for public tracking.
- Track updates and closure status.
- Submit satisfaction feedback after resolution.

### Admin Experience

- Admin-only dashboard with protected routes.
- Filter and manage complaints by status, priority, and dispatch flow.
- Mark authority action complete and handle customer confirmation.
- Review analytics and dispatch logs.

### AI and Automation

- AI-assisted complaint categorization, priority suggestion, sentiment, and draft response support.
- BullMQ + Redis queue for background AI processing.
- Automatic fallback to in-process async handling when Redis is unavailable.
- Cron-driven automation for escalation, status transitions, and operational logging.

Note: Some community-hosted models may be removed or moved on Hugging Face. For the AI "response" model prefer currently supported text-generation models such as `google/flan-t5-small` or `google/flan-t5-base`. If you see 404s from the Hugging Face router, update `HF_MODEL_RESPONSE` in `backend/.env` (or `.env.example`).

## Tech Stack

### Backend

- Node.js, Express
- MongoDB, Mongoose
- JWT, bcryptjs
- BullMQ, ioredis
- Cloudinary, Multer
- Resend (email), Twilio (SMS)
- express-rate-limit, express-validator, node-cron

### Frontend

- React 18, Vite
- React Router
- Tailwind CSS
- Axios
- Recharts
- React Toastify

## Project Structure

```text
railmadad/
  backend/
    config/
    controllers/
    middleware/
    models/
    queues/
    routes/
    services/
    tests/
    server.js
  frontend/
    public/
    src/
  README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas (or local MongoDB)
- Cloudinary account (for image upload)
- Hugging Face API token
- Resend account (for email delivery)
- Optional: Redis (recommended for production queueing)
- Optional: Twilio credentials (for SMS notifications)

## Quick Start

### 1) Clone and install

```bash
git clone https://github.com/your-org/railmadad.git
cd railmadad
npm run install-all
```

You can also install manually:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure environment

Create these files:

- backend/.env (from backend/.env.example)
- frontend/.env (from frontend/.env.example)

### 3) Start development servers

From the repository root:

```bash
npm run dev-backend
```

In a second terminal:

```bash
npm run dev-frontend
```

Default local URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

Note: backend/.env.example uses PORT=5000 to match the backend default and the frontend API examples.

## Environment Variables

### Backend (backend/.env)

Required for core app:

- PORT
- NODE_ENV
- MONGODB_URI or MONGO_URI
- JWT_SECRET
- JWT_EXPIRE
- ADMIN_EMAIL
- ADMIN_PASSWORD
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- HUGGINGFACE_API_KEY
- FRONTEND_URL

Optional but recommended:

- HF_MODEL_CATEGORY
- HF_MODEL_SENTIMENT
- HF_MODEL_RESPONSE
- HF_TIMEOUT
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- REDIS_URL
- AI_QUEUE_CONCURRENCY
- WEB_CONCURRENCY (production clustering)
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER
- SMS_COUNTRY_CODE
- ADMIN_SECRET_KEY (if using admin register flow)

### Frontend (frontend/.env)

- VITE_API_URL (example: http://localhost:5000/api)

## npm Scripts

### Root

- npm run install-all
- npm run dev-backend
- npm run dev-frontend
- npm run build-frontend
- npm run start-backend

### Backend

- npm start
- npm run dev
- npm test

### Frontend

- npm run dev
- npm run build
- npm run preview

## API Overview

Base URL (default): http://localhost:5000/api

### Auth routes

- POST /auth/register
- POST /auth/login
- POST /auth/admin-login
- POST /auth/admin-register
- POST /auth/send-otp
- POST /auth/verify-otp
- GET /auth/me
- PUT /auth/me
- POST /auth/forgot-password
- PUT /auth/reset-password/:token

### Complaint routes

- POST /complaints
- POST /complaints/track
- GET /complaints/track
- GET /complaints
- GET /complaints/:id
- PUT /complaints/:id
- DELETE /complaints/:id
- PUT /complaints/:id/satisfaction
- PUT /complaints/:id/confirm-resolved
- PUT /complaints/:id/close

### Admin routes

- GET /admin/complaints
- PUT /admin/complaints/:id/status
- PUT /admin/complaints/:id/mark-done
- POST /admin/bulk-send-to-authority
- GET /admin/analytics
- GET /admin/stats
- GET /admin/dispatch-log
- PUT /admin/dispatch-log/:batchId/acknowledge

## Testing

Backend tests use Node's built-in test runner.

```bash
cd backend
npm test
```

Current test suite covers auth success paths, route validation, and complaint access controls.

## Operational Notes

- In production, clustering is enabled and workers are spawned based on WEB_CONCURRENCY or CPU count.
- Automation and control-unit schedulers run only on worker 1 (or single-process development).
- Redis is optional in development; AI queueing falls back gracefully when REDIS_URL is unavailable.

## Security Highlights

- JWT-based auth and role checks.
- Password hashing with bcryptjs.
- Route-level validation via express-validator.
- Rate limiting across general/auth/tracking endpoints.
- CORS restrictions with configurable frontend origin.

## Contributing

1. Fork and create a feature branch.
2. Make your changes with tests where applicable.
3. Run backend tests.
4. Open a pull request with a clear change summary.

## License

ISC
