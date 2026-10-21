export type ProjectHighlight = {
  title: string;
  description: string;
  steps?: { label: string; description: string }[];
};

export type ProjectPhase = {
  id: string;
  title: string;
  year: string;
  role: string;
  stack: string[];
  highlights: ProjectHighlight[];
};

export type PortfolioProject = {
  id: number;
  title: string;
  subtitle: string;
  category: "실무 프로젝트" | "개인 프로젝트";
  year: string;
  periods?: { label: string; value: string }[];
  visual: "lexus" | "legacy" | "kia" | "dog" | "couple";
  image?: string;
  description: string;
  stack: string[];
  role: string;
  site?: string;
  responsibilities?: string[];
  github?: string;
  highlights: ProjectHighlight[];
  phases?: ProjectPhase[];
};

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 1,
    title: "LEXUS",
    subtitle: "상담·예약 UI 개발과 운영 신청 흐름 개선",
    category: "실무 프로젝트",
    year: "2026.04–10",
    periods: [
      { label: "운영", value: "2026.04–10" },
      { label: "리뉴얼", value: "2026.05–10" },
    ],
    visual: "lexus",
    description:
      "렉서스 코리아 웹사이트 운영(2026.04–10)과 리뉴얼(2026.05–10)을 병행했습니다. 상담신청 폼·예약 달력·공통 LNB·Three.js 별 표현을 직접 구현하고, 두 업무의 프론트엔드 작업 분배·일정 관리·QA 조율을 맡았습니다.",
    stack: [
      "React",
      "TypeScript",
      "Zustand",
      "Vite",
      "Tailwind CSS",
      "Three.js",
      "Vue 2",
      "JavaScript",
      "SCSS",
      "jQuery",
      "Swiper",
    ],
    role: "프론트엔드 개발 · 작업 분배·일정 관리·QA 조율",
    responsibilities: [
      "상담신청 폼·예약 달력·마이페이지 공통 LNB 개발",
      "Three.js 별 표현·이미지 시퀀스 차량 뷰어 구현",
      "시승 신청 흐름 개선·프론트엔드 일정 및 QA 조율",
    ],
    site: "https://www.lexus.co.kr/",
    highlights: [],
    phases: [
      {
        id: "renewal",
        title: "웹사이트 리뉴얼",
        year: "2026.05–10",
        role: "운영과 병행 · 상담신청 폼·예약 달력·공통 LNB·별 표현 직접 개발 · 프론트엔드 작업 분배·일정 관리·QA 조율",
        stack: [
          "React",
          "TypeScript",
          "Zustand",
          "Vite",
          "Tailwind CSS",
          "Three.js",
        ],
        highlights: [
          {
            title: "전시장 상담신청 폼",
            description:
              "전시장 상담신청 입력 폼과 API·본인인증 연동, 약관·안내 모달을 구현했습니다.",
          },
          {
            title: "외부 달력 라이브러리 없이 예약 달력 구현",
            description:
              "서비스 예약 달력 컴포넌트를 직접 만들고, 날짜·시간 선택 UI와 Zustand 기반 상태 관리를 구성했습니다. 고객·서비스 유형별 예약 가능일 정책과 차량·센터 변경 시 종속 선택값 초기화를 적용했습니다.",
          },
          {
            title: "마이페이지 공통 LNB 컴포넌트",
            description:
              "마이페이지의 여러 화면에서 사용하는 공통 LNB 컴포넌트를 개발했습니다.",
          },
          {
            title: "Three.js를 사용한 메인 별 표현",
            description:
              "메인 페이지 인터랙션 중 Three.js를 사용한 별 표현을 직접 구현했습니다.",
          },
          {
            title: "오픈 전 기능·반응형·브라우저 QA",
            description:
              "오픈 시나리오에 맞춰 화면 크기별 표시와 주요 기능, 삼성 인터넷·Safari 등의 브라우저 점검 항목을 정하고 수동으로 확인했습니다.",
          },
        ],
      },
      {
        id: "operations",
        title: "운영 · 기능 개선",
        year: "2026.04–10",
        role: "리뉴얼과 병행 · 시승 신청 흐름 개선·360° 차량 뷰어 개발 · 프론트엔드 작업 분배·일정 관리·QA 조율",
        stack: ["Vue 2", "JavaScript", "SCSS", "jQuery", "Swiper"],
        highlights: [
          {
            title: "시승 신청의 연속 제출과 이전 폼 노출 수정",
            description:
              "동일 사용자의 연속 신청에서 발생한 중복 처리 알림을 수동 재현하고, 신청 완료 전후의 버튼과 화면 전환 흐름을 수정했습니다.",
            steps: [
              {
                label: "문제",
                description:
                  "동일 사용자가 1~2초 간격으로 연속 신청해 중복 처리 알림이 발생했습니다.",
              },
              {
                label: "재현",
                description:
                  "테스트 서버에서 신청 버튼을 연속 클릭하며 상황을 수동으로 재현했습니다.",
              },
              {
                label: "원인 확인",
                description:
                  "완료 팝업이 표시되는 동안 이전 폼의 신청 버튼이 다시 노출됐고, 초기 화면으로 이동하는 과정에서도 이전 폼이 잠깐 보이는 것을 확인했습니다.",
              },
              {
                label: "수정",
                description:
                  "신청 버튼의 중복 클릭을 막고, 팝업 종료와 화면 전환 사이에 이전 신청 폼이 노출되지 않도록 흐름을 수정했습니다.",
              },
            ],
          },
          {
            title: "중복 신청 안내 후 다른 전시장을 선택하도록 개선",
            description:
              "같은 안내가 반복되는 흐름을 확인하고, 기획팀과 정책·변경 이력을 검토한 뒤 다른 전시장에 신청을 이어갈 수 있도록 변경했습니다.",
            steps: [
              {
                label: "문제",
                description:
                  "이미 신청한 전시장에 다시 시승을 신청하면 안내 팝업이 나왔습니다. 닫은 뒤에도 이전 폼으로 돌아가 같은 신청과 팝업이 반복됐습니다.",
              },
              {
                label: "정책 확인",
                description:
                  "동작 배경을 추측하지 않고 기획팀과 기존 정책·변경 이력을 확인해 수정 방향을 정했습니다.",
              },
              {
                label: "변경",
                description:
                  "중복 신청 안내 후 시작 단계로 이동하도록 바꿨습니다. 사용자가 다른 전시장을 선택해 같은 차종의 시승을 신청할 수 있게 했습니다.",
              },
            ],
          },
          {
            title: "이미지 시퀀스 기반 360° 차량 뷰어",
            description:
              "프론트엔드에서 이미지 시퀀스를 전환해 차량이 회전하는 모습을 보여주는 뷰어를 구현했습니다.",
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
    year: "2025–2026",
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
        title: "Safari의 레이아웃 정렬 차이 수정",
        description:
          "Chrome에서는 시안대로 보이던 정렬이 Safari에서 다르게 표시되는 현상을 확인했습니다. CSS 구현 방식을 조정해 시안에 맞게 수정했습니다.",
      },
      {
        title: "Safari의 clip-path 인터랙션 표시 수정",
        description:
          "clip-path를 사용하는 인터랙션이 Safari에서 Chrome과 다르게 표시되는 문제를 수정했습니다.",
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
      "인증과 초대 코드로 두 사용자를 연결하고, 사진·일정·기념일·편지를 함께 관리하는 커플 웹앱입니다. 공용 데이터와 클라이언트 상태를 연결하는 흐름, 실시간 변경 구독과 PWA 구성을 구현했습니다.",
    stack: ["Next.js", "TypeScript", "Supabase", "Zustand", "PWA"],
    role: "개인 프로젝트 · 기획, 디자인, 프론트엔드 개발",
    site: "https://aeppy.app/",
    highlights: [
      {
        title: "Supabase 인증과 초대 코드 연결",
        description:
          "Google·카카오·이메일 인증과 초대 코드 입력을 통한 커플 연결 흐름을 구현했습니다. 로그인 상태를 구독하고, 연결된 커플 정보를 불러오도록 구성했습니다.",
      },
      {
        title: "사진·공유 일정·편지 기록",
        description:
          "사진 기록과 공유 일정, 기념일·위시리스트·편지를 조회하고 작성하는 화면을 구성했습니다. 화면의 작업을 Zustand 상태와 Supabase 조회·저장 함수에 연결했습니다.",
      },
      {
        title: "공용 대표이미지 저장과 실시간 상태 동기화",
        description:
          "대표이미지를 개인 프로필별로 저장하던 구조에서 커플 공용 데이터로 옮겼습니다. 초기 조회와 변경 구독이 같은 공용 값을 사용하도록 구성했습니다.",
        steps: [
          {
            label: "변경 전",
            description:
              "홈에서 함께 사용하는 대표이미지가 개인 프로필 데이터에 저장돼 있었습니다.",
          },
          {
            label: "변경",
            description:
              "저장·초기 조회를 커플 공용 데이터 기준으로 통일하고, Supabase Realtime 변경 이벤트를 받아 Zustand의 대표이미지 상태를 갱신하도록 연결했습니다.",
          },
        ],
      },
      {
        title: "PWA 구성과 정적 리소스 캐시",
        description:
          "웹 앱 매니페스트와 서비스 워커를 구성했습니다. 정적 리소스는 캐시하고, 인증 API·HTML·외부 데이터 요청은 캐시 대상에서 제외하도록 처리했습니다.",
      },
    ],
  },
  {
    id: 4,
    title: "Dog Atlas",
    subtitle: "이름 검색과 생활 조건 필터로 탐색하는 견종도감",
    category: "개인 프로젝트",
    year: "2026",
    visual: "dog",
    description:
      "견종 이름·별칭 검색과 체구·활동량 등 생활 조건 필터를 구현한 견종도감입니다. 상세 화면은 과거 역할·행동 경향·돌봄과 맞이 준비 정보를 나눠 보여줍니다. 서비스 카탈로그에는 고유 slug 기준 376개 항목을 수록했습니다.",
    stack: ["Next.js", "TypeScript", "CSS Modules", "Zod"],
    role: "개인 프로젝트 · 기획, 디자인, 프론트엔드 개발",
    site: "https://dog-atlas-eosin.vercel.app/",
    github: "https://github.com/KIMDOHOON3/dog-atlas",
    highlights: [
      {
        title: "한글·영문·별칭 검색과 생활 조건 필터",
        description:
          "견종 이름과 별칭을 검색할 수 있도록 공백·하이픈·대소문자를 정규화하고 일치도에 따라 결과를 정렬했습니다. 체구·활동량 등 필터는 URL과 연결해 조건을 공유하거나 다시 열 수 있도록 구성했습니다.",
      },
      {
        title: "필터 URL 호환성과 목록의 단계별 렌더링",
        description:
          "체구 선택에서 초소형을 소형에 통합하면서 기존 URL 값도 소형으로 해석하도록 처리했습니다. 목록은 일부 결과부터 렌더링하고 스크롤에 따라 추가로 보여주도록 구성했습니다.",
        steps: [
          {
            label: "변경",
            description:
              "기존 extra-small 필터 URL을 small로 변환해 읽도록 처리하고, 중복되거나 유효하지 않은 선택값을 정리했습니다.",
          },
          {
            label: "확인",
            description:
              "현재 공개 화면에서 URL의 체구·활동량 조건이 선택 상태와 검색 결과에 반영되는 것을 확인했습니다.",
          },
        ],
      },
      {
        title: "상세 정보와 인터랙션용 데이터 분리",
        description:
          "견종의 과거 역할·생활 경향·돌봄·맞이 준비 정보를 구분해 화면을 구성했습니다. 인터랙션 컴포넌트에는 필요한 필드만 새 객체로 전달하도록 바꿔 상세 데이터 전체가 넘어가지 않도록 했습니다.",
      },
      {
        title: "376개 항목 집계와 Zod 구조 검증",
        description:
          "376은 서비스 카탈로그의 고유 항목 수로, 국제 등록 견종 외 국내 보존견·교잡견 등의 항목도 포함합니다. Zod로 필수 필드·형식·slug 중복을 검사하고 출처 정보를 별도로 관리했습니다. 이 구조 검사는 견종 설명의 사실성이나 전문가 검수를 보장하는 검증과는 구분했습니다.",
      },
    ],
  },
];
