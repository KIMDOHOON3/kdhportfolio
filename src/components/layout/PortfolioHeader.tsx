"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navigation from "./navigation/Navigation";
import NavTrigger from "./navigation/NavTrigger";
import styles from "@/styles/Portfolio.module.scss";

export default function PortfolioHeader() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        header.current
          ?.querySelector<HTMLButtonElement>("#navTrigger")
          ?.focus({ preventScroll: true });
      }
    };
    const keyboardTrigger = header.current?.querySelector(
      "#navTrigger:focus-visible",
    );
    if (open && keyboardTrigger)
      header.current
        ?.querySelector<HTMLAnchorElement>("nav a")
        ?.focus({ preventScroll: true });
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  useEffect(() => {
    const mobile = matchMedia("(max-width: 768px)");
    const closeOnDesktop = () => {
      if (!mobile.matches) setOpen(false);
    };
    mobile.addEventListener("change", closeOnDesktop);
    return () => mobile.removeEventListener("change", closeOnDesktop);
  }, []);
  return (
    <header ref={header} className={styles.header}>
      <Link
        className={styles.logo}
        href="/#top"
        scroll={false}
        onClick={() => setOpen(false)}
        aria-label="김도훈 포트폴리오 홈"
        data-intro-logo
      >
        DOHOON<span>®</span>
      </Link>
      <div className={styles.headerMenu}>
        <NavTrigger isActive={open} onClick={() => setOpen(!open)} />
        <Navigation isActive={open} onNavItemClick={() => setOpen(false)} />
      </div>
    </header>
  );
}
