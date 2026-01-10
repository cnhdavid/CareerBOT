import { MongoClient, ObjectId } from 'mongodb';
import { verifyToken } from '../../_lib/auth.js';

export default async function handler(req, res) {
  const userId = verifyToken(req);
  if (!userId) {
    return res.status(401).json({ error: "Access token required" });
  }

  const { id } = req.query;

  let client;
  
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      return res.status(503).json({ error: "Database configuration missing" });
    }

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const roomsCollection = db.collection('rooms');
    const conversationsCollection = db.collection('conversations');

    if (req.method === 'POST') {
      const { conversationId } = req.body;
      
      if (!conversationId) {
        return res.status(400).json({ error: "Conversation ID is required" });
      }

      const room = await roomsCollection.findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId)
      });

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const conversation = await conversationsCollection.findOne({
        _id: new ObjectId(conversationId),
        userId: new ObjectId(userId)
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (!conversation.name && (!conversation.messages || conversation.messages.length === 0)) {
        return res.status(400).json({ error: "Cannot add empty conversation to room" });
      }

      if (room.conversationIds.length >= 5) {
        return res.status(400).json({ error: "Maximum 5 conversations allowed per room" });
      }

      const conversationIdStr = conversationId.toString();
      if (room.conversationIds.some(id => id.toString() === conversationIdStr)) {
        return res.status(400).json({ error: "Conversation already in room" });
      }

      await roomsCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $push: { conversationIds: new ObjectId(conversationId) },
          $set: { updatedAt: new Date() }
        }
      );

      await conversationsCollection.updateOne(
        { _id: new ObjectId(conversationId) },
        { $set: { roomId: new ObjectId(id) } }
      );

      const updatedRoom = await roomsCollection.findOne({ _id: new ObjectId(id) });
      if (updatedRoom.conversationIds && updatedRoom.conversationIds.length > 0) {
        const conversations = await conversationsCollection
          .find({ _id: { $in: updatedRoom.conversationIds.map(id => new ObjectId(id)) } })
          .sort({ updatedAt: -1 })
          .project({ name: 1, messages: 1, createdAt: 1, updatedAt: 1, roomId: 1 })
          .toArray();
        updatedRoom.conversationIds = conversations;
      }

      res.json(updatedRoom);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Add conversation to room error:", error);
    res.status(500).json({ error: "Error processing request" });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
