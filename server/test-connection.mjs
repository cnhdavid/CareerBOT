// Test script to check MongoDB connection
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

console.log("🔍 Testing MongoDB connection...");
console.log("📄 MONGODB_URI loaded:", MONGODB_URI ? "Yes" : "No");

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env file");
  process.exit(1);
}

if (MONGODB_URI.includes("<db_password>")) {
  console.error("❌ MONGODB_URI still contains <db_password> placeholder");
  console.error("⚠️  Please replace <db_password> with your actual password");
  process.exit(1);
}

const maskedURI = MONGODB_URI.replace(/:[^:@]+@/, ":****@");
console.log("🔌 Connection string:", maskedURI);

try {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB connected successfully!");
  console.log("📊 Database name:", mongoose.connection.db.databaseName);
  await mongoose.disconnect();
  console.log("✅ Connection test passed");
  process.exit(0);
} catch (error) {
  console.error("❌ Connection failed:", error.message);
  if (error.message.includes("authentication failed")) {
    console.error("⚠️  Check your username and password");
  } else if (error.message.includes("ENOTFOUND")) {
    console.error("⚠️  Check your cluster URL");
  } else if (error.message.includes("IP") || error.message.includes("whitelist")) {
    console.error("⚠️  Your IP address needs to be whitelisted in MongoDB Atlas");
    console.error("⚠️  Go to: Network Access -> Add IP Address");
  }
  process.exit(1);
}

