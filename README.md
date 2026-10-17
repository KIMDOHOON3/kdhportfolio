# 프론트엔드 개발자 김도훈 포트폴리오

[![Website](https://img.shields.io/badge/웹사이트-kdhportfolio--omega.vercel.app-blue)](https://kdhportfolio-omega.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-KIMDOHOON3-green)](https://github.com/KIMDOHOON3)

## 프로젝트 소개

지금까지의 작업물과 프로젝트 경험을 정리하고, 저의 개발 철학과 방향성을 담아 만든 포트폴리오입니다.

## 기술 스택

- **프레임워크:** Next.js
- **언어:** TypeScript
- **스타일링:** SCSS
- **애니메이션:** GSAP
- **배포:** Vercel

## 주요 기능

- 자기소개 및 기술 스택 소개
- 주요 프로젝트 작업물 전시
- 프로젝트 상세 페이지 (개발 과정, 기술적 도전과 해결 방법)
- 블로그 게시물 연결

## 프로젝트 구조

```
src/
├── app/
│   ├── components/      # UI 컴포넌트
│   ├── data/            # 프로젝트 데이터 (경험, 프로젝트 정보)
│   ├── styles/          # 전역 스타일
│   ├── types/           # TypeScript 타입 정의
│   ├── hooks/           # 커스텀 훅
│   ├── work/[id]/       # 작업물 상세 페이지
│   ├── page.tsx         # 메인 페이지
│   └── layout.tsx       # 레이아웃 컴포넌트
```

## 설치 및 실행 방법

```bash
# 저장소 클론
git clone <저장소-URL>

# 프로젝트 폴더로 이동
cd kdhportfolio

# 종속성 설치
npm install

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 프로젝트를 확인할 수 있습니다.

## 주요 프로젝트

### 1. 여행 어디가?

- 한국관광공사 API 활용 여행 정보 서비스
- Next.js, TypeScript, Tailwind CSS, React Query, Zustand
- [웹사이트](https://koreantrip.vercel.app/) | [GitHub](https://github.com/kimdohoon2/trip)

### 2. Coworks

- To-do 리스트 형태의 업무 배정 및 현황 공유 서비스
- Next.js, TypeScript, Tailwind CSS, React-Query, Redux
- [웹사이트](https://team8-coworkers.vercel.app/) | [GitHub](https://github.com/codeit-sprint-FE11-part4-8team/coworkers)

## 배포

이 프로젝트는 [Vercel](https://vercel.com)을 통해 배포되었습니다.
