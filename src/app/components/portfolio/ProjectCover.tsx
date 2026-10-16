import Image from "next/image";
import type { PortfolioProject } from "../../data/portfolio";
import styles from "./Portfolio.module.scss";

export default function ProjectCover({
  project,
  priority = false,
}: {
  project: PortfolioProject;
  priority?: boolean;
}) {
  return (
    <div className={`${styles.cover} ${styles[project.visual]}`}>
      {project.image ? (
        <>
          <Image
            src={project.image}
            alt={`${project.title} 브랜드 이미지`}
            fill
            sizes="(max-width: 760px) 100vw, 60vw"
            priority={priority}
            className={styles.coverImage}
          />
          <div className={styles.coverShade} />
          <span className={styles.coverBrand}>
            {project.visual === "kia" ? "Kia" : "LEXUS"}
          </span>
          <span className={styles.coverCaption}>
            {project.visual === "lexus"
              ? "EXPERIENCE AMAZING"
              : project.visual === "kia"
                ? "Movement that inspires."
                : "THE ART OF DETAIL"}
          </span>
        </>
      ) : project.visual === "dog" ? (
        <>
          <span className={styles.dogLabel}>DOG ATLAS / 犬種圖鑑</span>
          <div className={styles.dogDeck}>
            {["jindo", "golden", "poodle"].map((dog, i) => (
              <div className={styles.dogCard} key={dog}>
                <Image
                  src={`/projects/dog-${dog}.webp`}
                  alt={
                    [
                      "진돗개 수채화",
                      "골든 리트리버 수채화",
                      "토이푸들 수채화",
                    ][i]
                  }
                  fill
                  sizes="(max-width: 760px) 30vw, 20vw"
                />
                <span>{["JINDO", "GOLDEN RETRIEVER", "TOY POODLE"][i]}</span>
              </div>
            ))}
          </div>
          <span className={styles.dogFoot}>A WORLD OF GOOD DOGS.</span>
        </>
      ) : (
        <>
          <span className={styles.coupleLabel}>a little space for us</span>
          <Image
            className={styles.hearts}
            src="/projects/hearts.webp"
            width={200}
            height={200}
            alt=""
          />
          <span className={styles.coupleTitle}>
            our little
            <br />
            <i>days.</i>
          </span>
          <span className={styles.coupleFoot}>
            우리의 평범한 날들을, 특별하게.
          </span>
        </>
      )}
      <span className={styles.coverArrow} aria-hidden="true">
        ↗
      </span>
    </div>
  );
}
