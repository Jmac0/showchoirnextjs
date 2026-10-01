import React from "react";

// Website version of the Expo app's FlexiSessionsRing
// (showChoirExpoApp/src/components/FlexiSessionsRing.tsx) - same look and
// rules, drawn with a plain SVG instead of react-native-svg.

const SIZE = 160;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Green while sessions are plentiful, tapering through amber to red as they run out.
function getFillColor(percentRemaining: number) {
  if (percentRemaining > 0.6) return "#22c55e";
  if (percentRemaining > 0.3) return "#f59e0b";
  return "#ef4444";
}

type Props = {
  // Sessions left - negative if they owe sessions after "pay later"
  remaining: number;
  // A full pack, for how full the ring is drawn
  total?: number;
};

// Ring showing a flexi member's sessions left, or how many they owe (in red)
// if they've paid later at a rehearsal.
export function FlexiSessionsRing({ remaining, total = 10 }: Props) {
  // The DB only tracks a running total, not what was originally granted, so
  // a top-up (e.g. buying 10 more while 5 remain) can push remaining above
  // total. Cap the ring's fill at "full" in that case, but keep showing the
  // real count in the centre.
  const safeRemaining = Math.max(0, remaining);
  const percentRemaining =
    total > 0 ? Math.min(safeRemaining, total) / total : 0;
  const fillColor = getFillColor(percentRemaining);
  // Negative after "pay later" at rehearsal - taken off their next pack
  // (e.g. owes 1, buys 10, has 9). 0 when they don't owe anything.
  const owed = remaining < 0 ? -remaining : 0;

  return (
    <div
      className="relative"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={
        owed
          ? `${owed} Flexi session${owed === 1 ? "" : "s"} owed`
          : `${safeRemaining} Flexi sessions left`
      }
    >
      <svg width={SIZE} height={SIZE} aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          // Background track: pale red when they owe, grey otherwise
          stroke={owed ? "#fca5a5" : "#e5e7eb"}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={fillColor}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - percentRemaining)}
          fill="none"
          // Start the fill at 12 o'clock rather than 3 o'clock
          transform={`rotate(-90, ${SIZE / 2}, ${SIZE / 2})`}
          // Animates the fill when the count changes (e.g. after a top-up)
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s" }}
        />
      </svg>

      {/* Centre text: "2 sessions owed" in red, or "7 sessions left" */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {owed ? (
          <>
            <span className="text-3xl font-bold text-red-400">{owed}</span>
            <span className="text-xs text-white">
              session{owed === 1 ? "" : "s"} owed
            </span>
          </>
        ) : (
          <>
            <span className="text-3xl font-bold text-white">
              {safeRemaining}
            </span>
            <span className="text-xs text-white">sessions left</span>
          </>
        )}
      </div>
    </div>
  );
}

FlexiSessionsRing.defaultProps = {
  total: 10,
};
