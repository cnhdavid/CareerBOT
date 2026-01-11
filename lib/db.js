/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import mongoose from "mongoose";

// Initialize global cache for Vercel serverless functions
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

let cached = global.mongoose;

export async function connectDB() {
  // Return cached connection if it exists
  if (cached.conn) {
    console.log("✅ Using cached MongoDB connection");
    return cached.conn;
  }

  const MONGODB_URI = process.env.MONGODB_URI || '';
  
  // Validate MONGODB_URI
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not set in environment variables");
    console.error("⚠️  Please add MONGODB_URI to your Vercel environment variables");
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  if (MONGODB_URI.includes("<db_password>")) {
    console.error("❌ MONGODB_URI contains <db_password> placeholder!");
    console.error("⚠️  Please replace <db_password> with your actual MongoDB password");
    throw new Error("MONGODB_URI contains placeholder password");
  }

  // If connection promise doesn't exist, create it
  if (!cached.promise) {
    const maskedURI = MONGODB_URI.replace(/:[^:@]+@/, ":****@");
    console.log("🔌 Attempting to connect to MongoDB...");
    console.log("🔌 Connection string:", maskedURI);

    const opts = {
      bufferCommands: false, // Disable mongoose buffering for serverless
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        
        // Set up event listeners
        mongoose.connection.on("error", (err) => {
          console.error("❌ MongoDB connection error:", err.message);
          cached.conn = null;
          cached.promise = null;
        });
        
        mongoose.connection.on("disconnected", () => {
          console.warn("⚠️  MongoDB disconnected");
          cached.conn = null;
          cached.promise = null;
        });

        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error.message);
        
        // Detailed error messages
        if (error.message.includes("authentication failed") || error.message.includes("Authentication failed")) {
          console.error("⚠️  Authentication failed. Check your username and password in MONGODB_URI");
          console.error("⚠️  Make sure you replaced <db_password> with your actual password");
        } else if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
          console.error("⚠️  Could not resolve hostname. Check your cluster URL in MONGODB_URI");
        } else if (error.message.includes("IP") || error.message.includes("whitelist")) {
          console.error("⚠️  IP address not whitelisted. Add your IP address in MongoDB Atlas Network Access");
        } else {
          console.error("⚠️  Error details:", error.message);
          console.error("⚠️  Please check your MONGODB_URI in environment variables");
        }
        
        // Reset promise so next request can retry
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
