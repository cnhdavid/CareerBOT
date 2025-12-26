import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.mjs";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
      console.error("MongoDB not connected. Connection state:", states[mongoose.connection.readyState] || mongoose.connection.readyState);
      
      // Check if password placeholder is still there
      const mongoURI = process.env.MONGODB_URI || "";
      if (mongoURI.includes("<db_password>")) {
        return res.status(503).json({ 
          error: "Database connection failed. Please replace <db_password> with your actual MongoDB password in server/.env file" 
        });
      }
      
      return res.status(503).json({ 
        error: "Database not connected. Please check your MongoDB connection string in server/.env and check server console for connection errors" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Create new user
    console.log("Creating new user with email:", email);
    const user = new User({ email, password });
    console.log("User object created, attempting to save...");
    await user.save();
    console.log("User saved successfully with ID:", user._id);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    
    // Handle specific MongoDB errors
    if (error.name === "MongoServerError" && error.code === 11000) {
      return res.status(400).json({ error: "User already exists with this email" });
    }
    
    if (error.name === "ValidationError") {
      const validationMessages = Object.values(error.errors || {}).map(e => e.message).join(", ");
      return res.status(400).json({ error: validationMessages || error.message });
    }

    // Handle MongoDB connection errors
    if (error.name === "MongoNetworkError" || error.name === "MongooseError") {
      return res.status(503).json({ 
        error: "Database connection error. Please check your MongoDB connection string and ensure the database is accessible." 
      });
    }

    // Return detailed error message
    const errorMessage = error.message || "Error creating user";
    console.error("Returning error to client:", errorMessage);
    
    res.status(500).json({ error: errorMessage });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: "Database not connected. Please check your MongoDB connection string in server/.env" 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error.message 
      : "Error during login. Please check server logs for details.";
    res.status(500).json({ error: errorMessage });
  }
});

// Verify token middleware (optional, for protected routes)
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Get current user route (optional)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
});

export default router;

