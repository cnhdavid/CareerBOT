import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Room from "@/lib/models/Room";
import Conversation from "@/lib/models/Conversation";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(request, { params }) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      console.error("Remove conversation failed: No userId found");
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { id, conversationId } = await params;
    
    console.log("Removing conversation", conversationId, "from room", id);
    
    const room = await Room.findOne({ _id: id, userId });
    
    if (!room) {
      console.error("Room not found or unauthorized:", id);
      return NextResponse.json(
        { error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    // Remove conversation from room
    room.conversationIds = room.conversationIds.filter(
      convId => convId.toString() !== conversationId
    );
    room.updatedAt = Date.now();
    await room.save();

    // Remove roomId from conversation
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (conversation) {
      conversation.roomId = undefined;
      await conversation.save();
    }
    
    console.log("Conversation removed from room successfully");
    
    const updatedRoom = await Room.findById(id).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });
    
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("Remove conversation from room error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Error removing conversation from room", details: error.message },
      { status: 500 }
    );
  }
}
