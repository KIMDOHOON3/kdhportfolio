import ArrowRight from "/public/icons/arrow-right.svg";
import styles from "@/styles/Portfolio.module.scss";

export default function ArrowIcon({ down = false }: { down?: boolean }) {
  return (
    <ArrowRight
      className={`${styles.arrowIcon} ${down ? styles.arrowDown : ""}`}
      width={18}
      height={18}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    />
  );
}
