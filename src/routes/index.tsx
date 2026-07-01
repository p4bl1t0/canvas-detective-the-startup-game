import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Play, Sparkles, BarChart3, Trophy } from "lucide-react";

import startupsData from "@/data/startups.json";
import type { StartupData } from "@/game/types";
import { loadStore, type GameStore } from "@/game/storage";

const data = startupsData as StartupData;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Canvas Detective — juego de Business Model Canvas" },
      { name: "description", content: "Descubre startups reconstruyendo su Business Model Canvas. Un juego de lógica y deducción para aprender modelos de negocio." },
      { property: "og:title", content: "Canvas Detective" },
      { property: "og:description", content: "Reconstruye el modelo de negocio de startups famosas. Aprende Business Model Canvas jugando." },
    ],
  }),
  component: Home,
});

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
  expert: "Experto",
};

function Home() {
  const [store, setStore] = useState<GameStore>({ stats: {}, unlocked: {} });
  useEffect(() => setStore(loadStore()), []);

  const firstId = data.startups[0]?.id;

  return (
    <div className="min-h-screen">
      <nav className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-brand rounded-xl flex items-center justify-center text-brand-foreground brand-shadow">
            <span className="text-xl font-bold">C</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight">Canvas Detective</h1>
        </div>
        <Link
          to="/stats"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
        >
          <BarChart3 className="size-4" /> Estadísticas
        </Link>
      </nav>

      <header className="max-w-3xl mx-auto text-center px-6 pt-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-brand-soft text-brand px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-5"
        >
          <Sparkles className="size-3" /> Juego educativo
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-balance"
        >
          Descubre startups reconstruyendo su <span className="text-brand">Business Model Canvas</span>.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-lg text-muted-foreground text-balance"
        >
          Lee la propuesta de valor, adivina la empresa y coloca cada carta en el bloque correcto. Cuidado con las trampas.
        </motion.p>
      </header>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 mb-4">Modo Campaña</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {data.startups.map((s, i) => {
            const stat = store.stats[s.id];
            const unlocked = i === 0 || !!store.unlocked[s.id];
            const completed = !!stat?.completed;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className={
                  "relative rounded-3xl border p-6 card-shadow transition-all " +
                  (unlocked
                    ? "bg-card border-border hover:-translate-y-1 hover:brand-shadow"
                    : "bg-muted/40 border-border opacity-70")
                }
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand-soft px-2.5 py-1 rounded-full">
                    Nivel {i + 1} · {DIFFICULTY_LABEL[s.difficulty]}
                  </span>
                  {completed && (
                    <div className="flex items-center gap-1 text-success text-xs font-semibold">
                      <Trophy className="size-3.5" /> {stat!.bestPercent}%
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-bold mb-1">
                  {unlocked ? `Caso #${i + 1}` : "???"}
                </h4>
                <p className="text-sm text-muted-foreground mb-6 min-h-[3.5rem]">
                  {unlocked
                    ? "Reconstruye el modelo a partir de la propuesta de valor y las cartas disponibles."
                    : "Completa el caso anterior con al menos 90% para desbloquear este nivel."}
                </p>
                {unlocked ? (
                  <Link
                    to="/play/$startupId"
                    params={{ startupId: s.id }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-brand-foreground rounded-2xl font-semibold text-sm brand-shadow hover:-translate-y-0.5 transition-transform"
                  >
                    <Play className="size-4" /> {completed ? "Volver a jugar" : "Empezar caso"}
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted text-muted-foreground rounded-2xl font-semibold text-sm">
                    <Lock className="size-4" /> Bloqueado
                  </div>
                )}
                {stat && (
                  <div className="mt-4 pt-4 border-t border-border/60 flex justify-between text-[11px] text-muted-foreground">
                    <span>Mejor: <strong className="text-foreground">{stat.bestScore.toLocaleString()}</strong> pts</span>
                    <span>{stat.attempts} intento{stat.attempts === 1 ? "" : "s"}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {firstId && (
          <div className="mt-10 text-center text-xs text-muted-foreground">
            Empieza por el <Link to="/play/$startupId" params={{ startupId: firstId }} className="text-brand font-semibold underline">Caso #1</Link>.
          </div>
        )}
      </section>
    </div>
  );
}
