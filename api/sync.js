// Simple cloud sync handler for Vercel deployment
// When hosted on Vercel, this serverless function allows cross-device sync between phone and computer.

// In-memory store per serverless instance (can be plugged into Vercel KV / Upstash / Postgres / MongoDB)
const cloudStorage = new Map();

export default async function handler(req, res) {
  // CORS headers so phone and desktop clients can sync
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userId } = req.query;

  if (req.method === 'GET') {
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const userSessions = cloudStorage.get(userId) || [];
    return res.status(200).json({ sessions: userSessions });
  }

  if (req.method === 'POST') {
    const { userId: bodyUserId, session, sessions } = req.body || {};
    const targetUserId = userId || bodyUserId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const existing = cloudStorage.get(targetUserId) || [];

    if (sessions && Array.isArray(sessions)) {
      // Full sync/replace
      cloudStorage.set(targetUserId, sessions);
      return res.status(200).json({ success: true, count: sessions.length });
    } else if (session) {
      // Append single session
      const updated = [session, ...existing.filter((s) => s.id !== session.id)];
      cloudStorage.set(targetUserId, updated);
      return res.status(200).json({ success: true, count: updated.length });
    }

    return res.status(400).json({ error: 'session or sessions payload required' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
