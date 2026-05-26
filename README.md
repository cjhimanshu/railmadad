# RailMadad

AI-assisted railway complaint management platform (MERN).

RailMadad helps passengers submit and track complaints while providing admins tools to triage, dispatch, and resolve issues faster. The codebase demonstrates API design, auth, background processing, file uploads, and AI-assisted automation.

Live demo

- RailMadad: https://railmadad-gamma.vercel.app/

Highlights

- Passenger complaint submission and public tracking
- Admin dashboard with dispatch, analytics, and bulk actions
- AI-assisted categorization, priority suggestion, sentiment analysis, and draft responses
- Background jobs using BullMQ/Redis

Quick links

- Repository: https://github.com/cjhimanshu/railmadad

Table of contents

- Project
- Features
- Quick start (dev)
- Docker
- Environment
- Scripts
- Testing
- Project structure
- Contributing

Project

RailMadad is a focused helpdesk for railway passengers to report issues, track progress, and receive resolution confirmations. It's a practical example of a production-oriented MERN app with optional AI integrations.

Features

- Complaint submission with attachments
- Public tracking page for complaints
- Admin panel with dispatch and analytics
- Background workers for automation and AI tasks

Quick start (development)

Prerequisites

- Node.js (16+ recommended) and npm
- Git
- Optional: Docker & Docker Compose (for local dependent services)

Clone and install

```bash
git clone https://github.com/cjhimanshu/railmadad.git
cd railmadad
npm run install-all
```

Environment files

Copy the example env files and set values for secrets and service URLs:

- [backend/.env.example](backend/.env.example) → `backend/.env`
- [frontend/.env.example](frontend/.env.example) → `frontend/.env`

At minimum configure `MONGODB_URI`, `JWT_SECRET`, and Cloudinary keys if you plan to upload files. For AI features provide `HUGGINGFACE_API_KEY` or other model keys.

Run locally

In one terminal (backend):

```bash
npm run dev-backend
```

In another terminal (frontend):

```bash
npm run dev-frontend
```

Defaults

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

Docker (local / CI)

Spin up the app and recommended services (MongoDB, Redis) using Docker Compose from the repo root:

```bash
docker-compose up --build
```

Or build and run only the backend image:

```bash
docker build -f backend/Dockerfile -t railmadad-backend ./backend
docker run --env-file backend/.env -p 5000:5000 railmadad-backend
```

Environment (key vars)

Required (examples)

- `PORT` — backend port
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET`, `JWT_EXPIRE` — JWT auth
- `CLOUDINARY_*` — Cloudinary upload credentials (optional)
- `HUGGINGFACE_API_KEY` — AI integrations (optional)

Recommended for production

- `REDIS_URL` — Redis for BullMQ workers
- `RESEND_API_KEY` / `TWILIO_*` — email/SMS providers

Scripts

- Root helpers: `npm run install-all`, `npm run dev-backend`, `npm run dev-frontend`, `npm run build-frontend`, `npm run start-backend`
- Backend: `npm start`, `npm run dev`, `npm test`
- Frontend: `npm run dev`, `npm run build`, `npm run preview`

Testing

Backend tests live in the `backend` folder. Run:

```bash
cd backend
npm test
```

Project structure (short)

```text
railmadad/
  backend/        # API, models, controllers, queues, tests
  frontend/       # Vite + React app
  docker-compose.yml
  README.md
```

Contributing

See CONTRIBUTING.md for developer setup and PR guidelines.

1. Fork the repo and create a branch for your change.
2. Add focused commits and tests for logic changes.
3. Run `cd backend && npm test` before opening a PR.

Operational notes

- Use `REDIS_URL` with a worker process in production to run BullMQ jobs and AI/background tasks reliably.

License

ISC
