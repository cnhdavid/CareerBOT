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
    const conversationsCollection = db.collection('conversations');

    if (req.method === 'GET') {
      const conversation = await conversationsCollection.findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId)
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.json(conversation);
    } else if (req.method === 'PUT') {
      const { role, content } = req.body;
      
      if (!role || !content) {
        return res.status(400).json({ error: "Role and content are required" });
      }

      const result = await conversationsCollection.findOneAndUpdate(
        { _id: new ObjectId(id), userId: new ObjectId(userId) },
        {
          $push: { messages: { role, content, timestamp: new Date() } },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.json(result.value);
    } else if (req.method === 'PATCH') {
      const { name } = req.body;
      
      if (name === undefined) {
        return res.status(400).json({ error: "Name is required" });
      }

      const result = await conversationsCollection.findOneAndUpdate(
        { _id: new ObjectId(id), userId: new ObjectId(userId) },
        { $set: { name, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.json(result.value);
    } else if (req.method === 'DELETE') {
      const result = await conversationsCollection.findOneAndDelete({
        _id: new ObjectId(id),
        userId: new ObjectId(userId)
      });

      if (!result.value) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.json({ message: "Conversation deleted" });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Conversation operation error:", error);
    res.status(500).json({ error: "Error processing request" });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
