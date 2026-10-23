import InterfaceSketch from "./InterfaceSketch";
import styles from "@/styles/Portfolio.module.scss";
import layout from "./AboutSection.module.scss";

export default function AboutSection() {
  return (
    <section
      id="about"
      data-intro-below
      className={layout.section}
      aria-labelledby="about-title"
    >
      <h2 id="about-title" className={styles.visuallyHidden}>
        소개
      </h2>
      <div
        className={layout.illustration}
        data-entrance-area="소개"
        data-element-reveal="frame"
        data-element-draw
      >
        <InterfaceSketch />
      </div>
    </section>
  );
}
