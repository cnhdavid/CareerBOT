import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Room from "@/lib/models/Room";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request, { params }) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      console.error("Room name update failed: No userId found");
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      console.error("Room name update failed: Empty name");
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }
    
    console.log("Updating room name:", id, "to:", name);
    
    const room = await Room.findOne({ _id: id, userId });
    
    if (!room) {
      console.error("Room not found or unauthorized:", id);
      return NextResponse.json(
        { error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    room.name = name.trim();
    room.updatedAt = Date.now();
    await room.save();
    
    console.log("Room name updated successfully:", id);
    
    const updatedRoom = await Room.findById(id).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });
    
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("Update room name error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Error updating room name", details: error.message },
      { status: 500 }
    );
  }
}
