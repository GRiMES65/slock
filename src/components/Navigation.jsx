import { NavLink } from 'react-router-dom';
import { Timer, BarChart2, User } from 'lucide-react';

export default function Navigation({ currentUser }) {
  const usernameLabel = currentUser ? currentUser.username : 'Guest';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t-2 border-zinc-900 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[11px] font-mono font-bold tracking-wider uppercase transition-all duration-150 ${
              isActive
                ? 'bg-[#FF5500] text-black border-2 border-[#FF5500] shadow-[2px_2px_0px_#ffffff]'
                : 'bg-zinc-950/80 text-zinc-400 border-2 border-zinc-800 hover:border-zinc-700 hover:text-white'
            }`
          }
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Timer</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[11px] font-mono font-bold tracking-wider uppercase transition-all duration-150 ${
              isActive
                ? 'bg-[#FF5500] text-black border-2 border-[#FF5500] shadow-[2px_2px_0px_#ffffff]'
                : 'bg-zinc-950/80 text-zinc-400 border-2 border-zinc-800 hover:border-zinc-700 hover:text-white'
            }`
          }
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </NavLink>

        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[11px] font-mono font-bold tracking-wider uppercase transition-all duration-150 truncate ${
              isActive
                ? 'bg-[#FF5500] text-black border-2 border-[#FF5500] shadow-[2px_2px_0px_#ffffff]'
                : 'bg-zinc-950/80 text-zinc-400 border-2 border-zinc-800 hover:border-zinc-700 hover:text-white'
            }`
          }
        >
          <User className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{usernameLabel}</span>
        </NavLink>
      </div>
    </nav>
  );
}
