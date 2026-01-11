/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return true;
  }

  const MONGODB_URI = process.env.MONGODB_URI || '';
  
  try {
    if (!MONGODB_URI) {
      console.warn("⚠️  MONGODB_URI not set in .env file.");
      console.warn("⚠️  Please create .env.local file with your MongoDB connection string.");
      console.warn("⚠️  Server will start, but authentication will not work.");
      return false;
    }

    if (MONGODB_URI.includes("<db_password>")) {
      console.error("❌ MONGODB_URI contains <db_password> placeholder!");
      console.error("⚠️  Please replace <db_password> with your actual MongoDB password in .env.local");
      return false;
    }

    const maskedURI = MONGODB_URI.replace(/:[^:@]+@/, ":****@");
    console.log("🔌 Attempting to connect to MongoDB...");
    console.log("🔌 Connection string:", maskedURI);
    
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
    
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
      isConnected = false;
    });
    
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connection established");
      isConnected = true;
    });
    
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    if (error.message.includes("authentication failed") || error.message.includes("Authentication failed")) {
      console.error("⚠️  Authentication failed. Check your username and password in MONGODB_URI");
      console.error("⚠️  Make sure you replaced <db_password> with your actual password");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
      console.error("⚠️  Could not resolve hostname. Check your cluster URL in MONGODB_URI");
    } else if (error.message.includes("IP") || error.message.includes("whitelist")) {
      console.error("⚠️  IP address not whitelisted. Add your IP address in MongoDB Atlas Network Access");
    } else {
      console.error("⚠️  Error details:", error.message);
      console.error("⚠️  Please check your MONGODB_URI in .env.local file");
    }
    console.error("⚠️  Server will start, but authentication will not work until MongoDB is connected.");
    isConnected = false;
    return false;
  }
}
