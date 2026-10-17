"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Portfolio.module.scss";

export default function ViewportGrid() {
  const host = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState({
    width: 0,
    height: 0,
    lines: "",
    crosses: "",
  });
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      const inset = width < 1024 ? 16 : 56;
      const count = width < 1280 ? 2 : 3;
      const rails = Array.from(
        { length: count + 1 },
        (_, i) => Math.round(inset + ((width - inset * 2) * i) / count) + 0.5,
      );
      const rows = [height / 3, (height * 2) / 3 + 12];
      const lines =
        rails
          .map(
            (x) =>
              `M${x} 0V${rows[0] - 12}M${x} ${rows[0] + 12}V${rows[1] - 12}M${x} ${rows[1] + 12}V${height}`,
          )
          .join("") +
        rows
          .map((y) =>
            [
              `M0 ${y}H${inset - 12}`,
              ...rails
                .slice(0, -1)
                .map((x, i) => `M${x + 12} ${y}H${rails[i + 1] - 12}`),
              `M${rails[rails.length - 1] + 12} ${y}H${width}`,
            ].join(""),
          )
          .join("");
      const crosses = rails
        .flatMap((x) => rows.map((y) => `M${x - 6} ${y}h12M${x} ${y - 6}v12`))
        .join("");
      setGrid({ width, height, lines, crosses });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={host} className={styles.viewportGrid} aria-hidden="true">
      {grid.width > 0 && (
        <svg viewBox={`0 0 ${grid.width} ${grid.height}`} fill="none">
          <path d={grid.lines} className={styles.gridLines} />
          <path d={grid.crosses} className={styles.gridCrosses} />
        </svg>
      )}
    </div>
  );
}
