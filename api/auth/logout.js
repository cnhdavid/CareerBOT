export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', 'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
  res.json({ message: "Logout successful" });
}
