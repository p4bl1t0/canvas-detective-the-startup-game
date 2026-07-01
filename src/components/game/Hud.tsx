import { motion } from "framer-motion";
import { Clock, Trophy, Lightbulb } from "lucide-react";

interface Props {
  score: number;
  timeSec: number;
  hintsUsed: number;
  maxHints: number;
  valueProposition: string;
  guess: string;
  onGuess: (v: string) => void;
  guessed: boolean | null;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Hud({ score, timeSec, hintsUsed, maxHints, valueProposition, guess, onGuess, guessed }: Props) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="bg-card rounded-3xl p-5 card-shadow border border-border relative overflow-hidden">
        <div className="absolute top-2 right-3 text-6xl font-bold opacity-[0.06] pointer-events-none">?</div>
        <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-[10px] font-bold uppercase tracking-wider rounded-full mb-3">
          Propuesta de Valor
        </span>
        <p className="text-[15px] leading-relaxed text-foreground/85 italic">
          "{valueProposition}"
        </p>
        <div className="mt-5 pt-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground mb-2">¿Reconoces la startup?</p>
          <input
            value={guess}
            onChange={(e) => onGuess(e.target.value)}
            placeholder="Escribe tu hipótesis..."
            className="w-full bg-muted/60 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-brand/30 outline-none placeholder:text-muted-foreground/70"
          />
          {guessed === true && (
            <p className="text-xs text-success mt-2 font-semibold">✓ ¡Buena hipótesis!</p>
          )}
          {guessed === false && (
            <p className="text-xs text-muted-foreground mt-2">Sigue intentando 🔎</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat icon={<Trophy className="size-4" />} label="Puntos" value={score.toLocaleString()} />
        <Stat icon={<Clock className="size-4" />} label="Tiempo" value={fmt(timeSec)} />
        <Stat icon={<Lightbulb className="size-4" />} label="Pistas" value={`${hintsUsed}/${maxHints}`} />
      </div>
    </motion.aside>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl px-3 py-2.5 card-shadow flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[9px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <span className="text-base font-bold tabular-nums text-foreground">{value}</span>
    </div>
  );
}
