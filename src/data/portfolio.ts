export type ProjectHighlight = {
  title: string;
  description: string;
  emphasis?: string[];
  steps?: { label: string; description: string; emphasis?: string[] }[];
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
  emphasis?: string[];
  stack: string[];
  role: string;
  site?: string;
  responsibilities?: string[];
  github?: string;
  highlights: ProjectHighlight[];
  phases?: ProjectPhase[];
  implementationTitle?: string;
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
    emphasis: [
      "상담신청 폼·예약 달력·공통 LNB·Three.js 별 표현",
      "프론트엔드 작업 분배·일정 관리·QA 조율",
    ],
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
            emphasis: ["상담신청 입력 폼", "API·본인인증 연동"],
          },
          {
            title: "외부 달력 라이브러리 없이 예약 달력 구현",
            description:
              "서비스 예약 달력 컴포넌트를 직접 만들고, 날짜·시간 선택 UI와 Zustand 기반 상태 관리를 구성했습니다. 고객·서비스 유형별 예약 가능일 정책과 차량·센터 변경 시 종속 선택값 초기화를 적용했습니다.",
            emphasis: [
              "서비스 예약 달력 컴포넌트를 직접",
              "예약 가능일 정책",
              "종속 선택값 초기화",
            ],
          },
          {
            title: "마이페이지 공통 LNB 컴포넌트",
            description:
              "마이페이지의 여러 화면에서 사용하는 공통 LNB 컴포넌트를 개발했습니다.",
            emphasis: ["공통 LNB 컴포넌트"],
          },
          {
            title: "Three.js를 사용한 메인 별 표현",
            description:
              "메인 페이지 인터랙션 중 Three.js를 사용한 별 표현을 직접 구현했습니다.",
            emphasis: ["Three.js를 사용한 별 표현"],
          },
          {
            title: "오픈 전 기능·반응형·브라우저 QA",
            description:
              "오픈 시나리오에 맞춰 화면 크기별 표시와 주요 기능, 삼성 인터넷·Safari 등의 브라우저 점검 항목을 정하고 수동으로 확인했습니다.",
            emphasis: ["화면 크기별 표시와 주요 기능", "수동으로 확인"],
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
                emphasis: ["테스트 서버", "수동으로 재현"],
              },
              {
                label: "원인 확인",
                description:
                  "완료 팝업이 표시되는 동안 이전 폼의 신청 버튼이 다시 노출됐고, 초기 화면으로 이동하는 과정에서도 이전 폼이 잠깐 보이는 것을 확인했습니다.",
                emphasis: [
                  "이전 폼의 신청 버튼이 다시 노출",
                  "이전 폼이 잠깐 보이는 것",
                ],
              },
              {
                label: "수정",
                description:
                  "신청 버튼의 중복 클릭을 막고, 팝업 종료와 화면 전환 사이에 이전 신청 폼이 노출되지 않도록 흐름을 수정했습니다.",
                emphasis: [
                  "중복 클릭을 막고",
                  "이전 신청 폼이 노출되지 않도록",
                ],
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
                emphasis: ["기획팀과 기존 정책·변경 이력을 확인"],
              },
              {
                label: "변경",
                description:
                  "중복 신청 안내 후 시작 단계로 이동하도록 바꿨습니다. 사용자가 다른 전시장을 선택해 같은 차종의 시승을 신청할 수 있게 했습니다.",
                emphasis: ["시작 단계로 이동", "다른 전시장을 선택"],
              },
            ],
          },
          {
            title: "이미지 시퀀스 기반 360° 차량 뷰어",
            description:
              "프론트엔드에서 이미지 시퀀스를 전환해 차량이 회전하는 모습을 보여주는 뷰어를 구현했습니다.",
            emphasis: ["이미지 시퀀스를 전환"],
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
    emphasis: [
      "반응형 UI·스크롤 인터랙션",
      "이미지 로딩 시점에 따른 슬라이더 높이 계산, iOS 헤더 방향 판정, Safari 영상 모션",
    ],
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
            emphasis: ["PC·모바일 반응형 UI와 스크롤 인터랙션"],
          },
          {
            title: "차량 슬라이더의 전환·탐색 UI",
            description:
              "EV·ICE·Hybrid·PBV 슬라이더의 전환 효과와 내비게이션, 모바일 페이지네이션을 구현했습니다.",
            emphasis: ["전환 효과와 내비게이션, 모바일 페이지네이션"],
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
            emphasis: ["실제 이미지 로딩 완료 기준"],
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
                emphasis: [
                  "로드 완료 이벤트를 기다린 뒤",
                  "이미지가 없거나 이미 준비된 경우",
                  "이벤트 리스너를 제거",
                ],
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
            emphasis: ["상하단 예외 처리와 누적 이동량 기준"],
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
                emphasis: [
                  "하단 근처에서는 상태 변경을 보류",
                  "같은 방향의 이동량이 기준을 넘었을 때",
                ],
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
                emphasis: [
                  "크기는 유지하고 clip-path의 잘라내기 범위를 펼치도록",
                  "하나의 transform 값으로 통합",
                ],
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
            emphasis: ["이미지 36개를 WebP로 전환", "약 19.16MB에서 1.93MB"],
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
                emphasis: ["해당 36개 이미지 파일의 변경 전후 크기 합계"],
              },
            ],
          },
          {
            title: "반복 콘텐츠를 데이터·props 기반으로 공통화",
            description:
              "별도로 관리하던 좌우 콘텐츠 영역을 공통 컴포넌트로 통합했습니다. 콘텐츠 목록은 데이터로, 배치와 이미지 크기 차이는 props로 관리하도록 정리했습니다.",
            emphasis: [
              "공통 컴포넌트로 통합",
              "콘텐츠 목록은 데이터로",
              "배치와 이미지 크기 차이는 props로",
            ],
          },
          {
            title: "플랫폼 차량 슬라이더를 5개 역할로 분리",
            description:
              "상위 슬라이더에 모여 있던 화살표 탐색·큰 차량 이미지·하단 설명·반원형 차량 배치·타이틀을 각각의 컴포넌트로 나누고 상위에서 조합하도록 바꿨습니다. 화면 영역별로 이해하고 수정할 수 있도록 책임을 분리했습니다.",
            emphasis: ["각각의 컴포넌트로 나누고 상위에서 조합", "책임을 분리"],
          },
        ],
      },
    ],
  },
  {
    id: 5,
    title: "Aeppy",
    subtitle: "추억과 일상을 함께 기록하는 커플 다이어리",
    category: "개인 프로젝트",
    year: "2026",
    visual: "couple",
    image: "/projects/aeppy-cover.webp",
    description:
      "사진과 기념일, 서로의 마음을 함께 기록하는 커플 다이어리입니다.",
    emphasis: ["서로의 마음을 함께 기록"],
    stack: ["Next.js", "TypeScript", "Emotion", "Supabase", "Zustand", "PWA"],
    role: "기획·디자인·프론트엔드 개발 · 인증·공유 데이터 연동",
    site: "https://aeppy.app/",
    responsibilities: [
      "초대 코드로 두 사람 연결",
      "사진·기념일·기분·편지 함께 기록",
      "여행·위시 계획과 테마·마스코트 설정",
    ],
    implementationTitle: "문제 해결 사례",
    highlights: [
      {
        title: "실시간 동기화에서 중복·덮어쓰기 방지",
        description:
          "사진 저장 후 카드가 두 장 보이거나, 늦은 저장 응답이 상대의 최신 수정을 덮는 문제가 있었습니다. 사진·일정·위시·D-Day·여행의 저장과 실시간 이벤트를 함께 점검했습니다.",
        emphasis: ["카드가 두 장", "상대의 최신 수정을 덮는"],
        steps: [
          {
            label: "개선",
            description:
              "서버 ID로 중복을 합치고, 저장 중 도착한 최신 변경은 보존했습니다. 계정 전환 뒤 도착한 이전 응답·구독 이벤트는 무시하고, 빠른 연속 제출은 잠금으로 차단했습니다.",
            emphasis: ["서버 ID로 중복을 합치고", "최신 변경은 보존", "이전 응답·구독 이벤트는 무시"],
          },
          {
            label: "확인 결과",
            description:
              "응답 순서·이벤트 반복·계정 전환 등을 다루는 회귀 테스트 30개를 통과했습니다. 사진은 연속 클릭에도 저장 요청 1회·카드 1개를 유지하고, 저장 실패 시 입력한 내용을 보존합니다.",
            emphasis: ["회귀 테스트 30개", "저장 요청 1회·카드 1개"],
          },
        ],
      },
      {
        title: "첫 화면에서 앨범 사진까지 받던 로딩 개선",
        description:
          "이미지에 lazy 속성을 줘도 비공개 사진의 다운로드는 즉시 실행돼, 화면 밖 앨범 사진까지 한꺼번에 요청했습니다.",
        emphasis: ["화면 밖 앨범 사진까지 한꺼번에 요청"],
        steps: [
          {
            label: "개선",
            description:
              "화면 근처의 사진부터 불러오고 동시 다운로드를 최대 4개로 제한했습니다. 동일 사진의 요청·메모리 캐시를 공유하고, 독립적인 초기 조회는 병렬화했습니다.",
            emphasis: ["화면 근처의 사진부터", "최대 4개", "초기 조회는 병렬화"],
          },
          {
            label: "확인 결과",
            description:
              "가상 데이터·고정 지연 조건의 로컬 비교에서 초기 사진 요청은 81개→1개, 대표사진 표시는 797ms→508ms로 약 36% 단축했습니다. 각 3회 중앙값입니다.",
            emphasis: ["81개→1개", "797ms→508ms", "약 36% 단축"],
          },
        ],
      },
      {
        title: "사진과 타임캡슐의 접근 권한을 서버에서 제어",
        description:
          "사진은 인증된 본인과 연결된 상대만 읽도록 비공개로 제공했습니다. 타임캡슐은 개봉일 전까지 본문을 내려주지 않고 서버 날짜로 개봉 여부를 판정합니다. 다른 커플의 접근과 조기 개봉 차단을 DB 정책 테스트로 확인했습니다.",
        emphasis: ["본인과 연결된 상대만", "개봉일 전까지 본문을 내려주지 않고"],
      },
    ],
  },
  {
    id: 4,
    title: "Dog Atlas",
    subtitle: "인터랙티브 견종도감·반려견 동반 장소 탐색",
    category: "개인 프로젝트",
    year: "2026",
    visual: "dog",
    description:
      "수채화 카드로 견종을 알아보고, 생활 조건에 맞는 견종과 반려견 동반 장소를 찾는 서비스입니다.",
    emphasis: ["수채화 카드로 견종을 알아보고"],
    stack: ["Next.js", "TypeScript", "Three.js", "CSS Modules", "Zod"],
    role: "기획·디자인·프론트엔드 개발 · 데이터 구조 설계 · 배포·운영",
    site: "https://dog-atlas-eosin.vercel.app/",
    github: "https://github.com/KIMDOHOON3/dog-atlas",
    responsibilities: [
      "카드 뒤집기·삽화와 연동되는 견종 상세",
      "376종 검색·생활 조건 필터",
      "동반 장소 검색·이용 조건 안내·길찾기",
    ],
    implementationTitle: "문제 해결 사례",
    highlights: [
      {
        title: "그래픽 전환이 중단돼도 탐색이 이어지는 카드",
        description:
          "카드 전환은 WebGL 효과와 HTML 내용을 함께 바꾸므로, 그래픽 오류나 연속 입력에도 빈 카드나 잠긴 화면 없이 다음 견종을 읽을 수 있어야 했습니다.",
        emphasis: ["WebGL 효과와 HTML 내용을 함께", "빈 카드나 잠긴 화면 없이"],
        steps: [
          {
            label: "개선",
            description:
              "WebGL 미지원·전환 준비 실패 시 HTML 전환을 사용하고, 전환 도중 그래픽 컨텍스트가 끊기면 목적 카드로 복구했습니다. 반복 입력은 잠그고 모바일의 세로 스크롤과 가로 카드 넘김을 구분했습니다.",
            emphasis: ["HTML 전환", "목적 카드로 복구", "세로 스크롤과 가로 카드 넘김을 구분"],
          },
          {
            label: "확인 결과",
            description:
              "WebGL 미지원·전환 중단·반복 입력·터치 구분 등을 다루는 회귀 테스트 25개를 통과했습니다. 동작 감소 설정에서도 즉시 카드 전환과 견종 정보 탐색을 유지합니다.",
            emphasis: ["회귀 테스트 25개", "견종 정보 탐색을 유지"],
          },
        ],
      },
      {
        title: "화질을 유지하며 3D 운동장 로딩 줄이기",
        description:
          "하단 3D 운동장이 화면에 들어온 뒤 코드와 모델을 순서대로 받아, 느린 환경에서 표시가 지연됐습니다.",
        emphasis: ["코드와 모델을 순서대로 받아"],
        steps: [
          {
            label: "개선",
            description:
              "화면 근처에서 코드와 모델을 병렬로 준비하고, GLB를 무손실 압축했습니다. 압축 전후 16개 메시의 정점·재질·배치가 같은지도 검사했습니다.",
            emphasis: ["병렬로 준비", "무손실 압축", "16개 메시"],
          },
          {
            label: "확인 결과",
            description:
              "모델 파일은 1.14MB→0.63MB로 44.6% 줄었습니다. CPU·네트워크를 제한한 모바일 모사에서 진입 후 준비 시간은 10.54초→5.91초로 약 44% 단축했습니다. 각 3회 중앙값입니다.",
            emphasis: ["44.6%", "10.54초→5.91초", "약 44% 단축"],
          },
        ],
      },
      {
        title: "일부 API가 실패해도 장소 정보 유지",
        description:
          "장소 상세의 여러 API를 병렬로 조회하고, 실패한 항목만 구분해 정상 정보는 유지했습니다. 위치 권한을 거절하면 지역 검색을 안내하고, 검색 조건 변경 뒤 도착한 이전 결과는 반영하지 않습니다. 각 동작을 회귀 테스트로 확인했습니다.",
        emphasis: ["실패한 항목만 구분해 정상 정보는 유지", "이전 결과는 반영하지 않습니다"],
      },
    ],
  },
];
