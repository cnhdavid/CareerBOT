import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      return res.status(503).json({ error: "Database configuration missing" });
    }

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      email,
      password: hashedPassword,
      name: '',
      surname: '',
      birthday: null,
      targetPosition: '',
      cvText: '',
      cvFile: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      postalCode: '',
      linkedin: '',
      github: '',
      portfolio: '',
      summary: '',
      experience: [],
      education: [],
      skills: '',
      languages: '',
      certifications: '',
      references: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId;

    const token = jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: "7d" });

    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: userId,
        email: newUser.email,
        name: newUser.name,
        surname: newUser.surname,
        birthday: newUser.birthday,
        targetPosition: newUser.targetPosition,
        cvText: newUser.cvText,
        cvFile: newUser.cvFile,
        phone: newUser.phone,
        address: newUser.address,
        city: newUser.city,
        country: newUser.country,
        postalCode: newUser.postalCode,
        linkedin: newUser.linkedin,
        github: newUser.github,
        portfolio: newUser.portfolio,
        summary: newUser.summary,
        experience: newUser.experience,
        education: newUser.education,
        skills: newUser.skills,
        languages: newUser.languages,
        certifications: newUser.certifications,
        references: newUser.references,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message || "Error creating user" });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
