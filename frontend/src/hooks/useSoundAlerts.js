import { useCallback, useRef } from 'react';

// Creates sounds via Web Audio API — no external files needed
const createAudioContext = () => {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
};

const playTone = (ctx, freq, duration, type = 'sine', vol = 0.15) => {
  if (!ctx) return;
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* silent fail */ }
};

export default function useSoundAlerts() {
  const ctxRef = useRef(null);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = createAudioContext();
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playNewIncident = useCallback(() => {
    const ctx = ensureCtx();
    playTone(ctx, 880, 0.12, 'sine', 0.10);
    setTimeout(() => playTone(ctx, 1100, 0.12, 'sine', 0.08), 130);
  }, [ensureCtx]);

  const playHighRisk = useCallback(() => {
    const ctx = ensureCtx();
    // Urgent pulsed alarm
    [0, 200, 400].forEach(delay =>
      setTimeout(() => playTone(ctx, 660, 0.18, 'square', 0.12), delay)
    );
  }, [ensureCtx]);

  const playSosAlert = useCallback(() => {
    const ctx = ensureCtx();
    // Three sharp beeps
    [0, 300, 600].forEach(delay =>
      setTimeout(() => playTone(ctx, 1320, 0.25, 'sawtooth', 0.14), delay)
    );
  }, [ensureCtx]);

  const playDangerZone = useCallback(() => {
    const ctx = ensureCtx();
    playTone(ctx, 440, 0.3, 'triangle', 0.12);
    setTimeout(() => playTone(ctx, 330, 0.4, 'triangle', 0.10), 250);
  }, [ensureCtx]);

  const playSuccess = useCallback(() => {
    const ctx = ensureCtx();
    playTone(ctx, 880, 0.1, 'sine', 0.08);
    setTimeout(() => playTone(ctx, 1320, 0.15, 'sine', 0.06), 120);
  }, [ensureCtx]);

  return { playNewIncident, playHighRisk, playSosAlert, playDangerZone, playSuccess };
}
