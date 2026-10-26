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
