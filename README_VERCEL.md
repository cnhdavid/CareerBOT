# CareerBOT - Vercel Deployment Ready 🚀

A specialized career and education chatbot optimized for Vercel Free Tier deployment with streaming support.

## 🎯 Key Features

- **Edge Runtime Streaming**: Real-time AI responses using Server-Sent Events
- **Guest Mode**: Try the chatbot without registration (10 message limit)
- **User Authentication**: Secure JWT-based authentication with HTTP-only cookies
- **CV Analysis**: Upload and analyze CVs/resumes with AI
- **Conversation Management**: Save and organize chat conversations
- **Room System**: Group related conversations together
- **Multilingual**: Support for German and English
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Internationalization**: i18next

### Backend (Serverless)
- **Platform**: Vercel Serverless Functions + Edge Runtime
- **Database**: MongoDB Atlas
- **Authentication**: JWT with HTTP-only cookies
- **AI**: OpenAI GPT-4o-mini with streaming
- **File Processing**: PDF, DOCX, TXT parsing

## 📁 Project Structure

```
CareerBOT/
├── api/                          # Vercel Serverless Functions
│   ├── _lib/                     # Shared utilities
│   │   └── auth.js              # Authentication helpers
│   ├── auth/                     # Authentication endpoints
│   │   ├── signup.js
│   │   ├── login.js
│   │   ├── logout.js
│   │   └── me.js
│   ├── conversations/            # Conversation management
│   │   ├── index.js
│   │   └── [id].js
│   ├── rooms/                    # Room management
│   │   ├── index.js
│   │   ├── [id].js
│   │   └── [id]/conversations.js
│   ├── answer.js                 # AI chat (Edge Runtime + Streaming)
│   ├── upload.js                 # File upload
│   ├── analyze-cv.js             # CV analysis
│   └── health.js                 # Health check
├── src/                          # Frontend source
│   ├── components/               # React components
│   ├── contexts/                 # React contexts
│   ├── utils/                    # Utilities
│   └── locales/                  # Translations
├── server/                       # Legacy Express server (for local dev)
├── vercel.json                   # Vercel configuration
├── .env.example                  # Environment variables template
└── VERCEL_DEPLOYMENT.md          # Detailed deployment guide
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key

### Setup

1. **Clone and install dependencies**
```bash
cd CareerBOT
npm install
```

2. **Configure environment variables**
```bash
# Copy the example file
cp .env.example server/.env

# Edit server/.env with your credentials
```

3. **Start development server**
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🌐 Vercel Deployment

### Quick Deploy

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

2. **Import to Vercel**
- Go to https://vercel.com
- Click "Add New Project"
- Import your GitHub repository
- Select `CareerBOT` as root directory

3. **Configure Environment Variables**

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/careerbot
JWT_SECRET=your-secure-random-string-32-chars-min
SESSION_SECRET=your-secure-random-string-32-chars-min
CLIENT_URL=https://your-app.vercel.app
NODE_ENV=production
```

4. **Deploy**
- Click "Deploy"
- Wait for build to complete
- Update `CLIENT_URL` with your actual Vercel URL
- Redeploy

📖 **See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions**

## 🔑 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `OPENAI_MODEL` | Model to use | `gpt-4o-mini` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | Random 32+ char string |
| `SESSION_SECRET` | Session secret | Random 32+ char string |
| `CLIENT_URL` | Frontend URL | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment | `production` |

## 🎨 Features Breakdown

### 1. Streaming Responses (Edge Runtime)
- Uses Vercel Edge Runtime for `/api/answer`
- Implements Server-Sent Events (SSE)
- Bypasses 10-second serverless timeout
- Real-time token-by-token responses

### 2. Guest Mode
- No registration required to try the chatbot
- Cookie-based session tracking
- 10 message limit before signup prompt
- Seamless upgrade to full account

### 3. User Authentication
- JWT tokens stored in HTTP-only cookies
- Secure password hashing with bcryptjs
- Session persistence across page reloads
- Automatic token refresh

### 4. CV Analysis
- Upload PDF, DOCX, or TXT files
- AI-powered CV parsing
- Structured data extraction
- Professional feedback generation

### 5. Conversation Management
- Save unlimited conversations
- Name and organize chats
- Load previous conversations
- Delete unwanted chats

### 6. Room System
- Group up to 5 conversations per room
- Share context across conversations
- Organize by topic or project
- Easy conversation management

## 🛠️ Technology Stack

### Frontend
- React 19
- Vite (build tool)
- TailwindCSS
- Framer Motion (animations)
- React Markdown
- i18next (internationalization)

### Backend
- Vercel Serverless Functions
- Vercel Edge Runtime
- MongoDB (native driver)
- OpenAI API
- JWT authentication
- PDF/DOCX parsing

## 📊 Vercel Free Tier Limits

- **Bandwidth**: 100 GB/month
- **Serverless Execution**: 100 GB-hours/month
- **Edge Execution**: 500,000 requests/month
- **Build Time**: 6,000 minutes/month

The app is optimized to stay within these limits:
- Edge Runtime for chat (no timeout issues)
- Efficient database queries
- Optimized bundle size
- CDN caching for static assets

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has read/write permissions

### Streaming Not Working
- Check browser console for errors
- Verify Edge Runtime is enabled for `/api/answer`
- Test with different browsers (Chrome, Firefox, Safari)

### Environment Variables
- Ensure all required variables are set in Vercel Dashboard
- Check for typos in variable names
- Redeploy after changing variables

## 🔒 Security Features

- ✅ HTTP-only cookies for JWT tokens
- ✅ Password hashing with bcryptjs
- ✅ CSRF protection with SameSite cookies
- ✅ Input validation on all endpoints
- ✅ Rate limiting for guest users
- ✅ Secure environment variable handling
- ✅ No sensitive data in client-side code

## 📈 Performance Optimizations

- ✅ Edge Runtime for AI responses (no cold starts)
- ✅ Code splitting with Vite
- ✅ Lazy loading of components
- ✅ Optimized bundle size
- ✅ CDN caching for static assets
- ✅ Efficient database queries
- ✅ Streaming responses (lower latency)

## 🧪 Testing

### Local Testing
```bash
# Start dev server
npm run dev

# Test in browser
open http://localhost:5173
```

### Production Testing
1. Test guest mode
2. Create account
3. Test chat functionality
4. Upload a CV
5. Create conversations
6. Create rooms
7. Test logout/login

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get user profile
- `PUT /api/auth/me` - Update user profile

### Chat
- `POST /api/answer` - AI chat (streaming)
- `POST /api/upload` - Upload file
- `POST /api/analyze-cv` - Analyze CV

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/[id]` - Get conversation
- `PUT /api/conversations/[id]` - Add message
- `PATCH /api/conversations/[id]` - Update name
- `DELETE /api/conversations/[id]` - Delete conversation

### Rooms
- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/[id]` - Get room
- `PATCH /api/rooms/[id]` - Update room name
- `DELETE /api/rooms/[id]` - Delete room
- `POST /api/rooms/[id]/conversations` - Add conversation to room

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini API
- Vercel for hosting platform
- MongoDB Atlas for database
- React team for the framework

---

**Ready to deploy?** Follow the [Deployment Guide](./VERCEL_DEPLOYMENT.md)

**Need help?** Check the troubleshooting section or Vercel logs
