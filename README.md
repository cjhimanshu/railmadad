# RailMadad — AI-Integrated Railway Complaint Management System

A full-stack MERN application that streamlines railway complaint management with AI-powered categorization, priority suggestion, sentiment analysis, and an automated guest-to-user account flow.

**Live:** [railmadad-gamma.vercel.app](https://railmadad-gamma.vercel.app)

---

## Features

### For Passengers (Guest Flow)

- Submit complaints without creating an account
- Email address required — used to auto-create an account and track complaints
- After submission, a **password setup email** is sent automatically
- Set password via the link → log in → view all your complaints in the dashboard

### For Registered Users

- Email + password authentication (JWT)
- View full complaint history and real-time status
- Track complaint progress from submission to resolution

### For Admins

- Separate admin login at `/admin-login`
- View and filter all complaints across the system
- Update complaint status and assign departments
- Add internal admin notes
- Analytics dashboard with interactive charts (Recharts)
- Monitor resolution times and category trends

### AI Features

- **Auto-categorization** — Hugging Face zero-shot classification (`facebook/bart-large-mnli`)
- **Sentiment analysis** — Detects complaint tone (`distilbert-base-uncased-finetuned-sst-2-english`)
- **Priority suggestion** — Based on keywords and sentiment score
- **Suggested response** — AI-generated template response for admins

---

## Tech Stack

### Backend

| Technology                 | Purpose                                                |
| -------------------------- | ------------------------------------------------------ |
| Node.js + Express.js       | REST API server                                        |
| MongoDB + Mongoose         | Database                                               |
| JWT + bcryptjs             | Authentication & password hashing                      |
| Cloudinary                 | Image uploads                                          |
| Hugging Face Inference API | AI categorization & sentiment                          |
| Resend                     | Transactional emails (password setup, forgot password) |
| BullMQ + ioredis           | Background AI processing queue                         |
| Multer                     | File upload handling                                   |
| express-rate-limit         | API rate limiting                                      |
| node-cron                  | Scheduled automation tasks                             |

### Frontend

| Technology      | Purpose                   |
| --------------- | ------------------------- |
| React 18 + Vite | UI framework & build tool |
| Tailwind CSS    | Styling                   |
| React Router v6 | Client-side routing       |
| Recharts        | Analytics charts          |
| Axios           | HTTP client               |
| React Toastify  | Notifications             |

---

## Local Development

### Prerequisites

- Node.js v16+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Hugging Face API key
- Resend account (for emails)
- Redis instance (for BullMQ queue — e.g. Redis Cloud free tier)

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

HUGGINGFACE_API_KEY=your_huggingface_api_key

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev

REDIS_URL=your_redis_connection_string

FRONTEND_URL=http://localhost:5173

ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_admin_password
```

```bash
npm run dev
# Runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

The frontend reads the backend URL from `VITE_API_URL` (defaults to `http://localhost:5000/api` if not set).

---

## API Reference

### Auth

| Method | Endpoint                          | Access    | Description               |
| ------ | --------------------------------- | --------- | ------------------------- |
| POST   | `/api/auth/register`              | Public    | Register new user         |
| POST   | `/api/auth/login`                 | Public    | Login (email + password)  |
| GET    | `/api/auth/me`                    | Protected | Get current user          |
| POST   | `/api/auth/forgot-password`       | Public    | Send password reset email |
| POST   | `/api/auth/reset-password/:token` | Public    | Reset password via token  |
| POST   | `/api/auth/change-password`       | Protected | Change password           |

### Complaints

| Method | Endpoint              | Access    | Description                           |
| ------ | --------------------- | --------- | ------------------------------------- |
| POST   | `/api/complaints`     | Public    | Submit complaint (guest or logged-in) |
| GET    | `/api/complaints`     | Protected | Get current user's complaints         |
| GET    | `/api/complaints/:id` | Protected | Get single complaint                  |

### Admin

| Method | Endpoint                           | Access | Description                       |
| ------ | ---------------------------------- | ------ | --------------------------------- |
| GET    | `/api/admin/complaints`            | Admin  | Get all complaints with filters   |
| PUT    | `/api/admin/complaints/:id/status` | Admin  | Update status / assign department |
| GET    | `/api/admin/analytics`             | Admin  | Full analytics data               |
| GET    | `/api/admin/stats`                 | Admin  | Quick stats summary               |

---

## Guest Complaint Flow

```
Guest fills form (email required)
        ↓
Complaint saved → auto-account created for email
        ↓
Password setup email sent via Resend (24hr link)
        ↓
User clicks link → sets password on /reset-password
        ↓
Logs in → complaint appears in dashboard
```

---

## Database Schema (summary)

### Users

```
name, email (unique), password (hashed), role (user/admin),
phone, isActive, resetPasswordToken, resetPasswordExpire, timestamps
```

### Complaints

```
userId (ref: User), title, description, category, priority,
status, contactEmail, contactMobile, imageURL, trainNumber,
pnrNumber, sentiment, aiSuggestions { suggestedCategory,
suggestedPriority, suggestedResponse, confidence },
assignedDepartment, adminNotes, resolvedAt, timestamps
```

---

## Deployment

### Frontend — Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

### Backend — Render

- Root directory: `backend`
- Start command: `node server.js`
- Set all environment variables from the `.env` section above

### Database — MongoDB Atlas

- Create a free M0 cluster
- Add `0.0.0.0/0` to IP whitelist (or your Render IP)
- Copy the connection string to `MONGODB_URI`

> **Note:** On Render's free tier, the backend sleeps after 15 minutes of inactivity. The first request after sleep may take 30–60 seconds. Upgrade to Render Starter or use a keep-alive service (e.g. UptimeRobot) to avoid this.

---

## Security

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT-based stateless authentication
- Role-based access control (user / admin)
- API rate limiting on all routes
- Input validation via express-validator
- File upload type and size restrictions (Multer + Cloudinary)
- CORS restricted to `FRONTEND_URL`

---

## License

ISC

---

Built with the MERN stack + Hugging Face AI + Resend
