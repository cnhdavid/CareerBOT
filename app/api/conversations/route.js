import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Conversation from "@/lib/models/Conversation";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .select("name messages createdAt updatedAt");
    
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "Error fetching conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    await connectDB();
    
    let { title } = await request.json().catch(() => ({}));
    
    const conversation = new Conversation({
      userId,
      name: title || "New Conversation",
      messages: [],
    });
    await conversation.save();
    
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Error creating conversation" },
      { status: 500 }
    );
  }
}
