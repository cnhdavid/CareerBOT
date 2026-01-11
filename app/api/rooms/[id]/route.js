import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Room from "@/lib/models/Room";
import Conversation from "@/lib/models/Conversation";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(request, { params }) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      console.error("Room deletion failed: No userId found");
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    console.log("Deleting room:", id, "for user:", userId);
    
    const room = await Room.findOne({ _id: id, userId });
    
    if (!room) {
      console.error("Room not found or unauthorized:", id);
      return NextResponse.json(
        { error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    // Remove roomId from all conversations in this room
    if (room.conversationIds && room.conversationIds.length > 0) {
      await Conversation.updateMany(
        { _id: { $in: room.conversationIds } },
        { $unset: { roomId: "" } }
      );
      console.log("Removed roomId from conversations");
    }

    await Room.deleteOne({ _id: id });
    console.log("Room deleted successfully:", id);
    
    return NextResponse.json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete room error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Error deleting room", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      console.error("Room update failed: No userId found");
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    console.log("Updating room:", id, "with data:", body);
    
    const room = await Room.findOne({ _id: id, userId });
    
    if (!room) {
      console.error("Room not found or unauthorized:", id);
      return NextResponse.json(
        { error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (body.name !== undefined) {
      room.name = body.name.trim();
    }
    if (body.description !== undefined) {
      room.description = body.description;
    }
    
    room.updatedAt = Date.now();
    await room.save();
    
    console.log("Room updated successfully:", id);
    
    const updatedRoom = await Room.findById(id).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });
    
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("Update room error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Error updating room", details: error.message },
      { status: 500 }
    );
  }
}
