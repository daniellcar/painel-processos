/**
 * Sino sintetizado via Web Audio API.
 *
 * Usa parciais espectrais reais de sinos de bronze (hum, strike, tierce,
 * quint, nominal) para produzir um timbre rico e "tocante" sem precisar
 * de arquivo de áudio externo.
 */

let ctx: AudioContext | null = null;

// Parciais de um sino fundido (proporções relativas ao tom de impacto)
const BELL_PARTIALS = [
  { ratio: 0.5, gain: 0.6, decay: 4.2 }, // hum (oitava abaixo)
  { ratio: 1.0, gain: 1.0, decay: 3.6 }, // strike (fundamental)
  { ratio: 1.19, gain: 0.42, decay: 2.6 }, // tierce (terça menor)
  { ratio: 1.5, gain: 0.36, decay: 2.1 }, // quint (quinta justa)
  { ratio: 2.0, gain: 0.55, decay: 1.9 }, // nominal (oitava acima)
  { ratio: 2.65, gain: 0.22, decay: 1.0 },
  { ratio: 3.3, gain: 0.12, decay: 0.7 },
];

const BASE_FREQ = 523.25; // C5
const MASTER_GAIN = 0.22;

export async function unlockAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") await ctx.resume();
  } catch {
    // ignore
  }
}

export function isAudioUnlocked(): boolean {
  return !!ctx && ctx.state === "running";
}

function strikeBell(when: number) {
  if (!ctx) return;
  const startAt = ctx.currentTime + when;
  const master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(ctx.destination);

  for (const p of BELL_PARTIALS) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = BASE_FREQ * p.ratio;

    // Envelope: ataque rapidíssimo, decaimento longo e exponencial
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(p.gain, startAt + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + p.decay);

    osc.connect(gain);
    gain.connect(master);

    osc.start(startAt);
    osc.stop(startAt + p.decay + 0.1);
  }
}

/**
 * Toca uma sequência de 3 badaladas espaçadas — efeito de sino solene.
 */
export function playBellSequence(): void {
  if (!ctx) return;
  strikeBell(0);
  strikeBell(0.78);
  strikeBell(1.56);
}
