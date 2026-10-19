"use client";

import FadeContent, { type FadeContentProps } from "./react-bits/FadeContent";

export default function ContentReveal(props: FadeContentProps) {
  return (
    <FadeContent
      container="[data-scroll-viewport]"
      effect="mist"
      duration={1.8}
      ease="power2.out"
      stagger={0.1}
      threshold={0.1}
      once
      {...props}
    />
  );
}
