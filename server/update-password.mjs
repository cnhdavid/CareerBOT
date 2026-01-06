import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { connectDB } from "./db.mjs";

// Load environment variables
const envPath = new URL("./.env", import.meta.url);
dotenv.config({ path: envPath });

const email = "dadi.jovanovic@gmail.com";
const newPassword = "mypassword123";

async function updatePassword() {
  try {
    // Connect to DB
    const connected = await connectDB();
    if (!connected) {
      console.error("Failed to connect to DB");
      return;
    }

    // Define User schema (same as in User.mjs)
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true, minlength: 6 },
      createdAt: { type: Date, default: Date.now },
    });

    // Hash password before saving
    userSchema.pre("save", async function () {
      if (!this.isModified("password")) return;
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    });

    const User = mongoose.model("User", userSchema);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found");
      return;
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    console.log("Password updated successfully for", email);
  } catch (error) {
    console.error("Error updating password:", error);
  } finally {
    mongoose.connection.close();
  }
}

updatePassword();