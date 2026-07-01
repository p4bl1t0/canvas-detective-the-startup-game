import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import type { GameCard as TCard } from "@/game/types";
import { cn } from "@/lib/utils";

interface Props {
  card: TCard;
  compact?: boolean;
  highlightWrong?: boolean;
  revealTrap?: boolean;
}

export function GameCardView({ card, compact, highlightWrong, revealTrap }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 40 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      {...listeners}
      {...attributes}
      className={cn(
        "select-none cursor-grab active:cursor-grabbing touch-none",
        "bg-card rounded-2xl card-shadow border border-border",
        "hover:border-brand/50 transition-colors group",
        compact ? "p-3" : "p-4",
        highlightWrong && "ring-2 ring-trap ring-offset-2",
        revealTrap && "ring-2 ring-warning ring-offset-2",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="size-9 shrink-0 rounded-lg bg-muted flex items-center justify-center text-lg group-hover:bg-brand-soft transition-colors">
          <span>{card.icon}</span>
        </div>
        <p className="text-sm font-medium text-foreground/80 leading-snug pt-1">{card.text}</p>
      </div>
    </motion.div>
  );
}
