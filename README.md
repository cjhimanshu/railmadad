# RailMadad - AI-Integrated Railway Complaint Management System

A full-stack MERN application that leverages AI to streamline railway complaint management through automated categorization, priority suggestion, and sentiment analysis.

## 🚀 Features

### User Features
- User registration and authentication with JWT
- Submit complaints with image upload
- AI-powered automatic categorization and priority suggestion
- Sentiment analysis of complaints
- Track complaint status in real-time
- View complaint history

### Admin Features
- Comprehensive analytics dashboard
- View all complaints with filtering options
- Update complaint status and assign departments
- Add admin notes to complaints
- Visualize data with interactive charts
- Monitor resolution times and trends

### AI Features
- **Automatic Categorization**: Uses Hugging Face's zero-shot classification
- **Sentiment Analysis**: Analyzes complaint sentiment (positive, neutral, negative)
- **Priority Suggestion**: Suggests priority based on keywords and sentiment
- **Response Generation**: AI-generated suggested responses

## 🛠 Technology Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Cloudinary (Image Upload)
- Hugging Face Inference API (AI)
- Bcrypt (Password Hashing)

### Frontend
- React 18 with Vite
- Tailwind CSS
- React Router v6
- Recharts (Analytics)
- Axios
- React Toastify

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Cloudinary account
- Hugging Face API key

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

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
FRONTEND_URL=http://localhost:3000
```

### Frontend Setup

```bash
cd frontend
npm install
```

The frontend is pre-configured to use `http://localhost:5000/api` as the backend URL.

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Complaints (User)
- `GET /api/complaints` - Get user's complaints (Protected)
- `POST /api/complaints` - Create new complaint (Protected)
- `GET /api/complaints/:id` - Get single complaint (Protected)
- `PUT /api/complaints/:id` - Update complaint (Protected)
- `DELETE /api/complaints/:id` - Delete complaint (Protected)

### Admin
- `GET /api/admin/complaints` - Get all complaints with filters (Admin)
- `PUT /api/admin/complaints/:id/status` - Update complaint status (Admin)
- `GET /api/admin/analytics` - Get analytics data (Admin)
- `GET /api/admin/stats` - Get quick stats (Admin)

## 🎨 UI Features

- Modern gradient-based design
- Responsive layout for all devices
- Smooth animations and transitions
- Interactive charts and visualizations
- Real-time toast notifications
- Premium glassmorphism effects

## 🤖 AI Integration Details

### Hugging Face Models Used
1. **facebook/bart-large-mnli** - Zero-shot classification for categorization
2. **distilbert-base-uncased-finetuned-sst-2-english** - Sentiment analysis
3. **gpt2** - Response generation (with fallback templates)

### AI Processing Flow
1. User submits complaint
2. Backend sends text to Hugging Face API
3. AI analyzes and returns:
   - Suggested category
   - Sentiment score
   - Priority level
   - Suggested response
4. Results stored in database and shown to user

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user/admin),
  phone: String,
  isActive: Boolean,
  timestamps: true
}
```

### Complaints Collection
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  description: String,
  category: String,
  priority: String,
  status: String,
  imageURL: String,
  sentiment: String,
  aiSuggestions: {
    suggestedCategory: String,
    suggestedPriority: String,
    suggestedResponse: String,
    confidence: Number
  },
  assignedDepartment: String,
  adminNotes: String,
  resolvedAt: Date,
  timestamps: true
}
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- Protected API routes
- Input validation and sanitization
- File upload restrictions

## 🌐 Deployment

### Backend Deployment (Render/Railway)

1. Create new web service
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel/Netlify)

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

### Database (MongoDB Atlas)

1. Create cluster
2. Set up database user
3. Whitelist IP addresses
4. Get connection string

## 📝 Environment Variables Summary

### Backend
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRE` - Token expiration time
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `HUGGINGFACE_API_KEY` - Hugging Face API key
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend
- `VITE_API_URL` - Backend API URL

## 🎯 Future Enhancements

- Email notifications for status updates
- SMS alerts for urgent complaints
- Multi-language support
- Mobile app (React Native)
- Advanced analytics with ML predictions
- Export reports to PDF/Excel
- Real-time chat support
- Integration with railway systems

## 👥 Demo Credentials

### User Account
- Email: user@test.com
- Password: password123

### Admin Account
- Email: admin@test.com
- Password: password123

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, email support@railmadad.com or create an issue in the repository.

---

Built with ❤️ using MERN Stack and AI
