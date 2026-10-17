import { useEffect, type RefObject } from "react";

/** Keep the document scroll native; only the paper surfaces follow its progress. */
export default function usePaperMotion(
  root: RefObject<HTMLElement | null>,
  filter: string,
) {
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (disposed || !root.current) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();

        media.add("(prefers-reduced-motion: no-preference)", () => {
          root.current
            ?.querySelectorAll<HTMLElement>("[data-paper]")
            .forEach((paper, index) => {
              const surface = paper.querySelector("[data-paper-surface]");
              if (!surface) return;

              gsap.fromTo(
                surface,
                {
                  y: () => (window.innerWidth <= 760 ? 38 : 76),
                  rotationX: -9,
                  rotationZ: index % 2 === 0 ? -0.65 : 0.65,
                  scale: 0.97,
                },
                {
                  y: 0,
                  rotationX: 0,
                  rotationZ: 0,
                  scale: 1,
                  ease: "power2.out",
                  scrollTrigger: {
                    trigger: paper,
                    start: "top bottom+=8%",
                    end: "top 62%",
                    scrub: 0.3,
                    invalidateOnRefresh: true,
                  },
                },
              );
            });
        });

        cleanup = () => media.revert();
      },
      () => {
        // All content remains in its final readable layout if motion cannot load.
      },
    );

    return () => {
      disposed = true;
      cleanup();
    };
  }, [root, filter]);
}
