import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BlockId } from "@/game/types";

interface Props {
  id: BlockId | "discarded";
  label: string;
  hideName?: boolean;
  children?: ReactNode;
  className?: string;
  emphasize?: boolean;
  wrong?: boolean;
}

export function DropZone({ id, label, hideName, children, className, emphasize, wrong }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <motion.div
      ref={setNodeRef}
      layout
      className={cn(
        "rounded-3xl p-3 flex flex-col gap-2 transition-colors min-h-0",
        "border-2 border-dashed border-border bg-card/40",
        isOver && "border-brand bg-brand-soft",
        emphasize && "border-brand/40 bg-brand-soft/60",
        wrong && "border-trap/60 bg-trap-soft",
        className,
      )}
    >
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-wider",
        emphasize ? "text-brand" : "text-muted-foreground",
      )}>
        {hideName ? "???" : label}
      </span>
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
        {children}
      </div>
    </motion.div>
  );
}
