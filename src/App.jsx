import { useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TimerPage from './components/TimerPage';
import AnalyticsPage from './components/AnalyticsPage';
import AccountPage from './components/AccountPage';
import Navigation from './components/Navigation';
import { useAuth } from './hooks/useAuth';
import { useSessionStore } from './hooks/useSessionStore';

export default function App() {
  const auth = useAuth();
  const { currentUser } = auth;

  const {
    sessions,
    addSession,
    removeSession,
    clearAllSessions,
    getMinutesForDate,
    getSessionsForDate,
    getStreak,
    getTotalMinutes,
  } = useSessionStore(currentUser);

  const handleSessionComplete = useCallback(
    (session) => {
      addSession(session);
    },
    [addSession]
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white font-['Space_Grotesk'] amoled-grid">
        <main className="w-full">
          <Routes>
            <Route
              path="/"
              element={
                <TimerPage
                  currentUser={currentUser}
                  onSessionComplete={handleSessionComplete}
                />
              }
            />
            <Route
              path="/analytics"
              element={
                <AnalyticsPage
                  sessions={sessions}
                  getMinutesForDate={getMinutesForDate}
                  getSessionsForDate={getSessionsForDate}
                  getStreak={getStreak}
                  getTotalMinutes={getTotalMinutes}
                  removeSession={removeSession}
                  clearAllSessions={clearAllSessions}
                />
              }
            />
            <Route
              path="/account"
              element={
                <AccountPage
                  auth={auth}
                  sessions={sessions}
                  getTotalMinutes={getTotalMinutes}
                />
              }
            />
          </Routes>
        </main>
        <Navigation currentUser={currentUser} />
      </div>
    </BrowserRouter>
  );
}
