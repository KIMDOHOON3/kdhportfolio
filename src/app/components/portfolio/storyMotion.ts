const clamp = (value: number) => Math.min(1, Math.max(0, value));
export const STORY_SCREENS = 4;
export const STORY_STAGE_SPAN = 0.8;
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

/** Keep the cursor transition but shorten the editorial sequence for browsing. */
export function storyTransition(top: number, height: number) {
  const bottom = top + height * STORY_SCREENS;
  const margin = 120;
  const grow = smooth((height / 2 - top - margin) / height);
  const shrinkEnd = height / 2 + margin - height * STORY_SCREENS;
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
