"use client";

import { useEffect, useRef, type RefObject } from "react";
import ArrowIcon from "./ArrowIcon";
import styles from "./ProjectGallery.module.scss";

/** A decorative cursor; real links and the scene's picking still own clicks. */
export default function GalleryPointer({
  stage,
}: {
  stage: RefObject<HTMLDivElement | null>;
}) {
  const pointer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = stage.current;
    const cursor = pointer.current;
    if (!area || !cursor) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = area.closest("[data-scroll-viewport]");
    let bounds: DOMRect | null = null;
    let frame = 0;
    let previous = 0;
    let shown = false;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let clientX = 0;
    let clientY = 0;

    const hide = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      shown = false;
      bounds = null;
      delete cursor.dataset.active;
      delete area.dataset.cursorActive;
    };
    const configure = () => {
      area.dataset.cursorEnabled = String(fine.matches);
      hide();
    };
    const draw = (time: number) => {
      frame = 0;
      if (!fine.matches || area.dataset.dragging === "true") {
        hide();
        return;
      }
      // Picking the actual surface keeps the follower off the reflection and
      // empty space. The synchronous event avoids React state on pointer move.
      const point = { x: clientX, y: clientY, id: null as number | null };
      area
        .querySelector("[data-gallery-canvas]")
        ?.dispatchEvent(new CustomEvent("gallery:hover", { detail: point }));
      if (!point.id) {
        hide();
        return;
      }
      if (!shown) {
        x = targetX;
        y = targetY;
        shown = true;
        cursor.dataset.active = "true";
        area.dataset.cursorActive = "true";
      }
      const delta = previous
        ? Math.min(0.05, (time - previous) / 1000)
        : 1 / 60;
      const blend = reduced.matches ? 1 : 1 - Math.exp(-18 * delta);
      x += (targetX - x) * blend;
      y += (targetY - y) * blend;
      cursor.style.transform = `translate3d(${x - 28}px, ${y - 28}px, 0)`;
      previous = time;
      if (Math.abs(x - targetX) + Math.abs(y - targetY) > 0.15)
        frame = requestAnimationFrame(draw);
      else previous = 0;
    };
    const move = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType !== "mouse" || event.buttons) {
        hide();
        return;
      }
      bounds ??= area.getBoundingClientRect();
      clientX = event.clientX;
      clientY = event.clientY;
      targetX = Math.max(
        32,
        Math.min(bounds.width - 32, clientX - bounds.left),
      );
      targetY = Math.max(
        32,
        Math.min(bounds.height - 32, clientY - bounds.top),
      );
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Tab") hide();
    };

    configure();
    area.addEventListener("pointermove", move, { passive: true });
    area.addEventListener("pointerleave", hide);
    area.addEventListener("pointerdown", hide);
    area.addEventListener("pointercancel", hide);
    viewport?.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("keydown", key);
    fine.addEventListener("change", configure);
    reduced.addEventListener("change", hide);
    return () => {
      hide();
      delete area.dataset.cursorEnabled;
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerleave", hide);
      area.removeEventListener("pointerdown", hide);
      area.removeEventListener("pointercancel", hide);
      viewport?.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("keydown", key);
      fine.removeEventListener("change", configure);
      reduced.removeEventListener("change", hide);
    };
  }, [stage]);

  return (
    <div
      ref={pointer}
      className={styles.pointer}
      data-gallery-pointer
      aria-hidden="true"
    >
      <span className={styles.pointerOrb}>
        <ArrowIcon />
      </span>
    </div>
  );
}
