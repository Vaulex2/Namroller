"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NavHeaderItem {
  id: string;
  label: string;
}

interface NavHeaderProps {
  items?: NavHeaderItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  /** Render for a dark/inverse surface (e.g. the navy site header). */
  light?: boolean;
}

interface CursorPosition {
  left: number;
  width: number;
  opacity: number;
}

function NavHeader({ items = [], activeId, onSelect, light = false }: NavHeaderProps) {
  const tabRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [position, setPosition] = useState<CursorPosition>({ left: 0, width: 0, opacity: 0 });

  // Rest the sliding cursor under the active tab; hide it if nothing is active.
  const settleOnActive = () => {
    const el = activeId ? tabRefs.current[activeId] : null;
    if (el) {
      setPosition({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    } else {
      setPosition((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  useEffect(settleOnActive, [activeId, items]);

  return (
    <ul
      onMouseLeave={() => {
        setHoveredId(null);
        settleOnActive();
      }}
      className={cn(
        "relative flex w-fit items-center rounded-full border p-1",
        light ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
      )}
    >
      {items.map((item) => {
        const lit = item.id === activeId || item.id === hoveredId;
        return (
          <li
            key={item.id}
            ref={(el) => {
              tabRefs.current[item.id] = el;
            }}
            onMouseEnter={() => {
              const el = tabRefs.current[item.id];
              if (!el) return;
              setHoveredId(item.id);
              setPosition({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
            }}
            onClick={() => onSelect?.(item.id)}
            className={cn(
              "relative z-10 block cursor-pointer rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:px-5 md:text-sm",
              lit ? "text-white" : light ? "text-slate-300" : "text-slate-600"
            )}
          >
            {item.label}
          </li>
        );
      })}

      <Cursor position={position} />
    </ul>
  );
}

function Cursor({ position }: { position: CursorPosition }) {
  return (
    <motion.li
      aria-hidden="true"
      animate={position}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="absolute inset-y-1 z-0 rounded-full bg-[var(--nr-accent)]"
    />
  );
}

export default NavHeader;
