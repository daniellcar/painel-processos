/**
 * Som do alerta — usa /public/alert-sound.mp3 via HTML5 Audio.
 *
 * Mantém a mesma API exportada (unlockAudio, playBellSequence,
 * isAudioUnlocked) para evitar mudanças no consumidor (board.tsx).
 */

const AUDIO_SRC = "/alert-sound.mp3";

let audio: HTMLAudioElement | null = null;
let unlocked = false;

function ensureAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio(AUDIO_SRC);
    audio.preload = "auto";
  }
  return audio;
}

export async function unlockAudio(): Promise<void> {
  const a = ensureAudio();
  if (!a) return;
  try {
    // "Destrava" o áudio executando muted no primeiro gesto do usuário.
    a.muted = true;
    a.currentTime = 0;
    await a.play();
    a.pause();
    a.currentTime = 0;
    a.muted = false;
    unlocked = true;
  } catch {
    // Browser bloqueou — usuário precisa interagir mais uma vez.
  }
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

export function playBellSequence(): void {
  const a = ensureAudio();
  if (!a) return;
  try {
    a.pause();
    a.currentTime = 0;
    a.muted = false;
    a.volume = 1;
    void a.play();
  } catch {
    // ignore
  }
}
