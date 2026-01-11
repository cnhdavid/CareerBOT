import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Conversation from "@/lib/models/Conversation";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request, { params }) {
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
    const conversation = await Conversation.findOne({
      _id: id,
      userId,
    });
    
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json(
      { error: "Error fetching conversation" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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
    const { role, content } = await request.json();
    
    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, userId },
      {
        $push: { messages: { role, content } },
        updatedAt: Date.now(),
      },
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
    console.error("Update conversation error:", error);
    return NextResponse.json(
      { error: "Error updating conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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
    const conversation = await Conversation.findOneAndDelete({
      _id: id,
      userId,
    });
    
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json(
      { error: "Error deleting conversation" },
      { status: 500 }
    );
  }
}
