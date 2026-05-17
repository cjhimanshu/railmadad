# RailMadad

AI-assisted railway complaint management platform built with the MERN stack.

RailMadad helps passengers submit and track complaints and provides admins tools to triage, dispatch, and resolve issues faster.

Live apps

- RailMadad: https://railmadad-gamma.vercel.app/
- Hotel Booking System: https://hotel-booking-system-eight-self.vercel.app/

Highlights

- Passenger complaint submission and public tracking
- Admin dashboard with dispatch, analytics, and bulk actions
- AI-assisted categorization, priority suggestion, sentiment analysis, and draft responses
- Background jobs using BullMQ/Redis with graceful fallback

Quick Links

- Repo: https://github.com/cjhimanshu/railmadad

Table of contents

- What is this
- Quick start (dev)
- Docker
- Environment variables
- Scripts
- Testing
- Contributing

What is this

RailMadad is a focused helpdesk for railway passengers to report issues, track progress, and receive resolution confirmations. The project demonstrates full-stack patterns (API, auth, background jobs, file uploads, and realtime-ish UX) and includes AI-assisted automation for triage and response drafts.

Quick start (development)

1. Clone and install

```bash
git clone https://github.com/cjhimanshu/railmadad.git
cd railmadad
npm run install-all
```

2. Copy environment files

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Edit the created `.env` files (backend/.env and frontend/.env) and provide the required secrets (see section below).

3. Run development servers

In one terminal (backend):

```bash
npm run dev-backend
```

In another terminal (frontend):

```bash
npm run dev-frontend
```

Default local URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

Docker (local / CI)

There is a `docker-compose.yml` at the repo root for spinning up the app and recommended services (MongoDB, Redis).

Build and run with Docker Compose:

```bash
docker-compose up --build
```

Or build just the backend image and run it:

```bash
docker build -f backend/Dockerfile -t railmadad-backend ./backend
docker run --env-file backend/.env -p 5000:5000 railmadad-backend
```

Environment variables

Copy the example env files in `backend/.env.example` and `frontend/.env.example` and fill in secrets. Required backend variables include:

- `PORT`, `NODE_ENV`
- `MONGODB_URI` or `MONGO_URI`
- `JWT_SECRET`, `JWT_EXPIRE`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `HUGGINGFACE_API_KEY` (for AI features)
- `FRONTEND_URL`

Optional but useful in production

- `REDIS_URL` (recommended for BullMQ)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

If you change AI model configuration, update `HF_MODEL_RESPONSE` and related vars in `backend/.env`.

Scripts

- Root helpers: `npm run install-all`, `npm run dev-backend`, `npm run dev-frontend`, `npm run build-frontend`, `npm run start-backend`
- Backend: `npm start`, `npm run dev`, `npm test`
- Frontend: `npm run dev`, `npm run build`, `npm run preview`

Testing

Backend tests use Node's test runner. Run them from the backend folder:

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

1. Fork the repository and create a feature branch.
2. Add clear, focused commits and tests for logic changes.
3. Run backend tests (`cd backend && npm test`) before opening a PR.

Operational notes

- Production should run with `REDIS_URL` and worker processes for BullMQ to scale AI/background jobs.
- Automation tasks (cron) and control-unit schedulers are orchestrated and may be restricted to a single worker in production.

License

ISC
