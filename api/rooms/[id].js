import { MongoClient, ObjectId } from 'mongodb';
import { verifyToken } from '../_lib/auth.js';

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

    if (req.method === 'GET') {
      const room = await roomsCollection.findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId)
      });

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      if (room.conversationIds && room.conversationIds.length > 0) {
        const conversations = await conversationsCollection
          .find({ _id: { $in: room.conversationIds.map(id => new ObjectId(id)) } })
          .sort({ updatedAt: -1 })
          .project({ name: 1, messages: 1, createdAt: 1, updatedAt: 1, roomId: 1 })
          .toArray();
        room.conversationIds = conversations;
      } else {
        room.conversationIds = [];
      }

      res.json(room);
    } else if (req.method === 'PATCH') {
      const { name } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: "Room name is required" });
      }

      const result = await roomsCollection.findOneAndUpdate(
        { _id: new ObjectId(id), userId: new ObjectId(userId) },
        { $set: { name: name.trim(), updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ error: "Room not found" });
      }

      const room = result.value;
      if (room.conversationIds && room.conversationIds.length > 0) {
        const conversations = await conversationsCollection
          .find({ _id: { $in: room.conversationIds.map(id => new ObjectId(id)) } })
          .sort({ updatedAt: -1 })
          .project({ name: 1, messages: 1, createdAt: 1, updatedAt: 1, roomId: 1 })
          .toArray();
        room.conversationIds = conversations;
      } else {
        room.conversationIds = [];
      }

      res.json(room);
    } else if (req.method === 'DELETE') {
      const result = await roomsCollection.findOneAndDelete({
        _id: new ObjectId(id),
        userId: new ObjectId(userId)
      });

      if (!result.value) {
        return res.status(404).json({ error: "Room not found" });
      }

      await conversationsCollection.updateMany(
        { roomId: new ObjectId(id) },
        { $set: { roomId: null } }
      );

      res.json({ message: "Room deleted" });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Room operation error:", error);
    res.status(500).json({ error: "Error processing request" });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
