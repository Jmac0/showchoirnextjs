// A burst of golden sparkles flying out from the centre of its parent (give
// the parent `relative`). Bump `burst` to fire it again - each new value
// remounts the sparkles so the animation restarts. 0 shows nothing.
// The animation is the .sparkle class in global.css.

const SPARKLE_COUNT = 18;
const DISTANCES = [110, 80, 55];

// fixed spread so server and client render the same thing: even angles
// with alternating distances, sizes and delays so it doesn't look too regular
const sparkles = Array.from({ length: SPARKLE_COUNT }, (_, i) => {
  const angle = (i / SPARKLE_COUNT) * Math.PI * 2;
  const distance = DISTANCES[i % DISTANCES.length];
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
    size: i % 2 === 0 ? 14 : 8,
    delay: (i % 4) * 40,
  };
});

type Props = {
  burst: number;
};

export const SparkleBurst = ({ burst }: Props) => {
  if (!burst) return null;
  return (
    <span
      key={burst}
      className="pointer-events-none absolute left-1/2 top-1/2"
      aria-hidden="true"
    >
      {sparkles.map(({ x, y, size, delay }, i) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          className="sparkle"
          style={
            {
              "--sparkle-x": `${x}px`,
              "--sparkle-y": `${y}px`,
              width: size,
              height: size,
              animationDelay: `${delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
};

// --- Full-screen version ---

// A much bigger burst from the middle of the screen, filling most of it - for
// a celebration, e.g. the "Welcome to the Family" page after joining. Fires
// once when it appears. Same .sparkle stars, sized to the screen (vw/vh, so
// it fills wide screens too), in two waves so it feels like an explosion.
const BIG_SPARKLE_COUNT = 90;
const BIG_SIZES = [40, 16, 30, 12, 34, 22];

// A repeatable "random" number 0-1 for sparkle i (no Math.random, so server
// and client draw the same thing): the fractional part of i times an
// irrational number. Different step sizes give unrelated sequences - the
// first two together (the "R2" sequence) cover an area evenly, with no
// clumps or rings.
const scatter = (i: number, step: number) => (i * step) % 1;
const R2_A = 0.7548776662;
const R2_B = 0.569840291;

// Each flies out in a scattered direction, from a quarter of the way out to
// the screen's edges (square root, so the far-out ones aren't too sparse)
const bigSparkles = Array.from({ length: BIG_SPARKLE_COUNT }, (_, i) => {
  const angle = scatter(i, R2_A) * Math.PI * 2;
  const distance = 0.25 + 0.75 * Math.sqrt(scatter(i, R2_B));
  const secondWave = i % 2 === 1;
  return {
    x: `${(Math.cos(angle) * distance * 50).toFixed(1)}vw`,
    y: `${(Math.sin(angle) * distance * 50).toFixed(1)}vh`,
    size: BIG_SIZES[i % BIG_SIZES.length],
    delay: (secondWave ? 450 : 0) + Math.round(scatter(i, 0.4142135624) * 300),
    duration: 1300 + Math.round(scatter(i, 0.2360679775) * 600),
  };
});

export const ScreenSparkleBurst = () => (
  <span
    className="pointer-events-none fixed left-1/2 top-1/2 z-50"
    aria-hidden="true"
  >
    {bigSparkles.map(({ x, y, size, delay, duration }, i) => (
      <span
        // eslint-disable-next-line react/no-array-index-key
        key={i}
        className="sparkle"
        style={
          {
            "--sparkle-x": x,
            "--sparkle-y": y,
            width: size,
            height: size,
            animationDelay: `${delay}ms`,
            animationDuration: `${duration}ms`,
          } as React.CSSProperties
        }
      />
    ))}
  </span>
);
