import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  conversationIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on save
roomSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// Limit to 5 conversations per room
roomSchema.pre("save", function () {
  if (this.conversationIds && this.conversationIds.length > 5) {
    throw new Error("Maximum 5 conversations allowed per room");
  }
});

export default mongoose.model("Room", roomSchema);
