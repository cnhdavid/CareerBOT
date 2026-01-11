import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Conversation from "@/lib/models/Conversation";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request, { params }) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const { name } = await request.json();
    
    if (name === undefined) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, userId },
      { name, updatedAt: Date.now() },
      { new: true }
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Update conversation name error:", error);
    return NextResponse.json(
      { error: "Error updating conversation name" },
      { status: 500 }
    );
  }
}
