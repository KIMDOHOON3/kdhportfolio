"use client";

import styles from "@/app/components/ThirdSection/ThirdSection.module.scss";
import Image from "next/image";
const profile = "/about/profile.svg";
import Meteor from "@/app/components/Meteor";
import SkillContainer from "@/app/components/SkillContainer";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EXPERIENCES } from "@/app/data/experience";

export default function ThirdSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // GSAP ScrollTrigger 등록
    gsap.registerPlugin(ScrollTrigger);

    lineRefs.current.forEach((line) => {
      if (!line) return;

      gsap.set(line, {
        "--line-height": "0%",
      });

      // 스크롤 트리거 생성
      gsap.to(line, {
        "--line-height": "100%",
        ease: "none",
        scrollTrigger: {
          trigger: line,
          start: "top 70%",
          end: "bottom 50%",
          scrub: 1,
          markers: false,
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section id="about" className={styles.thirdSection} ref={sectionRef}>
      <Meteor count={4} />
      <SkillContainer />
      <div className={styles.thirdContainer}>
        <div className={styles.thirdSectionWrap}>
          <p className={styles.thirdSectionTitle}>Experience & Education</p>

          {EXPERIENCES.map((experience, index) => (
            <div key={index} className={styles.thirdSectionContent}>
              <div className={styles.thirdSectionContentLeft}>
                <div className={styles.profileCircle}>
                  <div className={styles.profileWrap}>
                    <Image
                      className={styles.profileImg}
                      src={profile}
                      alt="개발자 그림"
                      width={100}
                    />
                  </div>
                </div>
                <div
                  ref={(el) => {
                    lineRefs.current[index] = el;
                    return undefined;
                  }}
                  className={styles.verticalLine}
                ></div>
              </div>
              <div className={styles.thirdSectionContentRight}>
                <div className={styles.jobHeaderWrap}>
                  <div className={styles.jobHeaderWrapLeft}>
                    <p className={styles.jobTitle}>{experience.title}</p>
                    <p className={styles.companyName}>{experience.company}</p>
                  </div>
                  <div>
                    <p className={styles.jobPeriod}>{experience.period}</p>
                  </div>
                </div>
                <div className={styles.contributions}>
                  {experience.contributions.map((contribution, i) => (
                    <p key={i} className={styles.contributionItem}>
                      {contribution}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
