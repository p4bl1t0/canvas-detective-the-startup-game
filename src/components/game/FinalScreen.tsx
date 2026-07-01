import { motion } from "framer-motion";
import { Trophy, Clock, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Startup, BlockId, Placement } from "@/game/types";
import { BLOCKS } from "@/game/types";
import type { ValidationResult } from "@/game/validation";

interface Props {
  startup: Startup;
  validation: ValidationResult;
  placement: Placement;
  score: number;
  timeSec: number;
  onRetry: () => void;
  nextStartupId: string | null;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FinalScreen({ startup, validation, placement, score, timeSec, onRetry, nextStartupId }: Props) {
  const cardsByBlock: Record<string, typeof startup.cards> = {};
  for (const c of startup.cards) {
    if (c.type === "model" && c.block) {
      (cardsByBlock[c.block] ??= []).push(c);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-6 py-10 space-y-8"
    >
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="inline-flex items-center gap-2 bg-brand-soft text-brand px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
        >
          <Sparkles className="size-3.5" /> Caso resuelto
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">La startup era <span className="text-brand">{startup.name}</span></h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{startup.story}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={<Trophy className="size-4" />} label="Puntaje" value={score.toLocaleString()} accent />
        <Metric label="Aciertos" value={`${validation.percent}%`} />
        <Metric label="Cartas" value={`${validation.correct}/${validation.totalCards}`} />
        <Metric icon={<Clock className="size-4" />} label="Tiempo" value={fmt(timeSec)} />
      </div>

      <section className="bg-card rounded-3xl border border-border card-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Solución del Business Model Canvas</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {BLOCKS.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border p-4 bg-muted/30">
              <div className="text-[10px] font-bold uppercase text-brand tracking-wider mb-2">{b.name}</div>
              <ul className="space-y-1.5">
                {(cardsByBlock[b.id] ?? []).map((c) => {
                  const userPos = placement[c.id];
                  const ok = userPos === b.id;
                  return (
                    <li key={c.id} className="flex items-start gap-2 text-sm">
                      <span className="text-base leading-none pt-0.5">{c.icon}</span>
                      <span className="flex-1 text-foreground/85">{c.text}</span>
                      <span className={"text-[10px] font-bold uppercase " + (ok ? "text-success" : "text-trap")}>
                        {ok ? "✓" : "✗"}
                      </span>
                    </li>
                  );
                })}
                {!(cardsByBlock[b.id]?.length) && (
                  <li className="text-xs text-muted-foreground italic">Sin cartas para este bloque en esta partida.</li>
                )}
              </ul>
              <p className="text-[11px] text-muted-foreground mt-3 leading-snug">{b.hint}.</p>
            </div>
          ))}
        </div>
      </section>

      {startup.curiosities.length > 0 && (
        <section className="bg-brand-soft/60 rounded-3xl p-6 border border-brand/20">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand mb-3">Curiosidades</h3>
          <ul className="space-y-2 text-sm text-foreground/85">
            {startup.curiosities.map((c, i) => (
              <li key={i} className="flex gap-2"><span>💡</span><span>{c}</span></li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border font-semibold text-sm hover:bg-muted transition-colors"
        >
          <RefreshCw className="size-4" /> Volver a jugar
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-border font-semibold text-sm hover:bg-muted"
        >
          Volver a la campaña
        </Link>
        {nextStartupId && validation.percent >= 90 && (
          <Link
            to="/play/$startupId"
            params={{ startupId: nextStartupId }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand text-brand-foreground font-semibold text-sm brand-shadow hover:-translate-y-0.5 transition-transform"
          >
            Siguiente caso <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function Metric({ icon, label, value, accent }: { icon?: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={"rounded-2xl border border-border p-4 " + (accent ? "bg-brand text-brand-foreground brand-shadow" : "bg-card card-shadow")}>
      <div className={"flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold " + (accent ? "text-brand-foreground/80" : "text-muted-foreground")}>
        {icon}<span>{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}
