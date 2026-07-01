import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import startupsData from "@/data/startups.json";
import type { StartupData } from "@/game/types";
import { loadStore, type GameStore } from "@/game/storage";

const data = startupsData as StartupData;

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Estadísticas — Canvas Detective" },
      { name: "description", content: "Tu progreso y récords personales en Canvas Detective." },
    ],
  }),
  component: StatsPage,
});

function fmt(sec: number) {
  if (!isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StatsPage() {
  const [store, setStore] = useState<GameStore>({ stats: {}, unlocked: {} });
  useEffect(() => setStore(loadStore()), []);

  const totalScore = Object.values(store.stats).reduce((a, s) => a + s.bestScore, 0);
  const completed = Object.values(store.stats).filter((s) => s.completed).length;

  return (
    <div className="min-h-screen">
      <nav className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <div className="text-sm text-muted-foreground">
          <Trophy className="inline size-4 mr-1 text-brand" />
          <strong className="text-foreground">{totalScore.toLocaleString()}</strong> pts totales
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Tus estadísticas</h1>
          <p className="text-muted-foreground mt-1">
            {completed} de {data.startups.length} casos resueltos.
          </p>
        </header>

        <div className="grid gap-3">
          {data.startups.map((s, i) => {
            const stat = store.stats[s.id];
            return (
              <div key={s.id} className="bg-card border border-border rounded-3xl p-5 card-shadow flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-brand mb-1">Caso #{i + 1} · {s.difficulty}</div>
                  <h3 className="font-bold">{stat?.completed ? s.name : "Sin descubrir"}</h3>
                </div>
                <div className="grid grid-cols-4 gap-6 text-right">
                  <Cell label="Puntaje" value={stat?.bestScore.toLocaleString() ?? "—"} />
                  <Cell label="Aciertos" value={stat ? `${stat.bestPercent}%` : "—"} />
                  <Cell label="Mejor tiempo" value={stat ? fmt(stat.bestTimeSec) : "—"} />
                  <Cell label="Intentos" value={stat?.attempts.toString() ?? "0"} />
                </div>
              </div>
            );
          })}
        </div>

        {completed === 0 && (
          <p className="text-center text-sm text-muted-foreground italic">
            Aún no completaste ningún caso. Empieza por el <Link to="/" className="text-brand font-semibold underline">Caso #1</Link>.
          </p>
        )}
      </main>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</div>
      <div className="text-sm font-bold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
