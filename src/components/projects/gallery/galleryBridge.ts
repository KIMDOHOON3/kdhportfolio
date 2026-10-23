import type { GalleryFlight } from "./galleryScene";

// The route coordinator can take over an already-warm gallery without eagerly
// importing Three.js or creating a renderer on a cold detail visit.
let begin:
  | ((
      root: HTMLElement,
      from?: HTMLElement,
      id?: number,
    ) => GalleryFlight | null)
  | null = null;
export function registerGalleryFlight(callback: NonNullable<typeof begin>) {
  begin = callback;
}
export function beginGalleryFlight(
  root: HTMLElement,
  from?: HTMLElement,
  id?: number,
) {
  return begin?.(root, from, id) ?? null;
}
