# RailMadad

RailMadad is an AI-assisted railway complaint management platform built with the MERN stack. Passengers can submit and track complaints, while admins can triage issues, dispatch work, and monitor progress from a dashboard.

Live demo: https://railmadad-gamma.vercel.app/

Repository: https://github.com/cjhimanshu/railmadad

## What It Does

- Complaint submission with attachments
- Public complaint tracking
- Admin dashboard for dispatch, analytics, and bulk actions
- AI-assisted categorization, priority suggestion, sentiment analysis, and draft responses
- Background jobs with BullMQ and Redis
- Structured API responses and centralized logging for cleaner frontend handling and better observability

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Git
- Optional: Docker and Docker Compose for local services

### Install

```bash
git clone https://github.com/cjhimanshu/railmadad.git
cd railmadad
npm run install-all
```

### Environment Files

Copy the example env files and fill in the values you need:

- [backend/.env.example](backend/.env.example) -> `backend/.env`
- [frontend/.env.example](frontend/.env.example) -> `frontend/.env`

Minimum backend setup:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`

Optional features:

- `CLOUDINARY_*` for file uploads
- `HUGGINGFACE_API_KEY` for AI integrations
- `REDIS_URL` for BullMQ workers
- `RESEND_API_KEY` or `TWILIO_*` for notifications

### Run Locally

Start the backend:

```bash
npm run dev-backend
```

Start the frontend in a separate terminal:

```bash
npm run dev-frontend
```

Default URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Docker

Bring up the full stack from the repository root:

```bash
docker-compose up --build
```

Backend-only image build:

```bash
docker build -f backend/Dockerfile -t railmadad-backend ./backend
docker run --env-file backend/.env -p 5000:5000 railmadad-backend
```

## Scripts

Root:

- `npm run install-all`
- `npm run dev-backend`
- `npm run dev-frontend`
- `npm run build-frontend`
- `npm run start-backend`
- `npm run test-backend`
- `npm run lint-all`
- `npm run format-all`
- `npm run docker:up`
- `npm run docker:down`
- `npm run docker:logs`
- `npm run docker:build`
- `npm run docker:clean`

Backend:

- `npm start`
- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`

Frontend:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`

## Testing

Backend tests live in the `backend` folder. Run them with:

```bash
cd backend
npm test
```

## Project Structure

```text
railmadad/
  backend/        # API, models, controllers, queues, tests
  frontend/       # Vite + React app
  docker-compose.yml
  README.md
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and PR guidelines.

1. Fork the repo and create a branch for your change.
2. Add focused commits and tests for logic changes.
3. Run `cd backend && npm test` before opening a PR.

## Operational Notes

- Use `REDIS_URL` with a worker process in production so BullMQ jobs and AI/background tasks run reliably.
- The backend now uses centralized logging and standardized API responses, which makes debugging and frontend error handling more consistent.

## License

ISC
