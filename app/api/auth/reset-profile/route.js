import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Reset all profile fields except email and password
    const resetData = {
      name: "",
      surname: "",
      birthday: null,
      targetPosition: "",
      cvText: "",
      cvFile: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      postalCode: "",
      linkedin: "",
      github: "",
      portfolio: "",
      summary: "",
      experience: [{
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        description: ""
      }],
      education: [{
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: ""
      }],
      skills: "",
      languages: "",
      certifications: "",
      references: ""
    };

    console.log('[Profile Reset] Resetting profile for user:', userId);

    const user = await User.findByIdAndUpdate(
      userId, 
      resetData, 
      { new: true }
    ).select("-password");

    if (!user) {
      console.log('[Profile Reset] User not found:', userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log('[Profile Reset] Profile reset successfully');

    return NextResponse.json({
      success: true,
      message: "Profile reset successfully. Email and password were preserved.",
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
    console.error('[Profile Reset] Error:', error);
    console.error('[Profile Reset] Error stack:', error.stack);
    
    return NextResponse.json(
      { error: `Error resetting profile: ${error.message}` },
      { status: 500 }
    );
  }
}
