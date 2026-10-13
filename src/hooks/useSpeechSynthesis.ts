import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const speak = useCallback(
    (messageId: string, text: string) => {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

      // If already speaking this message, toggle pause/resume or stop
      if (speakingMessageId === messageId) {
        if (isPaused) {
          resume();
        } else {
          pause();
        }
        return;
      }

      // Stop previous
      stop();

      // Clean markdown tags for natural speech reading
      const plainText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[#*_~\[\]\(\)]/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setSpeakingMessageId(messageId);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setSpeakingMessageId(null);
        setIsPaused(false);
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setSpeakingMessageId(null);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [speakingMessageId, isPaused, resume, pause, stop]
  );

  return {
    isSupported,
    speakingMessageId,
    isPaused,
    speak,
    pause,
    resume,
    stop,
  };
}
