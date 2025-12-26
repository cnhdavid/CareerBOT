import mongoose from "mongoose";

export async function connectDB() {
  // Read MONGODB_URI inside the function to ensure dotenv.config() has been called
  const MONGODB_URI = process.env.MONGODB_URI;
  
  try {
    if (!MONGODB_URI) {
      console.warn("⚠️  MONGODB_URI not set in .env file.");
      console.warn("⚠️  Please create server/.env file with your MongoDB connection string.");
      console.warn("⚠️  Server will start, but authentication will not work.");
      return false;
    }

    // Check if password placeholder is still there
    if (MONGODB_URI.includes("<db_password>")) {
      console.error("❌ MONGODB_URI contains <db_password> placeholder!");
      console.error("⚠️  Please replace <db_password> with your actual MongoDB password in server/.env");
      return false;
    }

    // Show connection attempt (but hide the actual password)
    const maskedURI = MONGODB_URI.replace(/:[^:@]+@/, ":****@");
    console.log("🔌 Attempting to connect to MongoDB...");
    console.log("🔌 Connection string:", maskedURI);
    
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
    console.log("📊 Connection state:", mongoose.connection.readyState === 1 ? "Connected" : "Not connected");
    
    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });
    
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connection established");
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
      console.error("⚠️  Please check your MONGODB_URI in server/.env file");
    }
    console.error("⚠️  Server will start, but authentication will not work until MongoDB is connected.");
    return false;
  }
}

