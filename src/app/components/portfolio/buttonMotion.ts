import type { PointerEvent } from "react";

function positionFill(event: PointerEvent<HTMLElement>) {
  if (
    event.pointerType !== "mouse" ||
    !matchMedia("(hover: hover) and (pointer: fine)").matches ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    "--button-x",
    `${event.clientX - rect.left}px`,
  );
  event.currentTarget.style.setProperty(
    "--button-y",
    `${event.clientY - rect.top}px`,
  );
}

function clearPress(event: PointerEvent<HTMLElement>) {
  delete event.currentTarget.dataset.pressed;
}

export const buttonMotion = {
  onPointerEnter: positionFill,
  onPointerMove: positionFill,
  onPointerDown: (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch")
      event.currentTarget.dataset.pressed = "true";
  },
  onPointerUp: clearPress,
  onPointerCancel: clearPress,
  onPointerLeave: clearPress,
};
