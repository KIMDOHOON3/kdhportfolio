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
      "기아 글로벌 웹사이트 Kia Worldwide의 브랜드·차량 콘텐츠와 반응형 UI·스크롤 인터랙션을 개발했습니다. 이미지 로딩 시점에 따른 슬라이더 높이 계산, iOS 헤더 방향 판정, Safari 영상 모션을 개선하고, 이미지 파일 용량 절감과 공통 컴포넌트 구조 정비를 맡았습니다.",
    stack: ["React", "TypeScript", "Emotion", "Vite"],
    role: "프론트엔드 개발 · 웹사이트 구축 및 고도화",
    responsibilities: [
      "브랜드·차량 콘텐츠 및 스크롤 인터랙션 개발",
      "이미지 로딩·iOS 헤더·Safari 영상 모션 개선",
      "이미지 파일 용량 절감·공통 컴포넌트 구조 정비",
    ],
    site: "https://worldwide.kia.com/int",
    highlights: [],
    phases: [
      {
        id: "implementation",
        title: "직접 구현한 범위",
        year: "2025–2026",
        role: "브랜드·차량 콘텐츠의 반응형 UI · 스크롤 인터랙션 · 차량 탐색 UI 개발",
        stack: ["React", "TypeScript", "Emotion", "Vite"],
        highlights: [
          {
            title: "브랜드·차량 콘텐츠와 스크롤 인터랙션",
            description:
              "Opposites United, EV2, The Ocean Cleanup 등 주요 콘텐츠의 PC·모바일 반응형 UI와 스크롤 인터랙션을 개발했습니다.",
          },
          {
            title: "차량 슬라이더의 전환·탐색 UI",
            description:
              "EV·ICE·Hybrid·PBV 슬라이더의 전환 효과와 내비게이션, 모바일 페이지네이션을 구현했습니다.",
          },
        ],
      },
      {
        id: "problem-solving",
        title: "대표 문제 해결",
        year: "2025–2026",
        role: "비동기 이미지 로딩과 레이아웃 계산 · iOS 스크롤 예외 처리 · Safari 영상 모션 개선",
        stack: ["React", "TypeScript", "Emotion"],
        highlights: [
          {
            title: "이미지 준비 상태에 맞춘 슬라이더 높이 계산",
            description:
              "높이 재계산 시점을 타이머 실행에서 실제 이미지 로딩 완료 기준으로 변경했습니다.",
            steps: [
              {
                label: "문제",
                description:
                  "슬라이더 초기화 시 이미지 로딩이 끝나지 않으면 실제 이미지 높이를 기준으로 레이아웃을 계산하기 어려웠습니다.",
              },
              {
                label: "원인 확인",
                description:
                  "기존 타이머는 실행을 미룰 뿐 이미지 로딩 완료를 보장하지 않았습니다.",
              },
              {
                label: "변경",
                description:
                  "이미지의 로딩 상태를 확인하고, 준비되지 않은 이미지는 로드 완료 이벤트를 기다린 뒤 높이를 다시 계산하도록 바꿨습니다. 이미지가 없거나 이미 준비된 경우도 처리하고, 정리 함수에서 이벤트 리스너를 제거했습니다.",
              },
              {
                label: "결과",
                description:
                  "높이 계산을 비동기 이미지의 실제 준비 시점과 연결하도록 초기화 흐름을 개선했습니다.",
              },
            ],
          },
          {
            title: "iOS 바운스 스크롤을 고려한 헤더 방향 판정",
            description:
              "상하단 예외 처리와 누적 이동량 기준을 추가해 바운스·미세 움직임과 실제 방향 전환을 구분하도록 개선했습니다.",
            steps: [
              {
                label: "문제",
                description:
                  "직전 위치와 현재 위치만 비교하면 iOS의 상하단 바운스와 미세 움직임도 스크롤 방향 전환으로 해석될 수 있었습니다.",
              },
              {
                label: "변경",
                description:
                  "상단 overscroll에서는 헤더를 표시하고 누적 이동량을 초기화했습니다. 하단 근처에서는 상태 변경을 보류하고, 같은 방향의 이동량이 기준을 넘었을 때 표시·숨김 상태를 바꾸도록 했습니다.",
              },
              {
                label: "결과",
                description:
                  "플랫폼 특유의 바운스와 작은 움직임을 고려하도록 공통 헤더의 상태 전환 기준을 정비했습니다.",
              },
            ],
          },
          {
            title: "Safari 영상 모션을 clip-path 방식으로 전환",
            description:
              "Safari에서 발생한 영상 등장 모션 오류에 대응해 크기를 늘리는 방식에서 잘라내기 영역을 펼치는 방식으로 변경했습니다.",
            steps: [
              {
                label: "문제",
                description:
                  "공통 영상 등장 모션이 Safari에서 다르게 표시되는 문제가 있었습니다.",
              },
              {
                label: "기존 방식",
                description:
                  "중앙에 배치한 영상 영역의 너비와 높이를 늘려 등장시키는 구조였습니다.",
              },
              {
                label: "변경",
                description:
                  "영상 영역의 크기는 유지하고 clip-path의 잘라내기 범위를 펼치도록 바꿨습니다. 전환 대상도 clip-path로 맞추고, 영상의 배율과 위치 이동을 하나의 transform 값으로 통합했습니다.",
              },
              {
                label: "결과",
                description:
                  "크기 변화에 의존하던 효과를 공통 영상 모션 컴포넌트에서 교체해 Safari 표시 오류에 대응했습니다.",
              },
            ],
          },
        ],
      },
      {
        id: "asset-and-structure",
        title: "용량·구조 개선",
        year: "2025–2026",
        role: "EV·브랜드 이미지 WebP 전환 · 반복 콘텐츠 공통화 · 플랫폼 슬라이더의 역할별 분리",
        stack: ["React", "TypeScript", "Emotion"],
        highlights: [
          {
            title: "이미지 36개 파일 용량을 약 90% 절감",
            description:
              "EV·브랜드 이미지 36개를 WebP로 전환하고 참조 경로를 정비해 해당 이미지 파일 합계를 약 19.16MB에서 1.93MB로 줄였습니다.",
            steps: [
              {
                label: "변경",
                description:
                  "EV 이미지 30개와 브랜드 이미지 6개의 JPG·PNG 파일을 WebP로 전환하고, 사용하는 컴포넌트의 이미지 경로를 수정했습니다.",
              },
              {
                label: "비교 범위",
                description:
                  "Git에 저장된 해당 36개 이미지 파일의 변경 전후 크기 합계 기준입니다. 1MB는 1,000,000바이트로 계산했습니다.",
              },
            ],
          },
          {
            title: "반복 콘텐츠를 데이터·props 기반으로 공통화",
            description:
              "별도로 관리하던 좌우 콘텐츠 영역을 공통 컴포넌트로 통합했습니다. 콘텐츠 목록은 데이터로, 배치와 이미지 크기 차이는 props로 관리하도록 정리했습니다.",
          },
          {
            title: "플랫폼 차량 슬라이더를 5개 역할로 분리",
            description:
              "상위 슬라이더에 모여 있던 화살표 탐색·큰 차량 이미지·하단 설명·반원형 차량 배치·타이틀을 각각의 컴포넌트로 나누고 상위에서 조합하도록 바꿨습니다. 화면 영역별로 이해하고 수정할 수 있도록 책임을 분리했습니다.",
          },
        ],
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
