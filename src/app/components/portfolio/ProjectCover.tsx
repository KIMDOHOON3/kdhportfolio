import Image from "next/image";
import type { PortfolioProject } from "../../data/portfolio";
import styles from "./Portfolio.module.scss";
import ArrowIcon from "./ArrowIcon";

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
              ? "렉서스 웹사이트 리뉴얼"
              : project.visual === "kia"
                ? "기아 글로벌 브랜드 웹사이트"
                : "렉서스 웹사이트 운영 · 개선"}
          </span>
        </>
      ) : project.visual === "dog" ? (
        <>
          <span className={styles.dogLabel}>DOG ATLAS / 견종도감</span>
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
                <span>{["진돗개", "골든 리트리버", "토이푸들"][i]}</span>
              </div>
            ))}
          </div>
          <span className={styles.dogFoot}>
            나와 잘 맞는 강아지를 알아가는 시간
          </span>
        </>
      ) : (
        <>
          <span className={styles.coupleLabel}>
            둘만의 일상을 담는 작은 공간
          </span>
          <Image
            className={styles.hearts}
            src="/projects/hearts.webp"
            width={200}
            height={200}
            alt=""
          />
          <span className={styles.coupleTitle}>
            둘이 쌓는
            <br />
            <i>기록.</i>
          </span>
          <span className={styles.coupleFoot}>
            우리의 평범한 날들을, 특별하게.
          </span>
        </>
      )}
      <span className={styles.coverArrow} aria-hidden="true">
        <ArrowIcon />
      </span>
    </div>
  );
}
