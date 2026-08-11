import { useCallback } from 'react';

export function useTts() {
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    // Speech is a nice-to-have, and it is now triggered from render effects — a throw
    // here (no voices installed, a locked-down or patched implementation) would take
    // the whole card down with it. Failing silently is the right trade.
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    } catch {
      /* speech unavailable — the text is on screen either way */
    }
  }, []);

  const supported = typeof window !== 'undefined' && !!window.speechSynthesis;

  return { speak, supported };
}
