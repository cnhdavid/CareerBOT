# Vercel Deployment Guide for CareerBOT

This guide will help you deploy your CareerBOT application to Vercel Free Tier with optimized performance.

## ✅ What's Been Optimized

### 1. **Edge Runtime & Streaming**
- The `/api/answer` endpoint now uses Vercel's Edge Runtime
- Implements Server-Sent Events (SSE) for streaming responses
- Bypasses the 10-second timeout limitation for serverless functions
- Provides real-time chat responses without waiting for completion

### 2. **Serverless API Routes**
All API routes have been converted to Vercel serverless functions:
- `api/auth/signup.js` - User registration
- `api/auth/login.js` - User authentication
- `api/auth/logout.js` - User logout
- `api/auth/me.js` - Get/update user profile
- `api/answer.js` - OpenAI chat with streaming (Edge Runtime)
- `api/conversations/index.js` - List/create conversations
- `api/conversations/[id].js` - Get/update/delete conversation
- `api/rooms/index.js` - List/create rooms
- `api/rooms/[id].js` - Get/update/delete room
- `api/rooms/[id]/conversations.js` - Manage room conversations
- `api/upload.js` - File upload and analysis
- `api/analyze-cv.js` - CV analysis
- `api/health.js` - Health check

### 3. **Guest Mode**
- ✅ Already uses cookie-based sessions (JWT tokens)
- ✅ No in-memory storage - fully compatible with serverless
- Guest session tracking via cookies (not in-memory)
- 10 message limit for guest users before signup prompt

### 4. **Error Handling**
- Added `ErrorBoundary` component for React errors
- Added `ApiErrorHandler` utility for API error handling
- Graceful error messages for users
- Automatic retry suggestions

### 5. **Dependencies**
- Removed server-specific dependencies (Express, etc.)
- Added serverless-compatible packages:
  - `mongodb` - Direct MongoDB driver (no Mongoose)
  - `bcryptjs` - Password hashing
  - `jsonwebtoken` - JWT authentication
  - `mammoth` - DOCX parsing
  - `pdf-parse` - PDF parsing

## 📋 Pre-Deployment Checklist

### 1. **MongoDB Atlas Setup**
1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier M0)
3. Create a database user with read/write permissions
4. Whitelist all IP addresses (0.0.0.0/0) for Vercel
5. Get your connection string (replace `<password>` with your actual password)

### 2. **OpenAI API Key**
1. Get your API key from https://platform.openai.com/api-keys
2. Ensure you have credits available

### 3. **Generate Secrets**
Generate secure random strings for JWT and session secrets:
```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
cd CareerBOT
git add .
git commit -m "Optimize for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to https://vercel.com
2. Sign up or log in
3. Click "Add New Project"
4. Import your GitHub repository
5. Select the `CareerBOT` folder as the root directory

### Step 3: Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

| Variable Name | Value | Example |
|--------------|-------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `OPENAI_MODEL` | Model to use | `gpt-4o-mini` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/careerbot` |
| `JWT_SECRET` | Random secure string (32+ chars) | Generated from above |
| `SESSION_SECRET` | Random secure string (32+ chars) | Generated from above |
| `CLIENT_URL` | Your Vercel app URL | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment | `production` |

### Step 4: Configure Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build` (already configured)
- **Output Directory**: `dist` (already configured)
- **Install Command**: `npm install`

### Step 5: Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-app.vercel.app`

## 🔧 Post-Deployment Configuration

### Update CLIENT_URL
After deployment, update the `CLIENT_URL` environment variable:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update `CLIENT_URL` to your actual Vercel URL (e.g., `https://careerbot.vercel.app`)
3. Redeploy the application

### Test the Application
1. Visit your deployed URL
2. Try guest mode (should work without login)
3. Create an account
4. Test chat functionality
5. Test file upload
6. Test CV analysis

## 📊 Monitoring & Limits

### Vercel Free Tier Limits
- **Bandwidth**: 100 GB/month
- **Serverless Function Execution**: 100 GB-hours/month
- **Edge Function Execution**: 500,000 requests/month
- **Build Time**: 6,000 minutes/month

### Monitor Usage
- Check Vercel Dashboard → Analytics
- Monitor function execution times
- Watch for rate limiting

### OpenAI Costs
- Monitor usage at https://platform.openai.com/usage
- Set up billing alerts
- Consider rate limiting for production

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### API Errors
- Check function logs in Vercel Dashboard
- Verify environment variables are set correctly
- Ensure MongoDB connection string is correct

### Streaming Not Working
- Check browser console for errors
- Verify Edge Runtime is enabled for `/api/answer`
- Test with different browsers

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check database user permissions
- Test connection string locally first

## 🔄 Continuous Deployment

Every push to your `main` branch will automatically trigger a new deployment on Vercel.

To deploy from a different branch:
1. Go to Vercel Dashboard → Settings → Git
2. Change the production branch

## 📝 Environment Variables Reference

See `.env.example` for all required environment variables with descriptions.

## 🎯 Performance Tips

1. **Optimize Images**: Use WebP format and lazy loading
2. **Code Splitting**: Vite handles this automatically
3. **Caching**: Vercel CDN caches static assets automatically
4. **Database Indexes**: Add indexes to frequently queried fields in MongoDB
5. **Rate Limiting**: Implement rate limiting for production

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong secrets** - Generate random strings for JWT/session secrets
3. **Enable HTTPS only** - Vercel provides this automatically
4. **Validate user input** - Already implemented in API routes
5. **Monitor for suspicious activity** - Use Vercel Analytics

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Edge Runtime Documentation](https://vercel.com/docs/functions/edge-functions)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## ✅ Success Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] OpenAI API key obtained
- [ ] Secrets generated (JWT_SECRET, SESSION_SECRET)
- [ ] Repository pushed to GitHub
- [ ] Vercel project created and connected
- [ ] All environment variables configured
- [ ] First deployment successful
- [ ] CLIENT_URL updated and redeployed
- [ ] Guest mode tested
- [ ] User registration tested
- [ ] Chat functionality tested
- [ ] File upload tested
- [ ] CV analysis tested

---

**Need Help?** Check the Vercel Dashboard logs or MongoDB Atlas monitoring for detailed error messages.
