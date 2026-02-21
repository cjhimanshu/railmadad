# RailMadad Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- MongoDB Atlas account with a cluster set up
- Cloudinary account for image storage
- Hugging Face account with API key
- GitHub repository (for deployment platforms)

## Backend Deployment (Render/Railway)

### Using Render

1. **Create New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory as root

2. **Configure Build Settings**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secure_random_string
   JWT_EXPIRE=7d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://railmadad-api.onrender.com`)

### Using Railway

1. **Create New Project**
   - Go to [Railway](https://railway.app/)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Service**
   - Add environment variables (same as above)
   - Railway will auto-detect Node.js and deploy

3. **Get Deployment URL**
   - Copy your service URL from Railway dashboard

## Frontend Deployment (Vercel/Netlify)

### Using Vercel

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure Project**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-app.vercel.app`

### Using Netlify

1. **Create New Site**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

2. **Configure Build Settings**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add `VITE_API_URL` with your backend URL

4. **Deploy**
   - Click "Deploy site"

## Database Setup (MongoDB Atlas)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Choose a cloud provider and region

2. **Create Database User**
   - Go to Database Access
   - Add new database user with password
   - Note the username and password

3. **Configure Network Access**
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0` (allow from anywhere)
   - Or add specific IPs from your deployment platforms

4. **Get Connection String**
   - Go to Database → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `railmadad`

## Cloudinary Setup

1. **Create Account**
   - Go to [Cloudinary](https://cloudinary.com/)
   - Sign up for free account

2. **Get Credentials**
   - Go to Dashboard
   - Note your Cloud Name, API Key, and API Secret

3. **Configure Upload Preset (Optional)**
   - Go to Settings → Upload
   - Create upload preset for better organization

## Hugging Face Setup

1. **Create Account**
   - Go to [Hugging Face](https://huggingface.co/)
   - Sign up for free account

2. **Get API Key**
   - Go to Settings → Access Tokens
   - Create new token with read access
   - Copy the token

## Post-Deployment Steps

1. **Update CORS Settings**
   - Ensure backend CORS allows your frontend URL
   - Update `FRONTEND_URL` environment variable

2. **Test the Application**
   - Register a new user
   - Submit a test complaint
   - Check AI analysis results
   - Test admin features

3. **Create Admin User**
   - Register a user through the app
   - Manually update the user's role to 'admin' in MongoDB Atlas:
     ```javascript
     db.users.updateOne(
       { email: "admin@example.com" },
       { $set: { role: "admin" } }
     )
     ```

## Monitoring and Maintenance

### Backend Monitoring
- Check Render/Railway logs for errors
- Monitor MongoDB Atlas metrics
- Set up alerts for high error rates

### Frontend Monitoring
- Check Vercel/Netlify deployment logs
- Monitor build times and errors
- Set up analytics (optional)

### Database Maintenance
- Regularly backup MongoDB data
- Monitor storage usage
- Optimize indexes if needed

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` in backend matches your frontend URL
   - Check CORS configuration in `server.js`

2. **Image Upload Fails**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper MIME types

3. **AI Features Not Working**
   - Verify Hugging Face API key
   - Check API rate limits
   - Review error logs

4. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check network access whitelist
   - Ensure database user has proper permissions

## Performance Optimization

1. **Backend**
   - Enable compression middleware
   - Implement caching for frequent queries
   - Use database indexes

2. **Frontend**
   - Enable Vercel/Netlify CDN
   - Optimize images before upload
   - Implement lazy loading

3. **Database**
   - Create indexes on frequently queried fields
   - Use aggregation pipelines efficiently
   - Monitor slow queries

## Security Checklist

- [ ] Strong JWT secret in production
- [ ] HTTPS enabled on all endpoints
- [ ] Environment variables secured
- [ ] Database user has minimal required permissions
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] File upload restrictions enforced
- [ ] CORS properly configured

## Scaling Considerations

- Use MongoDB Atlas auto-scaling
- Consider Redis for caching
- Implement CDN for static assets
- Use load balancer for multiple backend instances
- Monitor and optimize database queries

---

For support, refer to the main README.md or create an issue in the repository.
