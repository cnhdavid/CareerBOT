import express from "express";
import { authenticateToken } from "./auth.mjs";
import Room from "../models/Room.mjs";
import Conversation from "../models/Conversation.mjs";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all rooms for the user
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .populate({
        path: 'conversationIds',
        select: 'name messages createdAt updatedAt roomId',
        options: { sort: { updatedAt: -1 } }
      });
    res.json(rooms);
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ error: "Error fetching rooms" });
  }
});

// Create a new room
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Room name is required" });
    }

    const room = new Room({
      userId: req.userId,
      name: name.trim(),
      conversationIds: [],
    });
    await room.save();
    
    // Return room with populated conversations (empty in this case)
    const savedRoom = await Room.findById(room._id).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });
    
    res.status(201).json(savedRoom);
  } catch (error) {
    console.error("Create room error:", error);
    if (error.message.includes("Maximum 5 conversations")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Error creating room" });
  }
});

// Get a specific room with its conversations
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json(room);
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({ error: "Error fetching room" });
  }
});

// Update room name
router.patch("/:id/name", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Room name is required" });
    }

    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name: name.trim(), updatedAt: Date.now() },
      { new: true }
    ).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json(room);
  } catch (error) {
    console.error("Update room name error:", error);
    res.status(500).json({ error: "Error updating room name" });
  }
});

// Add conversation to room
router.post("/:id/conversations", async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }

    // Verify room belongs to user
    const room = await Room.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Check if conversation has any content (name or messages)
    if (!conversation.name && (!conversation.messages || conversation.messages.length === 0)) {
      return res.status(400).json({ error: "Cannot add empty conversation to room" });
    }

    // Check room limit
    if (room.conversationIds.length >= 5) {
      return res.status(400).json({ error: "Maximum 5 conversations allowed per room" });
    }

    // Check if conversation already in room
    if (room.conversationIds.includes(conversationId)) {
      return res.status(400).json({ error: "Conversation already in room" });
    }

    // Add conversation to room
    room.conversationIds.push(conversationId);
    await room.save();

    // Update conversation to reference room
    conversation.roomId = room._id;
    await conversation.save();

    // Return room with populated conversations
    const updatedRoom = await Room.findById(room._id).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });

    res.json(updatedRoom);
  } catch (error) {
    console.error("Add conversation to room error:", error);
    if (error.message.includes("Maximum 5 conversations")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Error adding conversation to room" });
  }
});

// Remove conversation from room
router.delete("/:id/conversations/:conversationId", async (req, res) => {
  try {
    const { id, conversationId } = req.params;
    
    // Validate parameters
    if (!id || !conversationId) {
      return res.status(400).json({ error: "Room ID and Conversation ID are required" });
    }
    
    console.log("Removing conversation from room:", { roomId: id, conversationId });

    const room = await Room.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Remove conversation from room
    room.conversationIds = room.conversationIds.filter(
      id => id.toString() !== conversationId
    );
    await room.save();

    // Update conversation to remove room reference
    await Conversation.findOneAndUpdate(
      { _id: conversationId, userId: req.userId },
      { roomId: null }
    );

    // Return room with populated conversations
    const updatedRoom = await Room.findById(room._id).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });

    res.json(updatedRoom);
  } catch (error) {
    console.error("Remove conversation from room error:", error);
    res.status(500).json({ error: "Error removing conversation from room" });
  }
});

// Delete a room (doesn't delete conversations, just removes room reference)
router.delete("/:id", async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Remove room reference from all conversations in this room
    await Conversation.updateMany(
      { roomId: room._id },
      { roomId: null }
    );

    res.json({ message: "Room deleted" });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ error: "Error deleting room" });
  }
});

// Get all conversations in a room for context sharing
router.get("/:id/context", async (req, res) => {
  try {
    const room = await Room.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate({
      path: 'conversationIds',
      select: 'name messages createdAt updatedAt roomId',
      options: { sort: { updatedAt: -1 } }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Combine all messages from all conversations in the room
    const allMessages = [];
    const conversationSummaries = [];
    
    room.conversationIds.forEach(conversation => {
      if (conversation.messages && conversation.messages.length > 0) {
        // Add conversation metadata for better context
        conversationSummaries.push({
          id: conversation._id,
          name: conversation.name || 'Unnamed Conversation',
          messageCount: conversation.messages.length,
          lastUpdated: conversation.updatedAt
        });
        
        // Add all messages with conversation reference
        conversation.messages.forEach(message => {
          allMessages.push({
            ...message.toObject(),
            conversationId: conversation._id,
            conversationName: conversation.name || 'Unnamed Conversation'
          });
        });
      }
    });

    // Sort messages by timestamp
    allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({ 
      messages: allMessages,
      conversations: conversationSummaries,
      roomInfo: {
        id: room._id,
        name: room.name,
        totalConversations: room.conversationIds.length,
        totalMessages: allMessages.length
      }
    });
  } catch (error) {
    console.error("Get room context error:", error);
    res.status(500).json({ error: "Error fetching room context" });
  }
});


export default router;
