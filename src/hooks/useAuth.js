import { useState, useCallback, useEffect } from 'react';
import { generateId } from '../utils/timeUtils';
import { cloudGetUser, cloudSaveUser, cloudDeleteUser } from '../services/cloudStore';

const USERS_STORAGE_KEY = 'slock_users';
const CURRENT_USER_KEY = 'slock_current_user';
const SESSIONS_STORAGE_KEY = 'slock_sessions';

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out any legacy 'user_main' mock account
        const clean = parsed.filter((u) => u.id !== 'user_main');
        if (clean.length !== parsed.length) {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function loadCurrentUser(cleanUsers) {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        if (parsed.id === 'user_main') {
          localStorage.removeItem(CURRENT_USER_KEY);
          return null;
        }
        const found = cleanUsers.find((u) => u.id === parsed.id);
        if (found) return found;
        // If stored user exists even if not in local array (e.g. cloud synced previously)
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function useAuth() {
  const [users, setUsers] = useState(() => loadUsers());
  const [currentUser, setCurrentUser] = useState(() => loadCurrentUser(loadUsers()));

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users:', e);
    }
  }, [users]);

  // Sync current user to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error('Failed to save current user:', e);
    }
  }, [currentUser]);

  /**
   * Create a new account (Saves locally + pushes to Cloud Redis for cross-device access)
   */
  const signUp = useCallback(
    async (rawUsername, rawPassword) => {
      const username = rawUsername.trim();
      const password = rawPassword.trim();

      if (!username) {
        return { success: false, error: 'Username is required' };
      }
      if (username.length < 2) {
        return { success: false, error: 'Username must be at least 2 characters' };
      }
      if (!password) {
        return { success: false, error: 'Password is required' };
      }

      // Check if username is already taken locally
      const localExists = users.some(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );
      if (localExists) {
        return { success: false, error: 'Username already exists. Please sign in.' };
      }

      // Also check cloud database
      try {
        const cloudUser = await cloudGetUser(username);
        if (cloudUser) {
          return { success: false, error: 'Username already taken across devices. Please sign in.' };
        }
      } catch {
        // Fallback to local
      }

      const newUser = {
        id: generateId(),
        username,
        password,
        createdAt: new Date().toISOString(),
      };

      // Save locally
      const updated = [...users, newUser];
      setUsers(updated);
      setCurrentUser(newUser);

      // Push to Cloud Redis so phone and other computers can log in immediately
      try {
        await cloudSaveUser(newUser);
      } catch (err) {
        console.warn('Failed to sync new user to cloud:', err);
      }

      return { success: true, user: newUser };
    },
    [users]
  );

  /**
   * Sign in with existing credentials (Checks local, falls back to Cloud Redis across devices)
   */
  const signIn = useCallback(
    async (rawUsername, rawPassword) => {
      const username = rawUsername.trim();
      const password = rawPassword.trim();

      if (!username) {
        return { success: false, error: 'Username is required' };
      }
      if (!password) {
        return { success: false, error: 'Password is required' };
      }

      // 1. Check local storage
      let found = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );

      // 2. If not found locally, query Cloud Redis (e.g. account created on another device like computer)
      if (!found) {
        try {
          const cloudUser = await cloudGetUser(username);
          if (cloudUser) {
            found = cloudUser;
            // Cache locally on this device
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === cloudUser.id);
              return exists ? prev : [...prev, cloudUser];
            });
          }
        } catch (err) {
          console.warn('Cloud login fetch error:', err);
        }
      }

      if (!found) {
        return { success: false, error: 'No account found with this username. Please check spelling or create an account.' };
      }

      if (found.password !== password) {
        return { success: false, error: 'Incorrect password' };
      }

      setCurrentUser(found);
      return { success: true, user: found };
    },
    [users]
  );

  /**
   * Sign out
   */
  const signOut = useCallback(() => {
    setCurrentUser(null);
  }, []);

  /**
   * Permanently delete account and all its session records (both locally and in cloud)
   */
  const deleteAccount = useCallback(
    async (userId) => {
      const targetId = userId || currentUser?.id;
      if (!targetId) return;

      const targetUser = users.find((u) => u.id === targetId) || currentUser;

      // 1. Remove user from local users list
      const updatedUsers = users.filter((u) => u.id !== targetId);
      setUsers(updatedUsers);

      // 2. Remove all sessions locally
      try {
        const rawSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
        if (rawSessions) {
          const sessions = JSON.parse(rawSessions);
          if (Array.isArray(sessions)) {
            const remaining = sessions.filter((s) => s.userId !== targetId);
            localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(remaining));
          }
        }
      } catch (e) {
        console.error('Failed to purge user sessions:', e);
      }

      // 3. Clear current user session
      if (currentUser?.id === targetId) {
        setCurrentUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
      }

      // 4. Delete from Cloud Redis
      if (targetUser) {
        try {
          await cloudDeleteUser(targetUser);
        } catch (err) {
          console.warn('Failed to delete user from cloud:', err);
        }
      }
    },
    [users, currentUser]
  );

  return {
    currentUser,
    usersCount: users.length,
    signUp,
    signIn,
    signOut,
    deleteAccount,
  };
}
