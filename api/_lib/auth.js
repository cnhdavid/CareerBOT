import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function verifyToken(req) {
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

export function requireAuth(handler) {
  return async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) {
      return res.status(401).json({ error: "Access token required" });
    }
    req.userId = userId;
    return handler(req, res);
  };
}
