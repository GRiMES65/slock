// Cloud Redis storage client using Upstash REST API
// Enables instant multi-device account & session syncing between phone and computer

const UPSTASH_URL =
  import.meta.env.VITE_UPSTASH_REDIS_REST_URL ||
  'https://sunny-dolphin-186224.upstash.io';

const UPSTASH_TOKEN =
  import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN ||
  'gQAAAAAAAtdwAQIgcDE3MWUwMTI3ZjAyN2Y0YjFlYjkzYmZmNDk1MTcxN2ZkNg';

async function redisCommand(commandArray) {
  try {
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commandArray),
    });
    if (!res.ok) {
      console.warn('Upstash Redis HTTP error:', res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.warn('Upstash Redis network exception:', err);
    return null;
  }
}

/**
 * Fetch user account from cloud
 */
export async function cloudGetUser(username) {
  if (!username) return null;
  const key = `user:${username.trim().toLowerCase()}`;
  const raw = await redisCommand(['GET', key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save user account to cloud
 */
export async function cloudSaveUser(user) {
  if (!user || !user.username) return false;
  const key = `user:${user.username.trim().toLowerCase()}`;
  const res = await redisCommand(['SET', key, JSON.stringify(user)]);
  return res === 'OK';
}

/**
 * Delete user account and sessions from cloud
 */
export async function cloudDeleteUser(user) {
  if (!user) return false;
  const userKey = `user:${user.username.trim().toLowerCase()}`;
  const sessionsKey = `sessions:${user.id}`;
  await redisCommand(['DEL', userKey, sessionsKey]);
  return true;
}

/**
 * Fetch all sessions for a user from cloud
 */
export async function cloudGetSessions(userId) {
  if (!userId) return [];
  const key = `sessions:${userId}`;
  const raw = await redisCommand(['GET', key]);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save all sessions for a user to cloud
 */
export async function cloudSaveSessions(userId, sessions) {
  if (!userId || !Array.isArray(sessions)) return false;
  const key = `sessions:${userId}`;
  const res = await redisCommand(['SET', key, JSON.stringify(sessions)]);
  return res === 'OK';
}
