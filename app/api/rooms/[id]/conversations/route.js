import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Room from "@/lib/models/Room";
import Conversation from "@/lib/models/Conversation";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request, { params }) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      console.error("Add conversation failed: No userId found");
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const { conversationId } = await request.json();
    
    if (!conversationId) {
      console.error("Add conversation failed: No conversationId provided");
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }
    
    console.log("Adding conversation", conversationId, "to room", id);
    
    const room = await Room.findOne({ _id: id, userId });
    
    if (!room) {
      console.error("Room not found or unauthorized:", id);
      return NextResponse.json(
        { error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if conversation exists and belongs to user
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    
    if (!conversation) {
      console.error("Conversation not found or unauthorized:", conversationId);
      return NextResponse.json(
        { error: "Conversation not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if room already has 5 conversations
    if (room.conversationIds.length >= 5) {
      console.error("Room full: Maximum 5 conversations");
      return NextResponse.json(
        { error: "Maximum 5 conversations per room" },
        { status: 400 }
      );
    }

    // Check if conversation is already in room
    if (room.conversationIds.includes(conversationId)) {
      console.error("Conversation already in room");
      return NextResponse.json(
        { error: "Conversation already in this room" },
        { status: 400 }
      );
    }

    // Add conversation to room
    room.conversationIds.push(conversationId);
    room.updatedAt = Date.now();
    await room.save();

    // Update conversation with roomId
    conversation.roomId = id;
    await conversation.save();
    
    console.log("Conversation added to room successfully");
    
    const updatedRoom = await Room.findById(id).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });
    
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("Add conversation to room error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Error adding conversation to room", details: error.message },
      { status: 500 }
    );
  }
}
