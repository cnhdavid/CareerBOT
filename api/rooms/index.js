import { MongoClient, ObjectId } from 'mongodb';
import { verifyToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  const userId = verifyToken(req);
  if (!userId) {
    return res.status(401).json({ error: "Access token required" });
  }

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
      const rooms = await roomsCollection
        .find({ userId: new ObjectId(userId) })
        .sort({ updatedAt: -1 })
        .toArray();
      
      for (const room of rooms) {
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
      }
      
      res.json(rooms);
    } else if (req.method === 'POST') {
      const { name } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: "Room name is required" });
      }

      const newRoom = {
        userId: new ObjectId(userId),
        name: name.trim(),
        conversationIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await roomsCollection.insertOne(newRoom);
      newRoom._id = result.insertedId;
      
      res.status(201).json(newRoom);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Rooms error:", error);
    res.status(500).json({ error: "Error processing request" });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
