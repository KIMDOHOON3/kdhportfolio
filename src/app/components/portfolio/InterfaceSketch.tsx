"use client";

import { useEffect, useRef } from "react";
import styles from "./Portfolio.module.scss";

export default function InterfaceSketch() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          svg.dataset.drawn = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  return (
    <svg
      ref={ref}
      viewBox="0 0 480 400"
      className={styles.interfaceSketch}
      role="img"
      aria-label="선과 면이 차례로 그려지는 웹 인터페이스"
      data-interface-sketch
    >
      <g
        className={styles.sketchStroke}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="24" y="40" width="432" height="310" rx="12" pathLength="1" />
        <path d="M24 82H456 M130 82V350" pathLength="1" />
        <path
          d="M49 109H103 M49 130H88 M49 172H100 M49 194H92 M49 216H105"
          pathLength="1"
          style={{ transitionDelay: "200ms" }}
        />
        <rect
          x="153"
          y="109"
          width="279"
          height="100"
          rx="6"
          pathLength="1"
          style={{ transitionDelay: "380ms" }}
        />
        <rect
          x="153"
          y="231"
          width="128"
          height="90"
          rx="6"
          pathLength="1"
          style={{ transitionDelay: "560ms" }}
        />
        <rect
          x="303"
          y="231"
          width="129"
          height="90"
          rx="6"
          pathLength="1"
          style={{ transitionDelay: "730ms" }}
        />
      </g>
      <g className={styles.sketchFill}>
        <circle cx="45" cy="61" r="3" fill="currentColor" />
        <circle cx="57" cy="61" r="3" fill="currentColor" opacity=".45" />
        <circle cx="69" cy="61" r="3" fill="currentColor" opacity=".2" />
        <rect
          x="49"
          y="145"
          width="57"
          height="8"
          rx="4"
          fill="#4b74b1"
          opacity=".6"
        />
        <rect x="154" y="110" width="277" height="98" rx="5" fill="#d9e6f3" />
        <rect x="173" y="129" width="107" height="8" rx="4" fill="#4b74b1" />
        <rect
          x="173"
          y="147"
          width="161"
          height="5"
          rx="2.5"
          fill="#6686a5"
          opacity=".5"
        />
        <rect
          x="173"
          y="160"
          width="139"
          height="5"
          rx="2.5"
          fill="#6686a5"
          opacity=".3"
        />
        <rect x="173" y="179" width="58" height="13" rx="6.5" fill="#4b74b1" />
        <path
          d="M171 286L191 268L210 279L236 251L262 262"
          fill="none"
          stroke="#4b74b1"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="321"
          y="252"
          width="72"
          height="5"
          rx="2.5"
          fill="currentColor"
          opacity=".5"
        />
        <rect
          x="321"
          y="265"
          width="91"
          height="4"
          rx="2"
          fill="currentColor"
          opacity=".15"
        />
        <rect
          x="321"
          y="277"
          width="79"
          height="4"
          rx="2"
          fill="currentColor"
          opacity=".15"
        />
        <rect x="321" y="294" width="49" height="10" rx="5" fill="#d9e6f3" />
      </g>
      <path
        className={styles.sketchCursor}
        d="M265 173L271 206L279 195L293 193Z"
        fill="#4b74b1"
        stroke="#fbfaf4"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
