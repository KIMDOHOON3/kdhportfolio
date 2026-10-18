export type ProjectPhase = {
  id: string;
  title: string;
  year: string;
  role: string;
  stack: string[];
  highlights: { title: string; description: string }[];
};

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
  responsibilities?: string[];
  github?: string;
  highlights: { title: string; description: string }[];
  phases?: ProjectPhase[];
};

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 1,
    title: "LEXUS",
    subtitle: "웹사이트 리뉴얼부터 운영·개선까지",
    category: "실무 프로젝트",
    year: "2026",
    visual: "lexus",
    description:
      "렉서스 코리아 공식 웹사이트의 리뉴얼과 운영·개선에 참여했습니다. 리뉴얼에서는 상담신청·서비스 예약·마이페이지와 메인 인터랙션을, 운영에서는 360° 차량 뷰어·조건부 상담 폼과 신청 흐름 안정화, 공통 UI·분석 태그 개선을 담당했습니다.",
    stack: [
      "React",
      "TypeScript",
      "Zustand",
      "Vite",
      "Tailwind CSS",
      "Vue 2",
      "JavaScript",
      "SCSS",
      "jQuery",
      "Swiper",
    ],
    role: "프론트엔드 개발 · 웹사이트 리뉴얼 및 운영·개선",
    responsibilities: [
      "전시장 상담신청·서비스 예약 플로우 개발",
      "API·본인인증 연동 및 상태 관리",
      "마이페이지·홈 인터랙션·차량 뷰어 구현",
    ],
    site: "https://www.lexus.co.kr/",
    highlights: [],
    phases: [
      {
        id: "renewal",
        title: "웹사이트 리뉴얼",
        year: "2026",
        role: "전시장 상담신청 · 서비스 예약 · 마이페이지 · 메인 인터랙션 개발",
        stack: ["React", "TypeScript", "Zustand", "Vite", "Tailwind CSS"],
        highlights: [
          {
            title: "전시장 상담신청 개발",
            description:
              "API 연동, 입력 폼, 본인인증 및 약관·안내 모달을 구현하고 신청 흐름 검증 테스트를 작성했습니다.",
          },
          {
            title: "서비스 예약 플로우 구현",
            description:
              "예약 달력·시간 선택 UI와 Zustand 기반 상태 관리를 개발했습니다. 고객·서비스 유형별 예약 가능일 정책을 적용하고, 차량·센터 변경 시 종속 선택값을 초기화했습니다.",
          },
          {
            title: "마이페이지 공통 컴포넌트 구성",
            description:
              "프로필·내비게이션·모바일 LNB를 공통화하고, 고객 문의 화면을 헤더·목록·상세 영역으로 분리해 유지보수 구조를 개선했습니다.",
          },
          {
            title: "메인 인터랙션 및 외부 서비스 연동",
            description:
              "홈 섹션의 등장·전환 모션과 모델 슬라이드 드래그를 구현했습니다. 서비스센터 API와 챗봇 SDK를 연동하고, SDK 중복 초기화를 방지했습니다.",
          },
        ],
      },
      {
        id: "operations",
        title: "운영 · 기능 개선",
        year: "2025—26",
        role: "360° 차량 뷰어 · 조건부 상담 폼 · 공통 팝업 · 분석 태그 · 캠페인 화면 개발",
        stack: ["Vue 2", "JavaScript", "SCSS", "jQuery", "Swiper"],
        highlights: [
          {
            title: "360° 차량 뷰어",
            description:
              "차종·색상 선택과 드래그·키보드 회전을 지원하는 이미지 시퀀스 기반 뷰어를 구현했습니다. 차량·그림자 이미지를 사전 로딩·디코딩하고, 오래된 비동기 응답을 배제해 선택 상태와 화면의 불일치를 방지했습니다.",
          },
          {
            title: "조건부 고객 상담 폼 개발",
            description:
              "관심 차종별 설문 분기와 브랜드·모델, 지역·전시장 연동 선택을 구현했습니다. 상위 선택 변경 시 종속 입력값을 초기화하고, 조건부 설문이 숨겨질 때 관련 값과 오류를 정리하며 필수 항목을 검증했습니다.",
          },
          {
            title: "신청 기능 안정화",
            description:
              "중복 제출을 방지하고 본인인증 팝업 차단·종료에 따른 예외를 처리했습니다. HTTP 상태와 API 업무 응답 코드를 구분해 중복 신청·오류 응답이 정상 완료로 처리되거나 전환 이벤트가 잘못 발생하는 문제를 방지했습니다.",
          },
          {
            title: "공통 UI 컴포넌트 설계",
            description:
              "사전계약·온라인 상담의 중복 신청 안내 팝업을 공통 Vue 컴포넌트로 통합하고, 신청 유형·응답 상태별 문구와 버튼을 분기했습니다. 팝업 내부 Tab 순환, Escape 닫기, 진입·종료 시 포커스 이동과 복원, 배경 스크롤 제어를 구현했습니다.",
          },
          {
            title: "마케팅 데이터 수집 로직 개선",
            description:
              "국가 정보를 dataLayer에 설정한 뒤 GTM을 실행하도록 초기화 순서를 조정했습니다. DOM 준비 여부와 초기화 플래그를 확인해 태그 중복 초기화를 방지하고, 유입 파라미터에 undefined 값이 전달되지 않도록 수정했습니다.",
          },
          {
            title: "브랜드 캠페인 반응형 화면 구현",
            description:
              "All-New ES, Lexus Collection 등 캠페인의 PC·모바일 화면을 제작했습니다. 기기별 Swiper 설정과 갤러리 탐색, 이미지 확대 및 플로팅 애니메이션을 구현했습니다.",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Kia Worldwide",
    subtitle: "기아 글로벌 웹사이트 구축 및 고도화",
    category: "실무 프로젝트",
    year: "2025—26",
    visual: "kia",
    description:
      "기아 글로벌 웹사이트 Kia Worldwide의 구축 및 고도화에 참여했습니다. 브랜드·차량 콘텐츠의 반응형 UI와 스크롤 인터랙션을 개발하고, 차량 탐색 UI·컴포넌트 구조·Safari 호환성과 반응형 화면의 품질을 개선했습니다.",
    stack: ["React", "TypeScript", "Emotion", "Vite"],
    role: "프론트엔드 개발 · 웹사이트 구축 및 고도화",
    responsibilities: [
      "브랜드·차량 콘텐츠 및 스크롤 인터랙션 개발",
      "차량 탐색 UI·컴포넌트 구조 개선",
      "Safari 호환성·디자인 QA 및 UI 품질 개선",
    ],
    site: "https://worldwide.kia.com/int",
    highlights: [
      {
        title: "브랜드·차량 콘텐츠 구현",
        description:
          "Opposites United, EV2, The Ocean Cleanup 등 주요 콘텐츠의 PC·모바일 반응형 UI와 스크롤 인터랙션을 개발했습니다.",
      },
      {
        title: "차량 탐색 UI 개선",
        description:
          "EV·ICE·Hybrid·PBV 슬라이더의 전환 효과와 내비게이션, 모바일 페이지네이션을 구현해 디바이스별 탐색 경험을 개선했습니다.",
      },
      {
        title: "컴포넌트 구조 개선",
        description:
          "Platform 슬라이더를 차량 이미지·내비게이션·설명 등 역할별 컴포넌트로 분리해 수정 범위를 명확히 하고 유지보수성을 높였습니다.",
      },
      {
        title: "브라우저 호환성 확보",
        description:
          "iOS Safari의 스크롤 바운스로 발생하는 헤더 오동작을 해결하고, 영상 모션 방식을 변경해 Safari 표시 오류를 개선했습니다.",
      },
      {
        title: "디자인 QA 및 UI 품질 개선",
        description:
          "디자인 QA를 통해 PC·모바일 반응형 레이아웃과 컬러 토큰, 대체 텍스트를 정비했습니다.",
      },
    ],
  },
  {
    id: 5,
    title: "Aeppy",
    subtitle: "사진·일정·편지를 함께 기록하는 커플 웹앱",
    category: "개인 프로젝트",
    year: "2026",
    visual: "couple",
    image: "/projects/aeppy-cover.webp",
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
];
