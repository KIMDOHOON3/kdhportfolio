import type { ComponentPropsWithoutRef } from "react";
import TechnologyIcon from "./TechnologyIcon";

type TechnologyListProps = ComponentPropsWithoutRef<"div"> & {
  technologies: readonly string[];
  itemClassName?: string;
};

/** Layout and animation hooks belong to the caller; entries share icons and labels. */
export default function TechnologyList({
  technologies,
  itemClassName,
  ...props
}: TechnologyListProps) {
  return (
    <div {...props}>
      {technologies.map((technology) => (
        <span key={technology} className={itemClassName}>
          <TechnologyIcon name={technology} />
          {technology}
        </span>
      ))}
    </div>
  );
}
