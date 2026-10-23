import ArrowIcon from "./ArrowIcon";
import styles from "@/styles/Portfolio.module.scss";

/** Two arrows share the existing clipped rolling animation. */
export default function ActionArrow({ down = false }: { down?: boolean }) {
  return (
    <span className={styles.exploreIcon} aria-hidden="true">
      <ArrowIcon down={down} />
      <ArrowIcon down={down} />
    </span>
  );
}
