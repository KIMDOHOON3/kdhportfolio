import InterfaceSketch from "./InterfaceSketch";
import styles from "./Portfolio.module.scss";
import ContentReveal from "./ContentReveal";

export default function AboutSection() {
  return (
    <section id="about" className={styles.about} aria-labelledby="about-title">
      <h2 id="about-title" className={styles.visuallyHidden}>
        소개
      </h2>
      <div className={styles.aboutPortrait}>
        <InterfaceSketch />
      </div>
      <div className={styles.aboutText}>
        <ContentReveal as="p" data-reveal="about-lead">
          퍼블리싱으로 시작해 프론트엔드 개발로 영역을 넓혀왔습니다. 렉서스와
          기아의 브랜드 경험부터 개인 서비스까지, 화면의 디테일과 데이터의
          흐름을 함께 고민합니다.
        </ContentReveal>
        <ContentReveal as="p" data-reveal="about-description" delay={0.1}>
          AI를 개발 과정에 활용하고, 새로운 기술도 직접 써보며 익힙니다. 개인
          프로젝트에서는 기획부터 디자인, 개발까지 맡아 배운 것을 서비스로
          연결하고 있습니다.
        </ContentReveal>
      </div>
    </section>
  );
}
