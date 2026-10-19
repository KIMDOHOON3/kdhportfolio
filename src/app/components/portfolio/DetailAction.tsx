"use client";

import ArrowIcon from "./ArrowIcon";
import { buttonMotion } from "./buttonMotion";
import { ButtonLabel, ButtonLight } from "./ButtonEffect";
import motion from "./Portfolio.module.scss";
import styles from "./ProjectDetail.module.scss";

export default function DetailAction({
  href,
  label,
  secondary = false,
}: {
  href: string;
  label: string;
  secondary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={`${motion.explore} ${styles.action} ${secondary ? styles.secondary : ""}`}
      {...buttonMotion}
    >
      <ButtonLight />
      <ButtonLabel>{label}</ButtonLabel>
      <span className={motion.exploreIcon} aria-hidden="true">
        <ArrowIcon />
        <ArrowIcon />
      </span>
    </a>
  );
}
