import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

function verifyToken(req) {
  const cookieHeader = req.headers.cookie || '';
  const authTokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
  const token = authTokenMatch ? authTokenMatch[1] : null;
  
  if (!token) {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.split(" ")[1];
    if (!headerToken) return null;
    
    try {
      const decoded = jwt.verify(headerToken, JWT_SECRET);
      return decoded.userId;
    } catch {
      return null;
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const usersCollection = db.collection('users');

    if (req.method === 'GET') {
      const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } }
      );
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          birthday: user.birthday,
          targetPosition: user.targetPosition,
          cvText: user.cvText,
          cvFile: user.cvFile,
          phone: user.phone,
          address: user.address,
          city: user.city,
          country: user.country,
          postalCode: user.postalCode,
          linkedin: user.linkedin,
          github: user.github,
          portfolio: user.portfolio,
          summary: user.summary,
          experience: user.experience,
          education: user.education,
          skills: user.skills,
          languages: user.languages,
          certifications: user.certifications,
          references: user.references,
        },
      });
    } else if (req.method === 'PUT') {
      const { 
        email, password, name, surname, birthday, targetPosition, cvText, cvFile,
        phone, address, city, country, postalCode, linkedin, github, portfolio, summary,
        experience, education, skills, languages, certifications, references
      } = req.body;

      const updateData = { updatedAt: new Date() };
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      if (surname !== undefined) updateData.surname = surname;
      if (birthday !== undefined) updateData.birthday = birthday ? new Date(birthday) : null;
      if (targetPosition !== undefined) updateData.targetPosition = targetPosition;
      if (cvText !== undefined) updateData.cvText = cvText;
      if (cvFile !== undefined) updateData.cvFile = cvFile;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (country !== undefined) updateData.country = country;
      if (postalCode !== undefined) updateData.postalCode = postalCode;
      if (linkedin !== undefined) updateData.linkedin = linkedin;
      if (github !== undefined) updateData.github = github;
      if (portfolio !== undefined) updateData.portfolio = portfolio;
      if (summary !== undefined) updateData.summary = summary;
      if (experience !== undefined) updateData.experience = typeof experience === 'string' ? JSON.parse(experience) : experience;
      if (education !== undefined) updateData.education = typeof education === 'string' ? JSON.parse(education) : education;
      if (skills !== undefined) updateData.skills = skills;
      if (languages !== undefined) updateData.languages = languages;
      if (certifications !== undefined) updateData.certifications = certifications;
      if (references !== undefined) updateData.references = references;

      if (password !== undefined && password !== "") {
        const bcrypt = await import('bcryptjs');
        updateData.password = await bcrypt.default.hash(password, 10);
      }

      const result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updateData },
        { returnDocument: 'after', projection: { password: 0 } }
      );

      if (!result.value) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = result.value;
      res.json({
        message: "Profile updated successfully",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          birthday: user.birthday,
          targetPosition: user.targetPosition,
          cvText: user.cvText,
          cvFile: user.cvFile,
          phone: user.phone,
          address: user.address,
          city: user.city,
          country: user.country,
          postalCode: user.postalCode,
          linkedin: user.linkedin,
          github: user.github,
          portfolio: user.portfolio,
          summary: user.summary,
          experience: user.experience,
          education: user.education,
          skills: user.skills,
          languages: user.languages,
          certifications: user.certifications,
          references: user.references,
        },
      });
    }
  } catch (error) {
    console.error("User operation error:", error);
    res.status(500).json({ error: error.message || "Error processing request" });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
