import ProjectScreen from "./ProjectScreen";
import styles from "./WorkCoverMockup.module.scss";

export default function WorkCoverMockup({
  kind,
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
      aria-label={`${name} 담당 업무를 직접 구성한 데스크톱·모바일 목업`}
    >
      <div className={styles.devices} aria-hidden="true">
        <div className={styles.laptop}>
          <div className={styles.laptopScreen}>
            <ProjectScreen kind={kind} />
          </div>
          <div className={styles.laptopBase} />
        </div>
        <div className={styles.phone}>
          <div className={styles.phoneScreen}>
            <ProjectScreen kind={kind} mobile />
          </div>
          <span className={styles.camera} />
        </div>
      </div>
    </div>
  );
}
