import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { generateToken, cookieOptions } from "@/lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    if (mongoose.connection.readyState !== 1) {
      const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
      console.error("MongoDB not connected. Connection state:", states[mongoose.connection.readyState] || mongoose.connection.readyState);
      
      const mongoURI = process.env.MONGODB_URI || "";
      if (mongoURI.includes("<db_password>")) {
        return NextResponse.json(
          { error: "Database connection failed. Please replace <db_password> with your actual MongoDB password in .env.local file" },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: "Database not connected. Please check your MongoDB connection string in .env.local and check server console for connection errors" },
        { status: 503 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    console.log("Creating new user with email:", email);
    const user = new User({ email, password });
    console.log("User object created, attempting to save...");
    await user.save();
    console.log("User saved successfully with ID:", user._id);

    const token = generateToken(user._id);
    
    const response = NextResponse.json({
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
    }, { status: 201 });

    response.cookies.set('auth_token', token, cookieOptions);
    
    return response;
  } catch (error) {
    console.error("Signup error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    
    if (error.name === "MongoServerError" && error.code === 11000) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }
    
    if (error.name === "ValidationError") {
      const validationMessages = Object.values(error.errors || {}).map(e => e.message).join(", ");
      return NextResponse.json(
        { error: validationMessages || error.message },
        { status: 400 }
      );
    }

    if (error.name === "MongoNetworkError" || error.name === "MongooseError") {
      return NextResponse.json(
        { error: "Database connection error. Please check your MongoDB connection string and ensure the database is accessible." },
        { status: 503 }
      );
    }

    const errorMessage = error.message || "Error creating user";
    console.error("Returning error to client:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
