import Image from "next/image";
import styles from "./WorkCoverMockup.module.scss";

export default function WorkCoverMockup({
  kind,
  priority = false,
}: {
  kind: "lexus" | "kia";
  priority?: boolean;
}) {
  const name = kind === "lexus" ? "렉서스" : "기아 글로벌";
  return (
    <div
      className={`${styles.mockup} ${styles[kind]}`}
      data-work-cover-mockup={kind}
      role="img"
      aria-label={`${name} 공개 웹사이트의 데스크톱·모바일 화면을 담은 기기 목업`}
    >
      <div className={styles.devices} aria-hidden="true">
        <div className={styles.laptop}>
          <div className={styles.laptopScreen}>
            <Image
              src={`/projects/mockups/${kind}-desktop.png`}
              alt=""
              fill
              sizes="(max-width: 760px) 80vw, 50vw"
              priority={priority}
            />
          </div>
          <div className={styles.laptopBase} />
        </div>
        <div className={styles.phone}>
          <div className={styles.phoneScreen}>
            <Image
              src={`/projects/mockups/${kind}-mobile.png`}
              alt=""
              fill
              sizes="(max-width: 760px) 30vw, 18vw"
              priority={priority}
            />
          </div>
          <span className={styles.camera} />
        </div>
      </div>
    </div>
  );
}
