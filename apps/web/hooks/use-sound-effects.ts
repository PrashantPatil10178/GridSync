"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Audio API based sound effects
interface SoundEffects {
  playClaimSound: () => void;
  playHoverSound: () => void;
  playErrorSound: () => void;
  playSuccessSound: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}

export function useSoundEffects(): SoundEffects {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Initialize AudioContext on first user interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
    };

    // Add listener for first interaction
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  const playTone = useCallback(
    (
      frequency: number,
      duration: number,
      type: OscillatorType = "sine",
      volume: number = 0.15,
      detune: number = 0,
    ) => {
      if (isMuted || !audioContextRef.current) return;

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.detune.setValueAtTime(detune, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration,
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    },
    [isMuted],
  );

  const playClaimSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;

    // Play a pleasant "ding" chord
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.12 - i * 0.02, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime + i * 0.02);
      oscillator.stop(ctx.currentTime + 0.35);
    });
  }, [isMuted]);

  const playHoverSound = useCallback(() => {
    playTone(880, 0.05, "sine", 0.03);
  }, [playTone]);

  const playErrorSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;

    // Two descending tones for error
    [200, 150].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime + i * 0.1);
      oscillator.stop(ctx.currentTime + 0.15 + i * 0.1);
    });
  }, [isMuted]);

  const playSuccessSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;

    // Ascending arpeggio for success
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.1 - i * 0.015, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime + i * 0.05);
      oscillator.stop(ctx.currentTime + 0.25 + i * 0.05);
    });
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return {
    playClaimSound,
    playHoverSound,
    playErrorSound,
    playSuccessSound,
    toggleMute,
    isMuted,
  };
}
