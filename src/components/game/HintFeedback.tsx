import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  messages: string[];
  variant?: "info" | "success";
}

export function HintFeedback({ messages, variant = "info" }: Props) {
  return (
    <AnimatePresence mode="popLayout">
      {messages.map((m, i) => (
        <motion.div
          key={m + i}
          layout
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
          className={
            "flex items-start gap-3 rounded-2xl px-4 py-3 text-sm border " +
            (variant === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-muted/60 border-border text-foreground/80")
          }
        >
          {variant === "success" ? (
            <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
          )}
          <span className="leading-snug">{m}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
