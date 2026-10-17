"use client";

import Link from "next/link";
import styles from "@/app/components/ScrollButton.module.scss";
import { useEffect, useRef } from "react";
import Image from "next/image";

export default function ScrollButton() {
  // 현재 회전 각도를 저장하기 위한 refs
  const currentRotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const currentArrowRotationRef = useRef(90);
  const targetArrowRotationRef = useRef(90);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 애니메이션 프레임에서 실행될 부드러운 애니메이션 함수
    const animateRotation = () => {
      currentRotationRef.current +=
        (targetRotationRef.current - currentRotationRef.current) * 0.1;
      currentArrowRotationRef.current +=
        (targetArrowRotationRef.current - currentArrowRotationRef.current) *
        0.1;

      // 요소 찾기
      const scrollImage = document.querySelector(
        `.${styles.scrollDownImage}`
      ) as HTMLElement | null;
      const downArrow = document.querySelector(
        `.${styles.downArrowImage}`
      ) as HTMLElement | null;

      if (scrollImage && downArrow) {
        scrollImage.style.transform = `rotate(${currentRotationRef.current}deg)`;
        downArrow.style.transform = `translate(-50%, -50%) rotate(${currentArrowRotationRef.current}deg)`;
      }
      animationFrameRef.current = requestAnimationFrame(animateRotation);
    };

    // 스크롤 이벤트 핸들러 - 목표 회전 각도만 업데이트
    const handleScroll = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const progress = Math.min(scrollTop / scrollHeight, 1);

      targetRotationRef.current = progress * 360;

      if (progress > 0.9) {
        targetArrowRotationRef.current = 90 - (progress - 0.9) * 10 * 180;
      } else {
        targetArrowRotationRef.current = 90;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    handleScroll();

    animationFrameRef.current = requestAnimationFrame(animateRotation);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.scrollDownPosition}>
      <Link className={styles.scrollDownContent} href="#Home">
        <div className={styles.scrollDownWrap}>
          <Image
            className={styles.scrollDownImage}
            src="/icons/scroll-down-white.png"
            alt="스크롤 다운"
            width={80}
            height={80}
          />
        </div>
        <Image
          className={styles.downArrowImage}
          src="/icons/right-arrow-white.png"
          alt="스크롤 화살표"
          width={18}
          height={26}
        />
      </Link>
    </div>
  );
}
