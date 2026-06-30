"use client";
import React from "react";

export interface Testimonial {
  text: string;
  image?: string;
  name: string;
  role: string;
  rating?: number;
}

/* Small inline star row (no `star` glyph in the project Icon set). */
function Stars({ rating = 5 }: { rating?: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div style={{ display: "flex", gap: 2, marginBottom: 14 }} aria-label={`${r} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill={i < r ? "var(--nr-accent)" : "transparent"}
          stroke={i < r ? "var(--nr-accent)" : "var(--border-default)"}
          strokeWidth={1.5}
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
        </svg>
      ))}
    </div>
  );
}

/* First-letter monogram avatar with a deterministic background colour
   derived from the name (no photos — they read as fake stock imagery). */
const AVATAR_COLORS = [
  "#EA580C", // orange (brand)
  "#0F766E", // teal
  "#1D4ED8", // blue
  "#7C3AED", // violet
  "#B91C1C", // red
  "#0369A1", // sky
  "#4D7C0F", // olive
  "#9333EA", // purple
];

function Avatar({ name }: { name: string }) {
  const letter = (name.trim()[0] || "?").toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const bg = AVATAR_COLORS[hash % AVATAR_COLORS.length];

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        width: 40,
        flexShrink: 0,
        borderRadius: "50%",
        background: bg,
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontWeight: "var(--fw-bold)",
        fontSize: 17,
      }}
    >
      {letter}
    </span>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        padding: 28,
        maxWidth: 320,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {typeof t.rating === "number" && <Stars rating={t.rating} />}
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-body)",
          lineHeight: "var(--lh-body)",
          color: "var(--text-body)",
        }}
      >
        {t.text}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
        <Avatar name={t.name} />
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: "var(--fw-semibold)",
              letterSpacing: "-0.01em",
              lineHeight: 1.25,
              color: "var(--text-strong)",
            }}
          >
            {t.name}
          </div>
          <div
            style={{
              lineHeight: 1.25,
              fontSize: "var(--fs-body-sm)",
              color: "var(--text-muted)",
            }}
          >
            {t.role}
          </div>
        </div>
      </div>
    </div>
  );
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  // Always-on continuous scroll via CSS keyframes (never pauses, incl. on hover).
  // Content is duplicated so translateY(-50%) loops seamlessly.
  return (
    <div className={props.className}>
      <div
        className="nr-testi-track"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          paddingBottom: 24,
          animationDuration: `${props.duration || 10}s`,
        }}
      >
        {[0, 1].map((dup) => (
          <React.Fragment key={dup}>
            {props.testimonials.map((t, i) => (
              <TestimonialCard key={`${dup}-${i}`} t={t} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
