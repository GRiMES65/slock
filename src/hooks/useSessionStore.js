import { useState, useCallback, useEffect, useMemo } from 'react';
import { generateId } from '../utils/timeUtils';

const STORAGE_KEY = 'slock_sessions';

function loadAllSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any legacy dummy sample data
        return parsed.filter((s) => !s.id?.startsWith('seed_'));
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function useSessionStore(currentUser) {
  const [allSessions, setAllSessions] = useState(() => loadAllSessions());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [allSessions]);

  const currentUserId = currentUser?.id || 'local_device';

  // If a user logs in, automatically migrate any unassigned local sessions to their account
  useEffect(() => {
    if (currentUser?.id) {
      setAllSessions((prev) => {
        let changed = false;
        const updated = prev.map((s) => {
          if (!s.userId || s.userId === 'local_device') {
            changed = true;
            return { ...s, userId: currentUser.id };
          }
          return s;
        });
        return changed ? updated : prev;
      });
    }
  }, [currentUser?.id]);

  // Filter sessions: if logged in, show user's sessions; if guest (local_device), show local sessions
  const userSessions = useMemo(() => {
    if (currentUser?.id) {
      return allSessions.filter((s) => s.userId === currentUser.id);
    }
    // Guest / Local mode: show sessions belonging to local_device or without a userId
    return allSessions.filter((s) => !s.userId || s.userId === 'local_device');
  }, [allSessions, currentUser?.id]);

  const addSession = useCallback(
    (session) => {
      const newSession = {
        id: generateId(),
        userId: currentUserId,
        ...session,
        createdAt: new Date().toISOString(),
      };
      setAllSessions((prev) => [newSession, ...prev]);

      // If online and user has account, attempt background sync if endpoint exists
      if (currentUser?.id) {
        try {
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, session: newSession }),
          }).catch(() => {});
        } catch {
          // offline or running standalone without backend
        }
      }

      return newSession;
    },
    [currentUserId, currentUser?.id]
  );

  const removeSession = useCallback((id) => {
    setAllSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearAllSessions = useCallback(() => {
    // Clear only active user/guest sessions
    setAllSessions((prev) =>
      prev.filter((s) => {
        if (currentUser?.id) {
          return s.userId !== currentUser.id;
        }
        return s.userId && s.userId !== 'local_device';
      })
    );
  }, [currentUser?.id]);

  /**
   * Get total study minutes for a specific date (YYYY-MM-DD)
   */
  const getMinutesForDate = useCallback(
    (dateStr) => {
      return userSessions
        .filter((s) => {
          const sessionDate = new Date(s.endTime || s.startTime)
            .toISOString()
            .split('T')[0];
          return sessionDate === dateStr;
        })
        .reduce((sum, s) => sum + (s.totalStudyMinutes || 0), 0);
    },
    [userSessions]
  );

  /**
   * Get sessions on a specific date
   */
  const getSessionsForDate = useCallback(
    (dateStr) => {
      return userSessions.filter((s) => {
        const sessionDate = new Date(s.endTime || s.startTime)
          .toISOString()
          .split('T')[0];
        return sessionDate === dateStr;
      });
    },
    [userSessions]
  );

  /**
   * Get total study minutes for a date range
   */
  const getMinutesForRange = useCallback(
    (startDate, endDate) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return userSessions
        .filter((s) => {
          const d = new Date(s.endTime || s.startTime);
          return d >= start && d <= end;
        })
        .reduce((sum, s) => sum + (s.totalStudyMinutes || 0), 0);
    },
    [userSessions]
  );

  /**
   * Calculate streak for active view
   */
  const getStreak = useCallback(() => {
    if (userSessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const studyDates = new Set(
      userSessions.map((s) => {
        const d = new Date(s.endTime || s.startTime);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    let streak = 0;
    let checkDate = new Date(today);

    if (!studyDates.has(checkDate.getTime())) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (studyDates.has(checkDate.getTime())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }, [userSessions]);

  /**
   * Get all-time total study minutes
   */
  const getTotalMinutes = useCallback(() => {
    return userSessions.reduce((sum, s) => sum + (s.totalStudyMinutes || 0), 0);
  }, [userSessions]);

  return {
    sessions: userSessions,
    addSession,
    removeSession,
    clearAllSessions,
    getMinutesForDate,
    getSessionsForDate,
    getMinutesForRange,
    getStreak,
    getTotalMinutes,
  };
}
