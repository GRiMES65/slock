import { useState, useCallback, useEffect } from 'react';
import { generateId } from '../utils/timeUtils';

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
        // If it was the legacy auto-created user_main, clear it immediately
        if (parsed.id === 'user_main') {
          localStorage.removeItem(CURRENT_USER_KEY);
          return null;
        }
        const found = cleanUsers.find((u) => u.id === parsed.id);
        if (found) return found;
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
   * Create a new account
   */
  const signUp = useCallback(
    (rawUsername, rawPassword) => {
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

      // Check if username is already taken
      const exists = users.some(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );
      if (exists) {
        return { success: false, error: 'Username already exists. Please sign in.' };
      }

      const newUser = {
        id: generateId(),
        username,
        password,
        createdAt: new Date().toISOString(),
      };

      const updated = [...users, newUser];
      setUsers(updated);
      setCurrentUser(newUser);
      return { success: true, user: newUser };
    },
    [users]
  );

  /**
   * Sign in with existing credentials
   */
  const signIn = useCallback(
    (rawUsername, rawPassword) => {
      const username = rawUsername.trim();
      const password = rawPassword.trim();

      if (!username) {
        return { success: false, error: 'Username is required' };
      }
      if (!password) {
        return { success: false, error: 'Password is required' };
      }

      const found = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );

      if (!found) {
        return { success: false, error: 'No account found with this username' };
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
   * Permanently delete account and all its session records
   */
  const deleteAccount = useCallback(
    (userId) => {
      const targetId = userId || currentUser?.id;
      if (!targetId) return;

      // 1. Remove user from users list
      const updatedUsers = users.filter((u) => u.id !== targetId);
      setUsers(updatedUsers);

      // 2. Remove all sessions belonging to this user
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
