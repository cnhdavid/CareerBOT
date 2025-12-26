# CareerBOT

A React + Vite application with MongoDB authentication.

## Setup

### 1. Install Dependencies

```bash
npm install
cd server
npm install
```

### 2. Configure MongoDB

1. Create a `.env` file in the `server` directory
2. Add your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/careerbot?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

**To get your MongoDB connection string:**
- Go to MongoDB Atlas
- Click "Connect" on your cluster
- Choose "Connect your application"
- Copy the connection string
- Replace `<password>` with your database password
- Replace `<database-name>` with your database name (e.g., `careerbot`)

### 3. Run the Application

From the root directory:

```bash
npm run dev
```

This will start both the frontend (Vite) and backend (Express) servers.

## Authentication

The application includes:
- User signup with email and password
- User login
- JWT token-based authentication
- Protected routes (main app only accessible when logged in)
- User email display in sidebar
- Logout functionality

## Project Structure

- `src/` - React frontend
  - `components/` - React components (Login, Signup, Chat, etc.)
  - `contexts/` - React contexts (AuthContext)
- `server/` - Express backend
  - `models/` - MongoDB models (User)
  - `routes/` - API routes (auth)
  - `db.mjs` - MongoDB connection
