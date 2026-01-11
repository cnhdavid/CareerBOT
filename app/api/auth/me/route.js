import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }

    await connectDB();
    
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }
    
    return NextResponse.json({
      authenticated: true,
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
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: "Error fetching user"
    });
  }
}

export async function PUT(request) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    await connectDB();

    const formData = await request.formData();
    const updateData = {};

    const fields = [
      'email', 'password', 'name', 'surname', 'birthday', 'targetPosition', 'cvText',
      'phone', 'address', 'city', 'country', 'postalCode', 'linkedin', 'github', 
      'portfolio', 'summary', 'skills', 'languages', 'certifications', 'references'
    ];

    fields.forEach(field => {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        if (field === 'birthday' && value) {
          updateData[field] = new Date(value);
        } else if (field === 'password' && value === '') {
          return;
        } else {
          updateData[field] = value;
        }
      }
    });

    const experience = formData.get('experience');
    if (experience) {
      updateData.experience = JSON.parse(experience);
    }

    const education = formData.get('education');
    if (education) {
      updateData.education = JSON.parse(education);
    }

    const cvFile = formData.get('cvFile');
    if (cvFile && cvFile.size > 0) {
      updateData.cvFile = cvFile.name;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
      return NextResponse.json(
        { error: validationMessages || error.message },
        { status: 400 }
      );
    }
    if (error.name === "MongoServerError" && error.code === 11000) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error updating user" },
      { status: 500 }
    );
  }
}
