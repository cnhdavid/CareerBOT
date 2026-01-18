# CareerBOT

AI-powered career guidance chatbot built with Next.js, React, and OpenAI.

## 🚀 Features

- **AI-Powered Career Guidance**: Personalized advice using OpenAI GPT-4o-mini
- **Guest Mode**: Try the chatbot without signing up
- **Secure Authentication**: JWT-based auth with HTTP-only cookies
- **CV Analysis**: Upload and analyze resumes (PDF, DOCX, TXT)
- **Profile Management**: Comprehensive career profile with experience and education
- **Conversation Management**: Save and organize chat history
- **Room System**: Group related conversations 
- **Job Matching**: Semantic job search and matching based on profile
- **Interview Preparation**: AI-powered interview question generation and review
- **File Upload**: Document analysis with AI feedback
- **Input Validation**: Comprehensive profanity filtering and content moderation
- **Multi-language Support**: i18n (German/English)
- **Theme Support**: Dark/light mode with system preference detection
- **Mobile Responsive**: Optimized for all device sizes
- **SSR Ready**: Server-side rendering with Next.js

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (free tier works)
- OpenAI API key

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the **root directory**:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/careerbot?retryWrites=true&w=majority

# Authentication Secrets (generate random strings)
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
SESSION_SECRET=guest-session-secret-change-in-production

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Environment
NODE_ENV=development
```

**Important Notes:**
- File must be named `.env.local` (not `.env`)
- Must be in the root directory (not in a `server/` folder)
- Replace `<password>` in MongoDB URI with your actual password
- Generate strong secrets: `openssl rand -base64 32`

**Getting Your Credentials:**

**MongoDB Atlas:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy connection string
5. Replace `<password>` with your database password
6. Add your IP to Network Access (or use `0.0.0.0/0` for development)

**OpenAI API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys
3. Create new secret key
4. Copy the key (starts with `sk-`)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note:** The app runs on port 3000 (not 5173). All API routes are at `/api/*`.

## Authentication & Security

The application implements industry-standard security practices:

- **HTTP-Only Secure Cookies**: Prevents XSS attacks and client-side access
- **CSRF Protection**: SameSite strict policy
- **Secure Transmission**: HTTPS-only cookies in production
- **JWT Backend**: Secure token-based authentication with 7-day expiration
- **Data Privacy**: Comprehensive AI usage disclaimer and user consent

### Authentication Flow:
1. User registers/logs in via email and password
2. Server sets HTTP-only secure cookie with JWT token
3. Client automatically includes cookie in all API requests
4. Server validates cookie for protected routes
5. Logout clears the authentication cookie

## AI Integration

CareerBOT uses OpenAI's API for:
- **Career Advice**: Personalized guidance based on user profile
- **CV Analysis**: Automatic extraction of professional information
- **Conversation Context**: Maintains context across sessions
- **Topic Detection**: Identifies career-related topics

### Data Processing:
- Conversations processed by OpenAI for response generation
- Profile data used for personalized recommendations
- File uploads analyzed for content extraction
- No sensitive personal data stored unnecessarily

## 📁 Project Structure

```
CareerBOT/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Backend)
│   │   ├── auth/                # Authentication endpoints
│   │   │   ├── signup/route.js
│   │   │   ├── login/route.js
│   │   │   ├── logout/route.js
│   │   │   └── me/route.js
│   │   ├── conversations/       # Conversation management
│   │   ├── rooms/              # Room management
│   │   ├── answer/route.js     # Chat AI endpoint
│   │   ├── analyze-cv/route.js # CV analysis
│   │   └── upload/route.js     # File upload
│   ├── globals.css             # Global styles
│   ├── layout.js               # Root layout with providers
│   └── page.js                 # Home page
├── lib/                         # Shared utilities
│   ├── models/                 # Mongoose models
│   │   ├── User.js
│   │   ├── Conversation.js
│   │   ├── Room.js
│   │   └── File.js
│   ├── db.js                   # Database connection
│   ├── auth.js                 # Auth utilities
│   ├── constants.js            # System prompts
│   ├── inputValidation.js      # Input validation & profanity filter
│   ├── mockJobs.js             # Mock job data for testing
│   └── generateConversationTitle.js  # Auto-generate conversation titles
├── src/                         # React components
│   ├── components/             # UI components
│   │   ├── Chat.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   ├── ProfileModal.jsx
│   │   ├── RoomsModal.jsx
│   │   ├── ConversationsModal.jsx
│   │   ├── SettingsModal.jsx
│   │   ├── InterviewModal.jsx
│   │   ├── DiscoverModal.jsx
│   │   ├── SemanticJobMatcher.jsx
│   │   ├── RoomContextViewer.jsx
│   │   ├── ResourcesPanel.jsx
│   │   ├── OpenAIDisclaimer.jsx
│   │   ├── GuestModeIndicator.jsx
│   │   ├── SignupCTA.jsx
│   │   ├── ScoreBreakdownChart.jsx
│   │   └── NavItem.jsx
│   ├── contexts/               # React contexts
│   │   └── AuthContext.jsx
│   ├── hooks/                  # Custom hooks
│   └── utils/                  # Utility functions
├── public/                      # Static assets
├── .env.local                  # Environment variables
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind CSS config
└── vercel.json                 # Vercel deployment config
```

## 🔌 API Routes

All API routes are accessible at `/api/*`:

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/me` - Get current user (supports guest mode)
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/reset-profile` - Reset user profile data

### Conversations
- `GET /api/conversations` - List all conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/[id]` - Get specific conversation
- `PUT /api/conversations/[id]` - Add message to conversation
- `DELETE /api/conversations/[id]` - Delete conversation
- `PATCH /api/conversations/[id]/name` - Update conversation name

### Chat & Analysis
- `POST /api/answer` - Send message to AI (supports guest mode)
- `POST /api/upload` - Upload and analyze document
- `POST /api/upload-file` - Upload file to room
- `POST /api/analyze-cv` - Analyze CV/resume

### Rooms
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/[id]` - Get specific room
- `PUT /api/rooms/[id]` - Update room details
- `DELETE /api/rooms/[id]` - Delete room
- `POST /api/rooms/[id]/files` - Upload files to room

### Job Matching
- `POST /api/match-jobs` - Match jobs to user profile using semantic search
- `POST /api/jobApi` - Fetch jobs from external API
- `POST /api/generate-job-filters` - Generate job search filters

### Interview Preparation
- `POST /api/interview/generate` - Generate interview questions
- `POST /api/interview/review` - Review interview answers
- `GET /api/interview/review/[id]` - Get interview review results

### System
- `GET /api/health` - Health check endpoint

## 🚀 Deployment to Vercel

### Quick Deploy

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables:**
   In Vercel dashboard, add:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (set to `gpt-4o-mini`)
   - `NODE_ENV` (set to `production`)

4. **Deploy:**
   Click "Deploy" and Vercel will build and deploy your app

### Continuous Deployment

Every push to `main` automatically deploys to production.
Pull requests get preview deployments.

### Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate is automatically provisioned

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React 19, Framer Motion, Lucide React (icons)
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **AI**: OpenAI GPT-4o-mini
- **Auth**: JWT with HTTP-only cookies
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **File Processing**: PDF Parse, Mammoth (DOCX), PDF2JSON
- **Content Moderation**: Bad-words, Naughty-words
- **Markdown**: React-Markdown with Remark-GFM
- **Deployment**: Vercel

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT tokens (min 32 chars) |
| `SESSION_SECRET` | Yes | Secret for sessions |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_MODEL` | No | OpenAI model (default: gpt-4o-mini) |
| `NODE_ENV` | No | Environment (development/production) |

### Security Notes

- JWT and session secrets should be strong random strings
- Use HTTPS in production for secure cookies
- MongoDB IP whitelist should include Vercel IPs in production
- Regularly update dependencies for security patches
- Monitor OpenAI API usage and set spending limits

## 🧪 Testing

### Test Authentication

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user
curl http://localhost:3000/api/auth/me
```

### Test Chat

```bash
curl -X POST http://localhost:3000/api/answer \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify `.env.local` exists in root directory
- Check `MONGODB_URI` doesn't contain `<db_password>` placeholder
- Whitelist your IP in MongoDB Atlas Network Access

### API Routes Return 404
- Ensure files are in `app/api/` directory
- File names must be `route.js` (not `index.js`)
- Restart dev server: `npm run dev`

### Build Errors
```bash
# Clear Next.js cache
Remove-Item -Path ".next" -Recurse -Force
npm run build
```

### localStorage Errors
All browser API access is protected with `typeof window !== 'undefined'` checks.
If you see localStorage errors, ensure components using it are client components.

## 📝 Privacy & Compliance

- **AI Usage Disclaimer**: Users must consent before using AI features
- **Guest Mode**: Try features without creating an account
- **Data Rights**: Users can view, update, or delete their data
- **Transparent Processing**: Clear explanation of how AI processes data
- **Minimal Data Collection**: Only collect necessary information
- **Secure Storage**: Passwords hashed with bcrypt, sensitive data encrypted

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OpenAI for GPT API
- Vercel for hosting platform
- MongoDB Atlas for database
- Next.js team for the framework

## 📞 Support

For issues and questions:
- Check troubleshooting section above
- Review Next.js documentation
- Open an issue on GitHub
