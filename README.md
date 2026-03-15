# RailMadad — Railway Complaint Management, Made Simple

Welcome to RailMadad! This project is all about making it easier for railway passengers to submit complaints and for admins to manage and resolve them efficiently. We use a modern MERN stack (MongoDB, Express, React, Node.js) and sprinkle in some AI to help categorize and prioritize complaints.

**Live Demo:**  
[railmadad-gamma.vercel.app](https://railmadad-gamma.vercel.app)

---

## What Can You Do Here?

### For Passengers

- **No account? No problem!** You can submit a complaint with just your email.
- After you submit, you’ll get a password setup link in your inbox. Set your password, log in, and you’ll see all your complaints in one place.
- Track the progress of your complaint from start to finish.

### For Registered Users

- Log in with your email and password.
- See your full complaint history and real-time updates.

### For Admins

- Special admin login at `/admin-login`.
- View, filter, and manage all complaints.
- Assign departments, update statuses, and add internal notes.
- See analytics and trends with interactive charts.

### How Does AI Help?

- Automatically categorizes complaints (using Hugging Face models).
- Suggests priority and even drafts a response for admins.
- Analyzes sentiment to help spot urgent or negative feedback.

---

## Tech Stack (What’s Under the Hood?)

**Backend:**

- Node.js + Express (API server)
- MongoDB + Mongoose (database)
- JWT + bcryptjs (authentication)
- Cloudinary (image uploads)
- Hugging Face API (AI magic)
- Resend (emails)
- BullMQ + Redis (background jobs)
- Multer (file uploads)
- express-rate-limit (security)
- node-cron (scheduled tasks)

**Frontend:**

- React 18 + Vite (UI and build tool)
- Tailwind CSS (styling)
- React Router v6 (navigation)
- Recharts (charts)
- Axios (API calls)
- React Toastify (notifications)

---

## Getting Started (Local Setup)

1. **Clone this repo:**
   `bash
 git clone https://github.com/yourusername/railmadad.git
 cd railmadad
 `

2. **Install dependencies:**
   `bash
 cd backend && npm install
 cd ../frontend && npm install
 `

3. **Set up your environment variables:** - Copy `.env.example` to `.env` in both `backend/` and `frontend/`. - Fill in your database, API keys, etc.

4. **Start the backend:**
   `bash
 cd backend
 npm start
 `

5. **Start the frontend:**
   `bash
 cd frontend
 npm run dev
 `

6. **Open your browser:**  
   Go to [http://localhost:5173](http://localhost:5173)

---

## Why This Project?

We built RailMadad to make it easier for passengers to get their voices heard and for railway staff to respond quickly and efficiently. The AI features help sort and prioritize complaints, so nothing important slips through the cracks.

---

## Want to Contribute?

We’d love your help! Whether you’re fixing a bug, adding a feature, or improving the docs, your contribution is welcome. Just fork the repo, make your changes, and open a pull request.

---

If you have any questions or ideas, feel free to open an issue or reach out. Thanks for checking out RailMadad!

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
