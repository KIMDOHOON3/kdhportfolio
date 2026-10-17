import { Icon, SkillIconMap } from "../Icons";
import styles from "./Portfolio.module.scss";

const aliases: Record<string, string> = {
  "Tailwind CSS": "Tailwind",
  "CSS Modules": "CSS",
};

export default function TechnologyIcon({ name }: { name: string }) {
  const originalName = aliases[name] ?? name;
  if (!SkillIconMap[originalName]) return null;

  return (
    <span className={styles.technologyIcon} aria-hidden="true">
      <Icon name={originalName} color="currentColor" size={20} />
    </span>
  );
}
