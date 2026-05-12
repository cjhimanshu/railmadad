# Docker Deployment Guide

This project is fully containerized for development and production environments.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git

## Quick Start with Docker Compose

### Local Development

Start all services (MongoDB, Redis, backend, frontend):

```bash
npm run docker:up
```

This will:

- Start MongoDB on `localhost:27017` (admin:password)
- Start Redis on `localhost:6379`
- Start backend API on `localhost:5000`
- Start frontend (Nginx) on `localhost:80`

View logs:

```bash
npm run docker:logs
```

Stop all services:

```bash
npm run docker:down
```

Clean up volumes (WARNING: deletes all data):

```bash
npm run docker:clean
```

## Rebuild Docker Images

If dependencies or code change:

```bash
npm run docker:build
```

## Individual Docker Images

### Backend Image

Build:

```bash
docker build -t railmadad-backend:latest backend/
```

Run (requires external MongoDB and Redis):

```bash
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://mongo:27017/railmadad \
  -e REDIS_URL=redis://redis:6379 \
  -e JWT_SECRET=your_secret \
  railmadad-backend:latest
```

### Frontend Image

Build:

```bash
docker build -t railmadad-frontend:latest frontend/
```

Run:

```bash
docker run -p 80:80 railmadad-frontend:latest
```

## Production Deployment

### Environment Variables

Before deploying to production, set these secrets in your deployment platform:

**Backend:**

- `MONGODB_URI` — production MongoDB connection string
- `JWT_SECRET` — strong secret key
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `CLOUDINARY_*` — image hosting credentials
- `HUGGINGFACE_API_KEY` — AI model API key
- `RESEND_API_KEY` — email service credentials
- `REDIS_URL` — production Redis connection

**Frontend:**

- `VITE_API_URL` — production API endpoint (e.g., https://api.yourdomain.com)

### Docker Registry

Push images to your registry (e.g., Docker Hub, ECR, GCR):

```bash
docker tag railmadad-backend:latest your-registry/railmadad-backend:v1.0.0
docker push your-registry/railmadad-backend:v1.0.0

docker tag railmadad-frontend:latest your-registry/railmadad-frontend:v1.0.0
docker push your-registry/railmadad-frontend:v1.0.0
```

### Kubernetes Deployment

For Kubernetes, create manifests for:

- Backend Deployment (with MongoDB/Redis service discovery)
- Frontend Deployment (Nginx Ingress)
- Services and ConfigMaps

### Docker Compose in Production

For small deployments, you can use docker-compose on a single host:

```bash
docker-compose -f docker-compose.yml up -d
```

For multi-host orchestration, use Docker Swarm or Kubernetes instead.

## Health Checks

Both images include HEALTHCHECK directives:

- Backend: checks HTTP health endpoint on port 5000
- Frontend: checks HTTP status on port 80

Monitor health:

```bash
docker ps
```

## Troubleshooting

### Backend container exits immediately

- Check logs: `docker logs <container_id>`
- Verify `MONGODB_URI` and `REDIS_URL` are set
- Ensure MongoDB and Redis are running

### Frontend returns 502 Bad Gateway

- Backend is not reachable
- Check `VITE_API_URL` is correct
- Verify backend container is healthy

### Port already in use

- Change ports in docker-compose.yml or use `-p` override
- Or free up the port: `lsof -i :5000`

## CI/CD Integration

GitHub Actions will automatically build and push Docker images on successful tests. See `.github/workflows/ci.yml` for details.
