import { useCallback } from 'react';

export function useTts() {
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }, []);

  const supported = typeof window !== 'undefined' && !!window.speechSynthesis;

  return { speak, supported };
}
