import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { connectDB } from "./db.mjs";
import authRoutes from "./routes/auth.mjs";
import conversationRoutes from "./routes/conversations.mjs";

// ✅ lädt garantiert CareerBOT/server/.env
const envPath = new URL("./.env", import.meta.url);
dotenv.config({ path: envPath });

// Log environment loading status
console.log("📄 Loading environment from:", envPath.pathname);
console.log("🔍 MONGODB_URI loaded:", process.env.MONGODB_URI ? "Yes" : "No");

// Connect to MongoDB (non-blocking)
connectDB().catch(console.error);

const app = express();
app.use(cors());
app.use(express.json());

// Auth routes
app.use("/api/auth", authRoutes);

// Conversation routes
app.use("/api/conversations", conversationRoutes);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/answer", async (req, res) => {
  try {
    const { message } = req.body ?? {};
    if (!message?.trim()) {
      return res.status(400).json({ error: "message required" });
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: message.trim(),
    });

    res.json({ text: response.output_text ?? "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
