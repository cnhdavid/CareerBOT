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

    // Parse JSON body instead of FormData
    const data = await request.json();
    const updateData = {};

    console.log('[Profile Update] Received data:', Object.keys(data));

    const fields = [
      'email', 'password', 'name', 'surname', 'birthday', 'targetPosition', 'cvText', 'cvFile',
      'phone', 'address', 'city', 'country', 'postalCode', 'linkedin', 'github', 
      'portfolio', 'summary', 'skills', 'languages', 'certifications', 'references'
    ];

    fields.forEach(field => {
      const value = data[field];
      if (value !== null && value !== undefined && value !== '') {
        if (field === 'birthday' && value) {
          updateData[field] = new Date(value);
        } else if (field === 'password' && value === '') {
          // Skip empty password
          return;
        } else {
          updateData[field] = value;
        }
      }
    });

    // Handle experience - already parsed JSON from frontend
    if (data.experience) {
      if (typeof data.experience === 'string') {
        updateData.experience = JSON.parse(data.experience);
      } else {
        updateData.experience = data.experience;
      }
    }

    // Handle education - already parsed JSON from frontend
    if (data.education) {
      if (typeof data.education === 'string') {
        updateData.education = JSON.parse(data.education);
      } else {
        updateData.education = data.education;
      }
    }

    console.log('[Profile Update] Update data fields:', Object.keys(updateData));

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
    if (!user) {
      console.log('[Profile Update] User not found:', userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log('[Profile Update] Profile updated successfully');

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
    console.error('[Profile Update] Error:', error);
    console.error('[Profile Update] Error stack:', error.stack);
    
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
      { error: `Error updating user: ${error.message}` },
      { status: 500 }
    );
  }
}
