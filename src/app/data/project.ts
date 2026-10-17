import { Project } from "@/app/types/project";

export const projects: Project[] = [
  {
    id: 1,
    title: "여행 어디가?",
    description:
      "한국관광공사 API를 활용하여 전국 숙박, 맛집, 관광지, 여행지 정보를 제공하는 여행 정보 서비스입니다.",
    tech: "기술 스택 : Next.js, TypeScript, Tailwind CSS, React Query, Zustand",
    siteLink: "https://koreantrip.vercel.app/",
    gitLink: "https://github.com/kimdohoon2/trip",
    imgSrc: "/projects/archive-cover.svg",
    bgSrc: "/projects/archive-cover.svg",
    detailInfo: {
      projectType: "개인 프로젝트",
      time: "2024.12 ~ 2025.04",
      techDetail: "Next.js, TypeScript, Tailwind CSS, React Query, Zustand",
      description1:
        "한국관광공사 API를 활용하여 전국 숙박, 맛집, 관광지, 여행지 정보를 제공하는 여행 정보 서비스입니다.",
      description2:
        "사용자 경험(UX) 개선과 불필요한 API 요청 최소화를 중점으로 개발했습니다.",
    },
    technicalChallenges: {
      title: "기술적 도전 및 해결",
      challenges: [
        {
          title: "1. React Query 캐싱 전략 최적화",
          issue:
            "페이지 간 이동 시 동일한 데이터를 반복적으로 요청해 불필요한 API 호출이 발생하고, UX가 저하됨",
          solution1:
            "React Query의 staleTime, gcTime을 활용하여 데이터 캐싱 전략을 최적화",
          result1:
            "동일한 데이터를 반복 호출하지 않아 API 호출 수를 줄이고, 화면 전환 시 데이터를 즉시 보여줌으로써 UX 개선",
        },
        {
          title: "2. 무한스크롤 적용으로 초기 로딩 속도 3s->1.5s 개선",
          issue:
            "전체 데이터를 한 번에 불러오는 구조로 초기 로딩 지연 및 사용자 대기 시간 증가",
          solution1:
            "react-intersection-observer 기반의 무한스크롤 도입, threshold 값을 0.5로 설정해 중복 호출 방지",
          result1:
            "Lighthouse 기준 LCP를 3초에서 1.5초로 단축, 자연스러운 스크롤 기반 UX 제공",
        },
        {
          title: "3. 검색 UX 개선으로 사용자 검색 편의성 향상",
          issue:
            "사용자가 검색 반복을 줄이고, 원하는 정보를 더 빠르게 찾을 수 있도록 개선",
          solution1:
            "LocalStorage에 검색 기록 저장, 계절별 추천 검색어 제공, 입력 키워드 하이라이트 처리",
          result1:
            "반복 입력 없이 검색 가능해져 검색 편의성 및 정보 탐색 속도 향상",
        },
        {
          title: "4. 위치 기반 여행지 추천 기능으로 개인화된 UX 제공",
          issue:
            "사용자 주변 여행지를 빠르게 확인할 수 있도록 개인화된 탐색 경험 제공",
          solution1:
            "GeoLocation API를 활용한 사용자 위치 수집, 해당 좌표 기준 반경 내 여행지 추천 기능 구현",
          result1: "위치 기반 콘텐츠 탐색 효율 증가, 맞춤형 UX 제공",
        },
      ],
    },
    blog: [
      {
        title: "무한스크롤 적용으로 초기 로딩 속도 3s->1.5s 개선",
        blogImgSrc: "/work/detail/여행 어디가/blog1.png",
        link: "https://kimdohoon2.github.io/%EA%B0%9C%EC%9D%B8/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%ED%9A%8C%EA%B3%A0/%EA%B0%9C%EC%9D%B8-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%ED%9A%8C%EA%B3%A0-%EB%AC%B4%ED%95%9C%EC%8A%A4%ED%81%AC%EB%A1%A4-%EC%A0%81%EC%9A%A9%EC%9C%BC%EB%A1%9C-%EB%8D%94-%EB%B9%A0%EB%A5%B4%EA%B3%A0-%EB%B6%80%EB%93%9C%EB%9F%BD%EA%B2%8C/",
      },
      {
        title: "검색 UX 개선으로 사용자 검색 편의성 향상",
        blogImgSrc: "/work/detail/여행 어디가/blog2.png",
        link: "https://kimdohoon2.github.io/%EA%B0%9C%EC%9D%B8/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%ED%9A%8C%EA%B3%A0/%EA%B0%9C%EC%9D%B8-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%ED%9A%8C%EA%B3%A0-%EA%B2%80%EC%83%89-UX-%EC%B5%9C%EC%A0%81%ED%99%94%EB%A5%BC-%EC%9C%84%ED%95%9C-%EA%B3%A0%EB%AF%BC%EA%B3%BC-%EA%B5%AC%ED%98%84/",
      },
      {
        title: "개인 프로젝트 회고 : 무한스크롤 VS 페이지네이션",
        blogImgSrc: "/work/detail/여행 어디가/blog3.png",
        link: "https://kimdohoon2.github.io/%EA%B0%9C%EC%9D%B8/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%ED%9A%8C%EA%B3%A0/%EA%B0%9C%EC%9D%B8-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%ED%9A%8C%EA%B3%A0-%EB%AC%B4%ED%95%9C%EC%8A%A4%ED%81%AC%EB%A1%A4-vs-%ED%8E%98%EC%9D%B4%EC%A7%80%EB%84%A4%EC%9D%B4%EC%85%98/",
      },
    ],
  },
  {
    id: 2,
    title: "Coworks",
    description: "To-do 리스트 형태로 업무 배정 및 현황 공유 서비스입니다.",
    tech: "기술 스택 : Next.js, TypeScript, Tailwind css, React-Query, Redux",
    siteLink: "https://team8-coworkers.vercel.app/",
    gitLink: "https://github.com/codeit-sprint-FE11-part4-8team/coworkers",
    imgSrc: "/projects/archive-cover.svg",
    bgSrc: "/projects/archive-cover.svg",
    detailInfo: {
      projectType: "팀 프로젝트",
      time: "2024.12 ~ 2025.02",
      TeamRole: "FE 5명 (로그인/회원가입 페이지 , 자유게시판 페이지, 배포관리)",
      description1: "To-do 리스트 형태로 업무 배정 및 현황 공유 서비스입니다.",
      techDetail: "Next.js, TypeScript, Tailwind CSS, React-Query, Redux",
    },
    technicalChallenges: {
      title: "기술적 도전 및 해결",
      challenges: [
        {
          title: "1. JWT 기반 보안 인증 시스템 구현 (로그인/회원가입 페이지)",
          issue:
            "클라이언트 측 리프레시 토큰 저장 시 XSS 공격에 취약하여 보안 우려 발생",
          solution1:
            "리프레시 토큰은 HTTP-only 쿠키에 저장해 JavaScript 접근 차단",
          solution2:
            " Next.js API 라우트를 활용해 리프레시 토큰 로직을 서버 측에서 처리",
          solution3:
            " Axios 인터셉터를 사용해 401 오류 발생 시 자동 토큰 갱신 및 요청 대기열 관리 구현",
          result1:
            "보안성과 사용자 경험을 동시에 만족시키는 안정적인 로그인 시스템 구축",
          result2:
            "Redux-Persist 기반 로그인 유지로 UX 중단 없이 인증 흐름 유지",
        },
        {
          title: "2. Container / Presentational 패턴 적용",
          issue:
            "하나의 게시글 카드 컴포넌트에 UI와 비즈니스 로직이 혼재되어 가독성 저하 및 유지보수 어려움 발생",
          solution1:
            "Container / Presentational 패턴 적용해 UI와 비즈니스 로직 분리",
          result1: "컴퍼넌트 가독성 향상 및 재사용성 증가, 유지보수 용이",
        },
        {
          title: "3. Vercel 배포 제한 해결 및 CI/CD 파이프라인 구축",
          issue:
            "조직 레포지토리에서 Vercel의 유료 정책으로 인해 배포가 제한됨",
          solution1:
            "레포지토리를 fork하고, GitHub Actions를 활용하여 CI/CD 자동 배포 시스템을 구축 ",
          result1:
            "유료 정책에 의한 배포 제한을 해결 및 자동 배포를 통해 개발 생산성을 향상",
        },
      ],
    },
    blog: [
      {
        title: "팀 프로젝트 회고 : JWT 기반 보안 인증 시스템 구축기",
        blogImgSrc: "/work/detail/coworks/blog1.png",
        link: "https://kimdohoon2.github.io/%ED%8C%80/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%ED%9A%8C%EA%B3%A0/%ED%8C%80-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%ED%9A%8C%EA%B3%A0-%EB%A1%9C%EA%B7%B8%EC%9D%B8/",
      },
      {
        title: "팀 프로젝트 회고: 컴포넌트 분리의 중요성",
        blogImgSrc: "/work/detail/coworks/blog2.png",
        link: "https://kimdohoon2.github.io/%ED%8C%80/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%ED%9A%8C%EA%B3%A0/%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8-%EB%B6%84%EB%A6%AC%EC%9D%98-%EC%A4%91%EC%9A%94%EC%84%B1/",
      },
      {
        title:
          "팀 프로젝트 회고: Vercel로 GitHub Organization repository 무료 배포하기",
        blogImgSrc: "/work/detail/coworks/blog3.png",
        link: "https://kimdohoon2.github.io/%ED%8C%80/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%ED%9A%8C%EA%B3%A0/vercel-%EB%B0%B0%ED%8F%AC%EA%B3%BC%EC%A0%95/",
      },
    ],
  },
  {
    id: 3,
    title: "다섯번째 계절과 카라반",
    description:
      "감성적인 디자인과 직관적인 UI로 숙박업 예약과 정보를 편리하게 제공하는 웹사이트입니다.",
    tech: "기술 스택 : HTML5, CSS3, JAVASCRIPT, JQUERY, GSAP, PHP",
    siteLink: "http://www.5th-season.co.kr/html/index.html",
    imgSrc: "/projects/archive-cover.svg",
    bgSrc: "/projects/archive-cover.svg",
  },
  {
    id: 4,
    description:
      "대표적으로 기재한 3개의 프로젝트 외에도 10개 이상의 웹사이트 구축을 하였습니다.",
    imgSrc: "/projects/archive-cover.svg",
    bgSrc: "/projects/archive-cover.svg",
  },
];
