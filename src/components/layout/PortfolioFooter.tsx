"use client";

import { ButtonLink } from "@/components/ui/Button";
import { useLayoutEffect, useRef } from "react";
import { MailIcon, GithubIcon, DownloadIcon } from "@/components/ui/Icons";
import { ButtonLabel } from "@/components/ui/ButtonEffect";
import CopyReveal from "@/components/ui/CopyReveal";
import useElementEntrances from "@/lib/motion/useElementEntrances";
import styles from "@/styles/Portfolio.module.scss";

export default function PortfolioFooter() {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (root.current && !root.current.dataset.footerEntrance)
      root.current.dataset.footerEntrance = matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
        ? "done"
        : "waiting";
  }, []);
  useElementEntrances(root);
  return (
    <footer ref={root} className={styles.footer} id="contact" data-intro-below>
      <div className={styles.contactMain}>
        <h2 className={styles.thankYou} lang="en" data-footer-thanks>
          <span>THANK</span> <span>YOU</span>
        </h2>
      </div>
      <div className={styles.contactLinks} data-entrance-area="푸터 연락처">
        <ButtonLink
          href="mailto:kingyska@nate.com"
          data-element-reveal="button"
        >
          <MailIcon
            className={styles.actionIcon}
            fill="currentColor"
            aria-hidden="true"
          />
          <ButtonLabel>kingyska@nate.com</ButtonLabel>
        </ButtonLink>
        <ButtonLink
          href="https://github.com/KIMDOHOON3"
          target="_blank"
          rel="noreferrer"
          data-element-reveal="button"
        >
          <GithubIcon
            className={styles.actionIcon}
            fill="currentColor"
            aria-hidden="true"
          />
          <ButtonLabel>GitHub</ButtonLabel>
        </ButtonLink>
        <ButtonLink
          href="/resume/김도훈-이력서.pdf"
          download
          data-element-reveal="button"
        >
          <DownloadIcon
            className={styles.actionIcon}
            fill="currentColor"
            aria-hidden="true"
          />
          <ButtonLabel>이력서 다운로드</ButtonLabel>
        </ButtonLink>
      </div>
      <div className={styles.footerBottom} data-entrance-area="푸터 하단">
        <span>
          <CopyReveal
            inline
          >{`© ${new Date().getFullYear()} 김도훈`}</CopyReveal>
        </span>
        <ButtonLink href="#top" data-element-reveal="button">
          <ButtonLabel>맨 위로 ↑</ButtonLabel>
        </ButtonLink>
      </div>
    </footer>
  );
}
