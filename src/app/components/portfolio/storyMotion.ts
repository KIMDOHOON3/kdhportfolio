const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

/** Public reference geometry: cursor grows from the section's leading margin,
 * then shrinks during the last viewport before the sticky screen releases. */
export function storyTransition(top: number, height: number) {
  const bottom = top + height * 8;
  const margin = 120;
  const grow = smooth((height / 2 - top - margin) / height);
  const shrinkEnd = height / 2 + margin - height * 8;
  const shrinkStart = shrinkEnd + height;
  const shrink = 1 - smooth((top - shrinkEnd) / height);
  return {
    shrink,
    progress: grow * (1 - shrink),
    centerY:
      top > shrinkStart
        ? Math.max(height / 2, top + margin)
        : top > shrinkEnd
          ? height / 2
          : Math.min(height / 2, bottom - margin),
    visible: top < height + 480 && bottom > -height * 0.35,
    travel: Math.max(0, -top / height),
  };
}
