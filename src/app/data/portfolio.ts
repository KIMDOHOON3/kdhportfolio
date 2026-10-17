export type PortfolioProject = {
  id: number;
  title: string;
  subtitle: string;
  category: "실무 프로젝트" | "개인 프로젝트";
  year: string;
  visual: "lexus" | "legacy" | "kia" | "dog" | "couple";
  image?: string;
  description: string;
  stack: string[];
  role: string;
  site?: string;
  github?: string;
  highlights: { title: string; description: string }[];
};

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 1,
    title: "LEXUS",
    subtitle: "상담·예약·마이페이지를 연결한 웹사이트 리뉴얼",
    category: "실무 프로젝트",
    year: "2026",
    visual: "lexus",
    image: "/projects/lexus-renewal.webp",
    description:
      "브랜드의 감도와 서비스의 편리함을 함께 담은 렉서스 웹사이트 리뉴얼. 상담부터 예약, 마이페이지까지 사용자의 흐름을 연결했습니다.",
    stack: ["React", "TypeScript", "Zustand", "Tailwind CSS"],
    role: "프론트엔드 개발 · 상담 및 예약, 마이페이지 UI",
    site: "https://www.lexus.co.kr/",
    highlights: [
      {
        title: "상담과 인증의 흐름 연결",
        description:
          "상담 신청 API와 인증 상태를 연결하고, 입력값 검증과 제출 상태를 관리하는 폼을 구현했습니다.",
      },
      {
        title: "예약 상태의 일관성",
        description:
          "예약 캘린더의 선택 상태를 관리하고, 상위 조건이 바뀌면 연관 선택을 초기화해 잘못된 예약 조합을 방지했습니다.",
      },
      {
        title: "일관된 서비스 UI",
        description:
          "마이페이지 공통 UI와 애니메이션·외부 SDK 연동을 작업하며 화면 간 경험이 이어지도록 구성했습니다.",
      },
    ],
  },
  {
    id: 2,
    title: "LEXUS",
    subtitle: "360° 차량 뷰어와 서비스 사용성 개선",
    category: "실무 프로젝트",
    year: "2025—26",
    visual: "legacy",
    image: "/projects/lexus-experience.webp",
    description:
      "운영 중인 렉서스 사이트의 인터랙션과 서비스 개선. 차량 360° 뷰어부터 조건부 폼, 공통 모달까지 작은 사용 경험을 다듬었습니다.",
    stack: ["Vue 2", "JavaScript", "SCSS", "Swiper"],
    role: "프론트엔드 개발 · 사이트 운영 및 기능 개선",
    site: "https://www.lexus.co.kr/",
    highlights: [
      {
        title: "360° 차량 뷰어",
        description:
          "비동기로 로드되는 이미지 시퀀스의 순서를 보장하고 프리로드를 적용해 차량 회전 인터랙션을 구현했습니다.",
      },
      {
        title: "안정적인 신청 경험",
        description:
          "조건부 입력 폼과 인증 흐름을 정리하고, 요청 중 중복 제출을 제어해 사용자가 현재 상태를 이해할 수 있게 했습니다.",
      },
      {
        title: "공통 요소의 완성도",
        description:
          "공통 모달의 접근성과 GTM 초기화 흐름을 다듬고, 여러 화면에서 같은 동작을 유지하도록 개선했습니다.",
      },
    ],
  },
  {
    id: 3,
    title: "Kia Worldwide",
    subtitle: "스크롤 인터랙션으로 전하는 글로벌 브랜드 경험",
    category: "실무 프로젝트",
    year: "2025—26",
    visual: "kia",
    image: "/projects/kia-worldwide.webp",
    description:
      "기아 글로벌 브랜드의 이야기를 웹 인터랙션으로 전달했습니다. 스크롤 모션과 차량 슬라이더를 구현하고 다양한 브라우저에서 디테일을 조율했습니다.",
    stack: ["React", "TypeScript", "Emotion", "Vite"],
    role: "프론트엔드 개발 · 브랜드 페이지 및 인터랙션",
    site: "https://worldwide.kia.com/int",
    highlights: [
      {
        title: "스크롤로 전하는 브랜드 이야기",
        description:
          "브랜드 콘텐츠의 전개에 맞춰 스크롤 기반 인터랙션을 구현하고, 모션과 정보의 순서가 자연스럽게 이어지도록 작업했습니다.",
      },
      {
        title: "재사용할 수 있는 화면",
        description:
          "차량 슬라이더와 페이지 구성 요소를 분리하고 CMS 콘텐츠에 대응할 수 있도록 컴포넌트를 구성했습니다.",
      },
      {
        title: "브라우저별 디테일 조율",
        description:
          "Safari 등 브라우저에서 발생하는 렌더링과 인터랙션 차이를 확인하고, 환경별로 일관된 화면을 제공하도록 수정했습니다.",
      },
    ],
  },
  {
    id: 4,
    title: "Dog Atlas",
    subtitle: "376종의 강아지를 발견하고 이해하는 견종도감",
    category: "개인 프로젝트",
    year: "2026",
    visual: "dog",
    description:
      "376종의 강아지를 발견하고 이해하는 견종도감. 수채화 카드와 검색, 견종별 이야기와 돌봄 가이드를 하나의 탐색 경험으로 만들었습니다.",
    stack: ["Next.js", "TypeScript", "CSS Modules", "Zod"],
    role: "개인 프로젝트 · 기획, 디자인, 프론트엔드 개발",
    site: "https://dog-atlas-eosin.vercel.app/",
    github: "https://github.com/KIMDOHOON3/dog-atlas",
    highlights: [
      {
        title: "발견하는 즐거움",
        description:
          "양면 수채화 카드와 홀로그램 표현으로 견종을 탐색하고, 검색과 필터를 통해 관심 있는 견종을 찾는 흐름을 구성했습니다.",
      },
      {
        title: "정보를 이해하는 구조",
        description:
          "견종의 역사와 역할, 행동 경향, 돌봄 정보를 연결하고 맞이 준비 가이드로 이어지는 콘텐츠 경험을 설계했습니다.",
      },
      {
        title: "타입과 데이터 검증",
        description:
          "TypeScript와 Zod를 활용해 콘텐츠 데이터의 구조를 검증하고, 반복되는 화면과 데이터 처리 로직을 공통화했습니다.",
      },
    ],
  },
  {
    id: 5,
    title: "커플 웹",
    subtitle: "사진·일정·편지를 함께 기록하는 커플 웹앱",
    category: "개인 프로젝트",
    year: "2026",
    visual: "couple",
    description:
      "둘의 일상과 기억을 함께 쌓는 커플 웹앱. 사진과 일정, 기념일, 편지를 하나의 공간에 담았습니다.",
    stack: ["Next.js", "TypeScript", "Supabase", "Zustand", "PWA"],
    role: "개인 프로젝트 · 기획, 디자인, 프론트엔드 개발",
    site: "https://aeppy.app/",
    github: "https://github.com/KIMDOHOON3/couple-web-2026",
    highlights: [
      {
        title: "둘만의 공간 연결",
        description:
          "Supabase 인증과 초대 기반 커플 연결을 구성하고, 연결된 사용자가 함께 기록을 관리하는 흐름을 구현했습니다.",
      },
      {
        title: "일상을 쌓는 기능",
        description:
          "사진 기록, 공유 캘린더, 기념일, 위시리스트와 편지를 통해 두 사람의 일상이 이어지도록 만들었습니다.",
      },
      {
        title: "웹을 일상 가까이",
        description:
          "실시간 데이터 동기화와 이미지 저장, PWA와 푸시 알림을 활용해 모바일에서도 가까이 사용할 수 있는 경험을 구성했습니다.",
      },
    ],
  },
];
