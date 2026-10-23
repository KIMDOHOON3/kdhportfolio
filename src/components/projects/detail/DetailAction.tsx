"use client";

import { ButtonLink } from "@/components/ui/Button";
import ActionArrow from "@/components/ui/ActionArrow";
import { ButtonLabel } from "@/components/ui/ButtonEffect";
import motion from "@/styles/Portfolio.module.scss";
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
    <ButtonLink
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={`${motion.explore} ${styles.action} ${secondary ? styles.secondary : ""}`}
    >
      <ButtonLabel>{label}</ButtonLabel>
      <ActionArrow />
    </ButtonLink>
  );
}
