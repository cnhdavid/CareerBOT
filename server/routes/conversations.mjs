import express from "express";
import { authenticateToken } from "./auth.mjs";
import Conversation from "../models/Conversation.mjs";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all conversations for the user
router.get("/", async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select("name messages createdAt updatedAt");
    res.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Error fetching conversations" });
  }
});

// Create a new conversation
router.post("/", async (req, res) => {
  try {
    const conversation = new Conversation({
      userId: req.userId,
      messages: [],
    });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ error: "Error creating conversation" });
  }
});

// Get a specific conversation
router.get("/:id", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(conversation);
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Error fetching conversation" });
  }
});

// Update conversation (add message)
router.put("/:id", async (req, res) => {
  try {
    const { role, content } = req.body;
    if (!role || !content) {
      return res.status(400).json({ error: "Role and content are required" });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        $push: { messages: { role, content } },
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json(conversation);
  } catch (error) {
    console.error("Update conversation error:", error);
    res.status(500).json({ error: "Error updating conversation" });
  }
});

// Update conversation name
router.patch("/:id/name", async (req, res) => {
  try {
    const { name } = req.body;
    if (name === undefined) {
      return res.status(400).json({ error: "Name is required" });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, updatedAt: Date.now() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json(conversation);
  } catch (error) {
    console.error("Update conversation name error:", error);
    res.status(500).json({ error: "Error updating conversation name" });
  }
});

// Delete a conversation
router.delete("/:id", async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ error: "Error deleting conversation" });
  }
});

export default router;