import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lightbulb, RefreshCw, Trash2, Eye } from "lucide-react";

import startupsData from "@/data/startups.json";
import type { BlockId, GameCard, Placement, StartupData } from "@/game/types";
import { BLOCKS } from "@/game/types";
import { validate } from "@/game/validation";
import { computeScore } from "@/game/scoring";
import { recordResult } from "@/game/storage";

import { GameCardView } from "@/components/game/GameCardView";
import { DropZone } from "@/components/game/DropZone";
import { Hud } from "@/components/game/Hud";
import { HintFeedback } from "@/components/game/HintFeedback";
import { FinalScreen } from "@/components/game/FinalScreen";

const data = startupsData as StartupData;

export const Route = createFileRoute("/play/$startupId")({
  head: () => ({
    meta: [
      { title: "Partida — Canvas Detective" },
      { name: "description", content: "Reconstruye el Business Model Canvas de la startup misteriosa." },
    ],
  }),
  component: PlayPage,
});

const MAX_HINTS = 4;
const UNLOCK_PERCENT = 90;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function PlayPage() {
  const { startupId } = Route.useParams();
  const navigate = useNavigate();

  const startup = useMemo(() => data.startups.find((s) => s.id === startupId), [startupId]);
  const nextStartupId = useMemo(() => {
    if (!startup) return null;
    const idx = data.startups.findIndex((s) => s.id === startup.id);
    return data.startups[idx + 1]?.id ?? null;
  }, [startup]);

  const [seed, setSeed] = useState(0);
  const shuffledCards = useMemo<GameCard[]>(
    () => (startup ? shuffle(startup.cards) : []),
    // reshuffle on retry
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startup, seed],
  );

  const [placement, setPlacement] = useState<Placement>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [guess, setGuess] = useState("");
  const [guessed, setGuessed] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeSec, setTimeSec] = useState(0);
  const [finished, setFinished] = useState(false);
  const [wrongCardId, setWrongCardId] = useState<string | null>(null);
  const [wrongBlockId, setWrongBlockId] = useState<BlockId | null>(null);
  const [expertMode] = useState(startup?.difficulty === "expert");
  const finalRef = useRef<{ score: number; timeSec: number } | null>(null);

  // Timer
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setTimeSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [finished]);

  // Guess detection
  useEffect(() => {
    if (!startup || !guess) {
      setGuessed(null);
      return;
    }
    if (normalize(guess) === normalize(startup.name)) setGuessed(true);
  }, [guess, startup]);

  if (!startup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Startup no encontrada.</p>
          <Link to="/" className="text-brand font-semibold underline">Volver</Link>
        </div>
      </div>
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
  );

  const validation = useMemo(() => validate(shuffledCards, placement), [shuffledCards, placement]);
  const liveScore = computeScore({
    validation,
    timeSec,
    hintsUsed,
    validationAttempts: attempts,
    moves,
    startupGuessed: guessed === true,
  });

  const cardsIn = (zone: BlockId | "hand" | "discarded") =>
    shuffledCards.filter((c) => (placement[c.id] ?? "hand") === zone);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setWrongCardId(null);
    setWrongBlockId(null);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!e.over) return;
    const cardId = String(e.active.id);
    const target = String(e.over.id) as BlockId | "discarded";
    setPlacement((prev) => {
      if (prev[cardId] === target) return prev;
      setMoves((m) => m + 1);
      return { ...prev, [cardId]: target };
    });
  }

  function handleValidate() {
    setAttempts((a) => a + 1);
    if (validation.percent >= UNLOCK_PERCENT) {
      const score = computeScore({
        validation,
        timeSec,
        hintsUsed,
        validationAttempts: attempts + 1,
        moves,
        startupGuessed: guessed === true,
      });
      finalRef.current = { score, timeSec };
      recordResult(startup.id, score, validation.percent, timeSec, hintsUsed, nextStartupId);
      setFinished(true);
      return;
    }
    setFeedback(validation.hints.slice(0, 3));
  }

  function handleHint() {
    if (hintsUsed >= MAX_HINTS) return;
    const nextLevel = hintsUsed + 1;
    setHintsUsed(nextLevel);
    if (nextLevel === 1) {
      const wrong = validation.misplaced + validation.undiscoveredTraps + validation.wronglyDiscardedModels;
      setFeedback([`Tienes ${wrong} carta${wrong === 1 ? "" : "s"} mal ubicada${wrong === 1 ? "" : "s"} o sin descubrir.`]);
    } else if (nextLevel === 2) {
      const wrongBlock =
        validation.incompleteBlocks[0] ??
        validation.overfullBlocks[0] ??
        null;
      if (wrongBlock) {
        setWrongBlockId(wrongBlock);
        const def = BLOCKS.find((b) => b.id === wrongBlock)!;
        setFeedback([`Revisa el bloque "${def.name}".`]);
      } else {
        setFeedback([`Todos los bloques están bien poblados. Revisa tus cartas descartadas.`]);
      }
    } else if (nextLevel === 3) {
      const wrongEntry = Object.entries(validation.perCard).find(([, v]) => v !== "correct" && v !== "missing");
      if (wrongEntry) {
        setWrongCardId(wrongEntry[0]);
        setFeedback([`Una carta destacada en rojo está mal ubicada.`]);
      } else {
        setFeedback([`No hay cartas ubicadas incorrectamente, pero faltan algunas.`]);
      }
    } else if (nextLevel === 4) {
      // Auto-solve
      const auto: Placement = {};
      for (const c of shuffledCards) {
        if (c.type === "model" && c.block) auto[c.id] = c.block;
        else auto[c.id] = "discarded";
      }
      setPlacement(auto);
      setFeedback([`Solución revelada. Puntaje reducido al máximo.`]);
    }
  }

  function handleReset() {
    setPlacement({});
    setFeedback([]);
    setWrongCardId(null);
    setWrongBlockId(null);
    setMoves((m) => m + 1);
  }

  function handleRetry() {
    setPlacement({});
    setAttempts(0);
    setHintsUsed(0);
    setFeedback([]);
    setMoves(0);
    setTimeSec(0);
    setFinished(false);
    setWrongCardId(null);
    setWrongBlockId(null);
    setGuess("");
    setGuessed(null);
    setSeed((s) => s + 1);
  }

  const activeCard = activeId ? shuffledCards.find((c) => c.id === activeId) ?? null : null;

  if (finished && finalRef.current) {
    return (
      <FinalScreen
        startup={startup}
        validation={validation}
        placement={placement}
        score={finalRef.current.score}
        timeSec={finalRef.current.timeSec}
        onRetry={handleRetry}
        nextStartupId={nextStartupId}
      />
    );
  }

  const handCards = cardsIn("hand");
  const discarded = cardsIn("discarded");

  return (
    <div className="min-h-screen pb-40">
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="size-10 bg-brand rounded-xl flex items-center justify-center text-brand-foreground brand-shadow group-hover:scale-105 transition-transform">
            <span className="text-xl font-bold">C</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none">Canvas Detective</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Caso #{data.startups.findIndex((s) => s.id === startup.id) + 1} · {startup.difficulty}
            </p>
          </div>
        </Link>
        <button
          onClick={() => navigate({ to: "/" })}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Abandonar caso
        </button>
      </nav>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <main className="max-w-7xl mx-auto px-6 grid grid-cols-12 gap-6 mt-2">
          <div className="col-span-12 lg:col-span-3">
            <Hud
              score={liveScore}
              timeSec={timeSec}
              hintsUsed={hintsUsed}
              maxHints={MAX_HINTS}
              valueProposition={startup.valueProposition}
              guess={guess}
              onGuess={setGuess}
              guessed={guessed}
            />

            <div className="mt-4 space-y-2">
              <AnimatePresence>
                {feedback.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <HintFeedback messages={feedback} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
            <div className="grid grid-cols-5 gap-3 lg:h-[520px]">
              <DropZone id="key_partners" label="Asociaciones Clave" hideName={expertMode} className="row-span-2">
                {cardsIn("key_partners").map((c) => (
                  <GameCardView key={c.id} card={c} compact highlightWrong={wrongCardId === c.id} />
                ))}
              </DropZone>
              <div className="flex flex-col gap-3">
                <DropZone id="key_activities" label="Actividades Clave" hideName={expertMode} className="flex-1">
                  {cardsIn("key_activities").map((c) => (
                    <GameCardView key={c.id} card={c} compact highlightWrong={wrongCardId === c.id} />
                  ))}
                </DropZone>
                <DropZone id="key_resources" label="Recursos Clave" hideName={expertMode} className="flex-1">
                  {cardsIn("key_resources").map((c) => (
                    <GameCardView key={c.id} card={c} compact highlightWrong={wrongCardId === c.id} />
                  ))}
                </DropZone>
              </div>
              <DropZone id="value_proposition" label="Propuesta de Valor" emphasize wrong={wrongBlockId === "value_proposition"} className="row-span-2">
                {cardsIn("value_proposition").map((c) => (
                  <GameCardView key={c.id} card={c} compact highlightWrong={wrongCardId === c.id} />
                ))}
              </DropZone>
              <div className="flex flex-col gap-3">
                <DropZone id="customer_relationships" label="Relaciones" hideName={expertMode} wrong={wrongBlockId === "customer_relationships"} className="flex-1">
                  {cardsIn("customer_relationships").map((c) => (
                    <GameCardView key={c.id} card={c} compact highlightWrong={wrongCardId === c.id} />
                  ))}
                </DropZone>
                <DropZone id="channels" label="Canales" hideName={expertMode} wrong={wrongBlockId === "channels"} className="flex-1">
                  {cardsIn("channels").map((c) => (
                    <GameCardView key={c.id} card={c} compact highlightWrong={wrongCardId === c.id} />
                  ))}
                </DropZone>
              </div>
              <DropZone id="customer_segments" label="Segmentos" hideName={expertMode} wrong={wrongBlockId === "customer_segments"} className="row-span-2">
                {cardsIn("customer_segments").map((c) => (
                  <GameCardView key={c.id} card={c} compact highlightWrong={wrongCardId === c.id} />
                ))}
              </DropZone>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DropZone id="cost_structure" label="Estructura de Costes" hideName={expertMode} wrong={wrongBlockId === "cost_structure"} className="min-h-[120px]">
                {cardsIn("cost_structure").map((c) => (
                  <GameCardView key={c.id} card={c} compact highlightWrong={wrongCardId === c.id} />
                ))}
              </DropZone>
              <DropZone id="revenue_streams" label="Fuentes de Ingresos" hideName={expertMode} wrong={wrongBlockId === "revenue_streams"} className="min-h-[120px]">
                {cardsIn("revenue_streams").map((c) => (
                  <GameCardView key={c.id} card={c} compact highlightWrong={wrongCardId === c.id} />
                ))}
              </DropZone>
            </div>

            <div className="flex items-center justify-between bg-card rounded-3xl p-3 card-shadow border border-border sticky bottom-24 z-10">
              <div className="flex gap-1">
                <button
                  onClick={handleHint}
                  disabled={hintsUsed >= MAX_HINTS}
                  className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-brand hover:bg-brand-soft rounded-2xl transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {hintsUsed >= 3 ? <Eye className="size-4" /> : <Lightbulb className="size-4" />}
                  Pista {hintsUsed}/{MAX_HINTS}
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-trap hover:bg-trap-soft rounded-2xl transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="size-4" /> Reiniciar
                </button>
              </div>
              <button
                onClick={handleValidate}
                className="px-8 py-3 bg-brand text-brand-foreground rounded-2xl font-bold text-sm brand-shadow hover:-translate-y-0.5 transition-transform active:scale-95"
              >
                VALIDAR MODELO
              </button>
            </div>
          </div>
        </main>

        {/* Bottom fixed: hand + discarded */}
        <motion.footer
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 bg-card/85 backdrop-blur-md border-t border-border pt-3 pb-4 px-6 z-20"
        >
          <div className="max-w-7xl mx-auto flex items-stretch gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Tu mano · {handCards.length} carta{handCards.length === 1 ? "" : "s"}
                </h3>
                <span className="text-[10px] text-muted-foreground">Arrastra al canvas o a la papelera</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <AnimatePresence>
                  {handCards.map((c) => (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="w-56 shrink-0"
                    >
                      <GameCardView card={c} highlightWrong={wrongCardId === c.id} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {handCards.length === 0 && (
                  <p className="text-xs text-muted-foreground italic py-6">Ya no quedan cartas en tu mano.</p>
                )}
              </div>
            </div>
            <div className="w-56 shrink-0">
              <DropZone id="discarded" label="Trampas" className="h-full min-h-[120px] border-trap/30 bg-trap-soft/40">
                <div className="flex items-center gap-1.5 text-[11px] text-trap font-semibold -mt-1">
                  <Trash2 className="size-3.5" />
                  <span>Cartas que no son parte del modelo</span>
                </div>
                {discarded.map((c) => (
                  <GameCardView key={c.id} card={c} compact highlightWrong={wrongCardId === c.id} />
                ))}
              </DropZone>
            </div>
          </div>
        </motion.footer>

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div className="w-56 rotate-2 opacity-95">
              <GameCardView card={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
