import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import User from "../models/User.mjs";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const upload = multer({ dest: 'uploads/' });

// Cookie options for production-grade security
const cookieOptions = {
  httpOnly: true, // Prevents client-side JavaScript access
  secure: process.env.NODE_ENV === 'production', // Only sent over HTTPS in production
  sameSite: 'strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Set authentication cookie
const setAuthCookie = (res, token) => {
  res.cookie('auth_token', token, cookieOptions);
};

// Clear authentication cookie
const clearAuthCookie = (res) => {
  res.clearCookie('auth_token', { path: '/' });
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
    
    // Set HTTP-only secure cookie
    setAuthCookie(res, token);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        birthday: user.birthday,
        targetPosition: user.targetPosition,
        cvText: user.cvText,
        cvFile: user.cvFile,
        // CV Form Fields
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        postalCode: user.postalCode,
        linkedin: user.linkedin,
        github: user.github,
        portfolio: user.portfolio,
        summary: user.summary,
        experience: user.experience,
        education: user.education,
        skills: user.skills,
        languages: user.languages,
        certifications: user.certifications,
        references: user.references,
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
    console.log("Attempting to compare password for user:", user.email);
    console.log("Stored password hash:", user.password);
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password comparison result:", isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user._id);
    
    // Set HTTP-only secure cookie
    setAuthCookie(res, token);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        birthday: user.birthday,
        targetPosition: user.targetPosition,
        cvText: user.cvText,
        cvFile: user.cvFile,
        // CV Form Fields
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        postalCode: user.postalCode,
        linkedin: user.linkedin,
        github: user.github,
        portfolio: user.portfolio,
        summary: user.summary,
        experience: user.experience,
        education: user.education,
        skills: user.skills,
        languages: user.languages,
        certifications: user.certifications,
        references: user.references,
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

// Verify token middleware (updated to check cookies first, then headers)
export const authenticateToken = (req, res, next) => {
  // Check for token in cookie first (more secure)
  let token = req.cookies?.auth_token;
  
  // Fallback to Authorization header for backward compatibility
  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
  }

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

// Logout route
router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logout successful" });
});

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
        name: user.name,
        surname: user.surname,
        birthday: user.birthday,
        targetPosition: user.targetPosition,
        cvText: user.cvText,
        cvFile: user.cvFile,
        // New CV fields
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        postalCode: user.postalCode,
        linkedin: user.linkedin,
        github: user.github,
        portfolio: user.portfolio,
        summary: user.summary,
        experience: user.experience,
        education: user.education,
        skills: user.skills,
        languages: user.languages,
        certifications: user.certifications,
        references: user.references,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
});

// Update user profile route
router.put("/me", authenticateToken, upload.single('cvFile'), async (req, res) => {
  try {
    const { 
      email, password, name, surname, birthday, targetPosition, cvText, cvFile,
      // New CV form fields
      phone, address, city, country, postalCode, linkedin, github, portfolio, summary,
      experience, education, skills, languages, certifications, references
    } = req.body;

    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (password !== undefined && password !== "") updateData.password = password;
    if (name !== undefined) updateData.name = name;
    if (surname !== undefined) updateData.surname = surname;
    if (birthday !== undefined) updateData.birthday = birthday ? new Date(birthday) : null;
    if (targetPosition !== undefined) updateData.targetPosition = targetPosition;
    if (cvText !== undefined) updateData.cvText = cvText;
    if (req.file) updateData.cvFile = req.file.filename;
    
    // New CV fields
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (github !== undefined) updateData.github = github;
    if (portfolio !== undefined) updateData.portfolio = portfolio;
    if (summary !== undefined) updateData.summary = summary;
    if (experience !== undefined) updateData.experience = experience ? JSON.parse(experience) : [];
    if (education !== undefined) updateData.education = education ? JSON.parse(education) : [];
    if (skills !== undefined) updateData.skills = skills;
    if (languages !== undefined) updateData.languages = languages;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (references !== undefined) updateData.references = references;

    const user = await User.findByIdAndUpdate(req.userId, updateData, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        birthday: user.birthday,
        targetPosition: user.targetPosition,
        cvText: user.cvText,
        cvFile: user.cvFile,
        // New CV fields
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        postalCode: user.postalCode,
        linkedin: user.linkedin,
        github: user.github,
        portfolio: user.portfolio,
        summary: user.summary,
        experience: user.experience,
        education: user.education,
        skills: user.skills,
        languages: user.languages,
        certifications: user.certifications,
        references: user.references,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    if (error.name === "ValidationError") {
      const validationMessages = Object.values(error.errors || {}).map(e => e.message).join(", ");
      return res.status(400).json({ error: validationMessages || error.message });
    }
    if (error.name === "MongoServerError" && error.code === 11000) {
      return res.status(400).json({ error: "Email already in use" });
    }
    res.status(500).json({ error: "Error updating user" });
  }
});

export default router;

