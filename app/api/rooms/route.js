import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Room from "@/lib/models/Room";
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
    
    const rooms = await Room.find({ userId })
      .sort({ updatedAt: -1 })
      .populate({
        path: 'conversationIds',
        select: 'name messages createdAt updatedAt roomId',
        options: { sort: { updatedAt: -1 } }
      });
    
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Get rooms error:", error);
    return NextResponse.json(
      { error: "Error fetching rooms" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      console.error("Room creation failed: No userId found");
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    console.log("Creating room for userId:", userId);
    await connectDB();
    
    const { name } = await request.json();
    if (!name || name.trim() === '') {
      console.error("Room creation failed: Empty name");
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    const room = new Room({
      userId,
      name: name.trim(),
      conversationIds: [],
    });
    
    console.log("Saving room:", room);
    await room.save();
    console.log("Room saved successfully:", room._id);
    
    const savedRoom = await Room.findById(room._id).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });
    
    console.log("Room populated successfully");
    return NextResponse.json(savedRoom, { status: 201 });
  } catch (error) {
    console.error("Create room error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    
    if (error.message.includes("Maximum 5 conversations")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Error creating room", details: error.message },
      { status: 500 }
    );
  }
}
