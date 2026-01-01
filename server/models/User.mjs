import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  name: {
    type: String,
    trim: true,
  },
  surname: {
    type: String,
    trim: true,
  },
  birthday: {
    type: Date,
  },
  targetPosition: {
    type: String,
    trim: true,
  },
  cvText: {
    type: String,
  },
  cvFile: {
    type: String, // path or URL to uploaded CV file
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  professionalSummary: {
    type: String,
  },
  workExperience: [{
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String },
  }],
  education: [{
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String },
  }],
  skills: [String],
  certifications: [{
    name: { type: String, required: true },
    issuer: { type: String },
    date: { type: Date },
    description: { type: String },
  }],
  languages: [{
    language: { type: String, required: true },
    proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Native'], default: 'Intermediate' },
  }],
  projects: [{
    name: { type: String, required: true },
    description: { type: String },
    url: { type: String },
    technologies: [String],
  }],
  awards: [{
    name: { type: String, required: true },
    issuer: { type: String },
    date: { type: Date },
    description: { type: String },
  }],
  references: [{
    name: { type: String, required: true },
    position: { type: String },
    company: { type: String },
    email: { type: String },
    phone: { type: String },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function () {
  // Skip if password hasn't been modified
  if (!this.isModified("password")) return;
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);

