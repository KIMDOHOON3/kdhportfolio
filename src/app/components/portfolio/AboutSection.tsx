import Image from "next/image";
import styles from "./Portfolio.module.scss";

export default function AboutSection() {
  return (
    <section id="about" className={styles.about} aria-labelledby="about-title">
      <h2 id="about-title" className={styles.visuallyHidden}>
        소개
      </h2>
      <div className={styles.aboutPortrait}>
        <Image
          src="/about/profile.png"
          width={520}
          height={520}
          alt="프론트엔드 개발자 김도훈"
        />
        <span className={styles.aboutCoordinates}>
          코드 × 인터랙션 × 사용자 경험
        </span>
      </div>
      <div className={styles.aboutText}>
        <p>
          퍼블리싱으로 시작해 프론트엔드 개발로 영역을 넓혀왔습니다. 화면의 작은
          움직임부터 데이터와 상태의 흐름까지, 보이는 부분과 보이지 않는 부분을
          함께 고민합니다.
        </p>
        <p>
          렉서스와 기아의 브랜드 경험을 구현했고, 개인 프로젝트에서는 기획부터
          디자인, 개발까지 직접 맡아 서비스를 만들어가고 있습니다.
        </p>
      </div>
    </section>
  );
}
