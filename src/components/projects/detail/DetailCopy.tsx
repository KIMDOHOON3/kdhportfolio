import type { ReactNode } from "react";
import styles from "./ProjectDetail.module.scss";

/** Emphasize editorially selected phrases without changing the source copy. */
export default function DetailCopy({
  text,
  emphasis = [],
}: {
  text: string;
  emphasis?: string[];
}) {
  const ranges = emphasis
    .filter(Boolean)
    .map((phrase) => ({ start: text.indexOf(phrase), phrase }))
    .filter(({ start }) => start >= 0)
    .sort((a, b) => a.start - b.start || b.phrase.length - a.phrase.length);
  const content: ReactNode[] = [];
  let cursor = 0;
  for (const { start, phrase } of ranges) {
    if (start < cursor) continue;
    content.push(text.slice(cursor, start));
    content.push(
      <strong className={styles.emphasis} key={start}>
        {phrase}
      </strong>,
    );
    cursor = start + phrase.length;
  }
  content.push(text.slice(cursor));
  return <>{content}</>;
}
