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
      return NextResponse.json(
        { error: "Database not connected. Please check your MongoDB connection string in .env.local" },
        { status: 503 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log("Attempting to compare password for user:", user.email);
    console.log("Stored password hash:", user.password);
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password comparison result:", isPasswordValid);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = generateToken(user._id);
    
    const response = NextResponse.json({
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

    response.cookies.set('auth_token', token, cookieOptions);
    
    return response;
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error.message 
      : "Error during login. Please check server logs for details.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
