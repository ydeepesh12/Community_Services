/**
 * Browser Web Audio API Chime Synthesizer
 * Produces pleasant, calming alert and confirmation tones tailored for elderly users.
 */

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Play a soothing 3-note reminder chime (C5 -> E5 -> G5)
 */
export const playReminderChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const now = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.22);

      gain.gain.setValueAtTime(0.001, now + index * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.2, now + index * 0.22 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.22 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.22);
      osc.stop(now + index * 0.22 + 0.65);
    });
  } catch (err) {
    console.warn('[Audio] Failed to play chime:', err);
  }
};

/**
 * Play an uplifting confirmation sound when medicine is marked as taken
 */
export const playDoseTakenChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    const now = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);

      gain.gain.setValueAtTime(0.001, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.22, now + index * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.45);
    });
  } catch (err) {
    console.warn('[Audio] Failed to play taken chime:', err);
  }
};

/**
 * Web Speech API: speak medicine instructions aloud
 */
export const speakMedicationInstruction = (medicineName, dosage, unit, instructions) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const text = `Time to take ${medicineName}. Dosage is ${dosage} ${unit}. Instructions: ${instructions}.`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.88; // Slightly slower, clear pace for elderly listeners
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};
