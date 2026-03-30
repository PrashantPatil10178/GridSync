"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "./utils";

interface LoaderProps {
  className?: string;
  text?: string;
}

export function Loader({ className, text = "Connecting..." }: LoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className,
      )}
    >
      {/* Animated grid loader */}
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-sm bg-muted-foreground/50"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground font-medium">{text}</span>
    </div>
  );
}

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <div className={cn("relative group inline-block", className)}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-border">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-secondary" />
      </div>
    </div>
  );
}
