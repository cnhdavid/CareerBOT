# CareerBOT

A React + Vite career guidance application with MongoDB authentication and OpenAI integration.

## Features

- **AI-Powered Career Guidance**: Personalized advice using OpenAI's advanced language models
- **Secure Authentication**: Industry-standard HTTP-only secure cookies
- **CV Analysis**: Upload and analyze resumes/CVs for automatic profile population
- **Profile Management**: Comprehensive career profile with experience, education, and skills
- **Conversation History**: Persistent chat history with conversation management
- **Room Organization**: Group conversations into themed rooms
- **Dark/Light Theme**: Responsive design with theme switching
- **Mobile Responsive**: Optimized for all device sizes
- **Data Privacy**: Transparent AI usage disclaimer and privacy controls

## Setup

### 1. Install Dependencies

```bash
npm install
cd server
npm install
```

### 2. Configure Environment

Create a `.env` file in the `server` directory:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/careerbot?retryWrites=true&w=majority

# Authentication Configuration
JWT_SECRET=your-secret-key-change-in-production

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Optional: Client URL for CORS (defaults to http://localhost:5173)
CLIENT_URL=http://localhost:5173
```

**To get your MongoDB connection string:**
- Go to MongoDB Atlas
- Click "Connect" on your cluster
- Choose "Connect your application"
- Copy connection string
- Replace `<password>` with your database password
- Replace `<database-name>` with your database name (e.g., `careerbot`)

**To get your OpenAI API key:**
- Go to [OpenAI Platform](https://platform.openai.com/)
- Navigate to API Keys
- Create a new API key
- Copy the key for use in `.env`

### 3. Run Application

From the root directory:

```bash
npm run dev
```

This will start both the frontend (Vite) and backend (Express) servers.

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

## Project Structure

```
careerbot/
├── src/                          # React frontend
│   ├── components/                 # React components
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Chat.jsx
│   │   ├── OpenAIDisclaimer.jsx
│   │   └── ...
│   ├── contexts/                   # React contexts
│   │   └── AuthContext.jsx
│   └── utils/                      # Utility functions
└── server/                        # Express backend
    ├── models/                     # MongoDB models
    │   └── User.mjs
    ├── routes/                      # API routes
    │   ├── auth.mjs
    │   ├── conversations.mjs
    │   └── rooms.mjs
    ├── db.mjs                     # Database connection
    └── index.mjs                   # Main server file
```

## Development

### Environment Variables
- `NODE_ENV`: Set to 'production' for production security settings
- `CLIENT_URL`: Frontend URL for CORS configuration

### Security Notes
- JWT secret should be changed in production
- Use HTTPS in production for secure cookies
- Regularly update dependencies for security patches
- Monitor OpenAI API usage and costs

## Privacy & Compliance

- **AI Usage Disclaimer**: Users must consent before using AI features
- **Data Rights**: Users can delete, export, or modify their data
- **Transparent Processing**: Clear explanation of how AI processes user data
- **Minimal Data Collection**: Only collect necessary information for service functionality
