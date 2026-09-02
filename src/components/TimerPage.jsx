import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Layers, User } from 'lucide-react';
import SessionTimer from './SessionTimer';
import SimpleTimer from './SimpleTimer';

export default function TimerPage({ onSessionComplete, currentUser }) {
  const [activeTab, setActiveTab] = useState('session');

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-24 min-h-screen flex flex-col">
      {/* Brutalist Top Header */}
      <header className="mb-6 border-b-2 border-zinc-900 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF5500] inline-block animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white font-mono uppercase">
              SLOCK<span className="text-[#FF5500]">.</span>
            </h1>
          </div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
            Focus & Interval Engine
          </p>
        </div>

        {currentUser ? (
          <Link
            to="/account"
            className="font-mono text-[11px] text-zinc-400 hover:text-white uppercase border border-zinc-800 bg-zinc-950 px-2.5 py-1 flex items-center gap-1.5 transition-colors hover:border-zinc-700"
          >
            <User className="w-3 h-3 text-[#FF5500]" />
            <span>{currentUser.username}</span>
          </Link>
        ) : (
          <Link
            to="/account"
            className="font-mono text-[11px] text-zinc-500 hover:text-white uppercase border border-zinc-900 bg-black px-2.5 py-1 flex items-center gap-1.5 transition-colors hover:border-zinc-800"
          >
            <User className="w-3 h-3 text-zinc-600" />
            <span>GUEST</span>
          </Link>
        )}
      </header>

      {/* Mode Switcher - Neo-Brutalist Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => setActiveTab('session')}
          className={`py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase transition-all duration-150 ${
            activeTab === 'session'
              ? 'bg-[#FF5500] text-black border-2 border-[#FF5500] shadow-[3px_3px_0px_#ffffff]'
              : 'bg-zinc-950 text-zinc-400 border-2 border-zinc-800 hover:border-zinc-700 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Session Plan</span>
        </button>

        <button
          onClick={() => setActiveTab('simple')}
          className={`py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase transition-all duration-150 ${
            activeTab === 'simple'
              ? 'bg-[#FF5500] text-black border-2 border-[#FF5500] shadow-[3px_3px_0px_#ffffff]'
              : 'bg-zinc-950 text-zinc-400 border-2 border-zinc-800 hover:border-zinc-700 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Quick Timer</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'session' ? (
              <SessionTimer onSessionComplete={onSessionComplete} />
            ) : (
              <SimpleTimer onSessionComplete={onSessionComplete} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
