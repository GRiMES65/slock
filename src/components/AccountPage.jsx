import { useState } from 'react';
import { LogIn, UserPlus, LogOut, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import { formatHours, formatMinutes } from '../utils/timeUtils';

export default function AccountPage({ auth, sessions = [], getTotalMinutes }) {
  const { currentUser, signUp, signIn, signOut, deleteAccount } = auth;

  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'register') {
      if (!username.trim() || !password.trim()) {
        setErrorMsg('Please enter both a username and password');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        return;
      }
      setLoading(true);
      try {
        const res = await signUp(username, password);
        if (!res.success) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(`Welcome, ${res.user.username}! Your account is ready.`);
          setUsername('');
          setPassword('');
          setConfirmPassword('');
        }
      } catch {
        setErrorMsg('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setErrorMsg('Please enter your username and password');
        return;
      }
      setLoading(true);
      try {
        const res = await signIn(username, password);
        if (!res.success) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(`Welcome back, ${res.user.username}!`);
          setUsername('');
          setPassword('');
        }
      } catch {
        setErrorMsg('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const allTimeMinutes = getTotalMinutes ? getTotalMinutes() : 0;

  // IF LOGGED IN: SHOW PRIVATE OPERATOR PROFILE & DANGER ZONE
  if (currentUser) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-6 pb-24 min-h-screen flex flex-col space-y-6 font-mono">
        <header className="border-b-2 border-zinc-900 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#FF5500] inline-block" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase">
                ACCOUNT<span className="text-[#FF5500]">.</span>
              </h1>
            </div>
          </div>

          <span className="text-xs font-bold text-[#FF5500] border border-[#FF5500] bg-black px-2.5 py-1 uppercase shadow-[2px_2px_0px_#FF5500]">
            ACTIVE
          </span>
        </header>

        {/* Private Operator Card */}
        <div className="brutal-card p-5 bg-black border-2 border-[#FF5500] shadow-[4px_4px_0px_#FF5500] space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#FF5500] text-black font-black text-base flex items-center justify-center border-2 border-white shadow-[2px_2px_0px_#ffffff]">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-base font-black text-white uppercase tracking-wider">
                  {currentUser.username}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Private Account</span>
                </div>
              </div>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-red-400 hover:border-red-900 text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Telemetry Stats */}
          <div className="grid grid-cols-2 gap-3 bg-zinc-950 border border-zinc-900 p-3">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Personal Time Logged</div>
              <div className="text-xl font-black text-[#FF5500] mt-0.5">
                {formatHours(allTimeMinutes / 60)}
              </div>
              <div className="text-[9px] text-zinc-600 mt-0.5">
                {formatMinutes(allTimeMinutes)} total
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Sessions Completed</div>
              <div className="text-xl font-black text-white mt-0.5">
                {sessions.length}
              </div>
              <div className="text-[9px] text-zinc-600 mt-0.5">
                Study sessions logged
              </div>
            </div>
          </div>
        </div>

        {/* DANGER ZONE: DELETE ACCOUNT */}
        <div className="brutal-card p-5 bg-black border-2 border-red-950 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                [DANGER ZONE // TERMINATE ACCOUNT]
              </span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
            Permanently erase your operator profile and all associated study telemetry, intervals, and logs from this device.
          </p>

          {confirmDelete ? (
            <div className="p-3 bg-red-950/40 border-2 border-red-800 space-y-3">
              <div className="text-xs text-red-400 font-bold uppercase">
                CONFIRM IRREVERSIBLE DELETION?
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => deleteAccount(currentUser.id)}
                  className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black uppercase px-3 py-2 border-2 border-red-400 shadow-[2px_2px_0px_#ffffff] cursor-pointer"
                >
                  Yes, Delete Account
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white font-mono text-xs uppercase px-3 py-2 border border-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="border-2 border-red-900/80 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 font-mono text-xs uppercase font-bold px-3 py-2 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Operator Account</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // IF NOT LOGGED IN: SHOW GUEST VIEW & ACCOUNT SETUP
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-24 min-h-screen flex flex-col space-y-6 font-mono">
      <header className="border-b-2 border-zinc-900 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF5500] inline-block" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase">
              ACCOUNT<span className="text-[#FF5500]">.</span>
            </h1>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold text-zinc-400 border border-zinc-800 bg-zinc-950 px-2.5 py-1 uppercase">
          GUEST
        </span>
      </header>

      {/* Auth Card */}
      <div className="brutal-card p-6 bg-black border-2 border-zinc-800 space-y-5">
        {/* Toggle Mode: Create Account vs Sign In */}
        <div className="grid grid-cols-2 gap-2 border-b-2 border-zinc-900 pb-4">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 px-3 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-[#FF5500] text-black border-2 border-[#FF5500] shadow-[2px_2px_0px_#ffffff]'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 px-3 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-[#FF5500] text-black border-2 border-[#FF5500] shadow-[2px_2px_0px_#ffffff]'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-950/50 border-2 border-red-800 text-red-400 text-xs font-bold">
            ERROR: {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-emerald-950/50 border-2 border-emerald-800 text-emerald-400 text-xs font-bold">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase mb-1 font-bold">
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border-2 border-zinc-800 p-3 text-sm text-white font-mono focus:border-[#FF5500] focus:outline-none placeholder:text-zinc-700"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase mb-1 font-bold">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border-2 border-zinc-800 p-3 text-sm text-white font-mono focus:border-[#FF5500] focus:outline-none placeholder:text-zinc-700"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1 font-bold">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-950 border-2 border-zinc-800 p-3 text-sm text-white font-mono focus:border-[#FF5500] focus:outline-none placeholder:text-zinc-700"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full brutal-btn py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Personal Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
