import { useEffect, useRef } from 'react';
import { formatTime } from '../utils/timeUtils';

const DEFAULT_TITLE = 'slock — Study Timer';
const DEFAULT_FAVICON_SVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⏱</text></svg>";

function setFaviconEmoji(emoji) {
  try {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`;
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  } catch {
    // Graceful ignore
  }
}

function resetFavicon() {
  try {
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = `data:image/svg+xml,${encodeURIComponent(DEFAULT_FAVICON_SVG)}`;
    }
  } catch {
    // Graceful ignore
  }
}

/**
 * Syncs active timer countdown and state with the browser tab title and favicon.
 *
 * @param {Object} options
 * @param {number} options.timeRemaining - Remaining seconds
 * @param {boolean} options.isRunning - Whether timer is running
 * @param {boolean} options.isPaused - Whether timer is paused
 * @param {boolean} options.isComplete - Whether timer has completed
 * @param {string} [options.label] - Phase label (e.g. 'Focus', 'Rest', 'Focus 1/4')
 * @param {boolean} [options.isBreak] - Whether current phase is a break
 * @param {boolean} [options.enabled] - Whether title management is active
 */
export function useTabTitle({
  timeRemaining = 0,
  isRunning = false,
  isPaused = false,
  isComplete = false,
  label = 'Focus',
  isBreak = false,
  enabled = false,
} = {}) {
  const originalTitleRef = useRef(DEFAULT_TITLE);

  useEffect(() => {
    if (!enabled) {
      document.title = DEFAULT_TITLE;
      resetFavicon();
      return;
    }

    if (isComplete) {
      document.title = '🔔 (0:00) Done! · slock';
      setFaviconEmoji('🔔');
      return;
    }

    if (isPaused) {
      const formatted = formatTime(timeRemaining);
      document.title = `⏸ (${formatted}) Paused · slock`;
      setFaviconEmoji('⏸');
      return;
    }

    if (isRunning) {
      const formatted = formatTime(timeRemaining);
      if (isBreak) {
        document.title = `☕ (${formatted}) ${label} · slock`;
        setFaviconEmoji('☕');
      } else {
        document.title = `⏱ (${formatted}) ${label} · slock`;
        setFaviconEmoji('⏱');
      }
      return;
    }

    // Default if enabled but neither running, paused, nor complete
    document.title = DEFAULT_TITLE;
    resetFavicon();
  }, [timeRemaining, isRunning, isPaused, isComplete, label, isBreak, enabled]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      document.title = originalTitleRef.current;
      resetFavicon();
    };
  }, []);
}
