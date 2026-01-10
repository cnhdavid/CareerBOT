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
    const conversationsCollection = db.collection('conversations');

    if (req.method === 'GET') {
      const conversations = await conversationsCollection
        .find({ userId: new ObjectId(userId) })
        .sort({ updatedAt: -1 })
        .project({ name: 1, messages: 1, createdAt: 1, updatedAt: 1, roomId: 1 })
        .toArray();
      
      res.json(conversations);
    } else if (req.method === 'POST') {
      const newConversation = {
        userId: new ObjectId(userId),
        messages: [],
        name: '',
        roomId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await conversationsCollection.insertOne(newConversation);
      newConversation._id = result.insertedId;
      
      res.status(201).json(newConversation);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Conversations error:", error);
    res.status(500).json({ error: "Error processing request" });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
