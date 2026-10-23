# 김도훈 · 프론트엔드 포트폴리오

실무 경험과 개인 프로젝트를 소개하는 반응형 포트폴리오입니다. 유리 질감의 레터링과 곡면 갤러리로 작업을 보여주고, 프로젝트 상세에서 담당 범위와 문제 해결 과정을 읽을 수 있도록 구성했습니다.

**[포트폴리오 보기](https://kdhportfolio-omega.vercel.app/)**

이 README는 **포트폴리오 사이트 자체의 구현**을 설명합니다. 렉서스·기아 및 개인 프로젝트의 업무·기능 설명은 사이트의 프로젝트 상세에서 확인할 수 있습니다.

## 화면 구성

- **메인**: HELLO가 획을 따라 그려지고, 유리 구슬과 소개 문구가 차례로 등장합니다.
- **프로젝트**: 곡면 이미지 갤러리에서 드래그·방향키·버튼으로 작업을 선택하고, 실무·개인 프로젝트를 필터링합니다.
- **상세**: 선택한 이미지에서 상세 화면으로 전환하고, 목록으로 돌아오면 프로젝트 선택과 스크롤 위치를 복원합니다.
- **경력·연락처**: 경력과 교육 내용을 읽고, THANK YOU 아래에서 메일·GitHub·PDF 이력서에 접근합니다.

## 기술 구성과 역할

| 기술                             | 이 프로젝트에서 사용하는 곳                                          |
| -------------------------------- | -------------------------------------------------------------------- |
| Next.js 15 App Router · React 19 | 공통 레이아웃, 프로젝트 상세 라우트, UI 상태와 이벤트 처리           |
| TypeScript                       | 프로젝트 데이터, 공통 UI 속성, 갤러리·페이지 전환 간 인터페이스 정의 |
| Three.js · GLSL                  | 유리 레터링, 곡면 이미지와 반사 표현, 갤러리 이미지의 상세 전환      |
| GSAP ScrollTrigger               | 섹션별 등장 시점과 영역 안의 등장 순서 관리                          |
| Web Animations API               | 갤러리 카피의 줄별 전환, 페이지 전환 애니메이션과 취소 처리          |
| Lenis                            | 공통 스크롤 컨테이너의 부드러운 스크롤 처리                          |
| SCSS Modules                     | 컴포넌트 스타일, 반응형 배치, 텍스트 마스크                          |
| Playwright                       | 등장 순서, 갤러리 조작, 상세 복귀, 모바일 레이아웃 회귀 검사         |

## 주요 구현

### 1. 유리 글자가 획을 따라 그려지는 등장 효과

HELLO와 THANK YOU는 3D 모델을 불러와 유리 재질의 셰이더로 렌더링합니다. 글자가 획의 순서대로 드러나도록 정점의 진행값(`aStrokeProgress`)과 현재 등장 진행값(`uStrokeReveal`)을 비교해 아직 그려지지 않은 영역을 숨깁니다.

첫 화면에서는 모델 로딩과 레터링 완료 상태를 기준으로 구슬·소개 문구·CTA의 순서를 이어갑니다. CTA가 등장하기 전에는 스크롤을 잠그고, 모델 로딩에 실패하면 문구를 표시하고 잠금을 해제합니다. 푸터도 레터링이 끝난 뒤 연락 버튼이 나타나도록 연결했습니다.

관련 코드: [유리 장면](src/components/glass/GlassScene.tsx) · [레터링 셰이더](src/components/glass/shaders/glassShaders.ts) · [첫 화면 등장 제어](src/lib/motion/useHeroEntrance.ts)

### 2. 곡면 갤러리와 상세 화면을 연결하는 전환

이미지 패널을 Three.js의 평면 메시로 만들고, 정점 셰이더에서 원호 형태로 휘게 했습니다. 가로와 깊이의 비율을 조절해 양옆의 프로젝트가 이어져 보이도록 구성했습니다. 하단 반사는 같은 이미지 텍스처를 재사용해 흐림과 투명도를 적용합니다.

상세 페이지로 들어갈 때는 선택한 패널의 곡면을 목적지 이미지 영역으로 펼칩니다. 전환 중에는 기존 갤러리 캔버스를 활용하고, 전환 취소 시 애니메이션·임시 표시 상태·스크롤 잠금을 정리합니다.

목록 복귀는 화면 효과와 별도로 관리합니다. 상세 경로가 바뀔 때 현재 프로젝트 ID를 갱신하고, 공통 스크롤 컨테이너의 위치를 저장·복원합니다. 따라서 **렉서스 상세 → 다른 프로젝트 상세 → 목록**으로 이동해도 마지막으로 본 프로젝트를 선택합니다. 현재 필터에 해당 프로젝트가 없으면 전체 필터로 전환합니다.

관련 코드: [곡면·반사·이미지 전환](src/components/projects/gallery/galleryScene.ts) · [페이지 전환 제어](src/lib/navigation/RouteTransition.tsx) · [선택 상태](src/components/projects/gallery/gallerySelection.ts) · [스크롤 복원](src/lib/navigation/routeScroll.ts)

### 3. 실제 줄바꿈을 기준으로 한 텍스트 모션

같은 설명도 모바일과 데스크톱에서는 줄바꿈이 달라집니다. DOM `Range`로 실제 글자의 위치를 측정해 화면에 표시된 줄을 구분합니다. 각 줄에 마스크를 씌우고 아래에서 위로 순차 등장시킵니다.

원본 텍스트는 문서의 높이와 접근성을 담당하고, 애니메이션용 복제 줄은 `aria-hidden`으로 분리합니다. 폰트 로딩과 너비 변경 시 다시 측정하며, 같은 텍스트·너비·폰트 조건에서는 측정 결과를 재사용합니다. 프로젝트를 빠르게 바꾸면 이전 애니메이션을 취소하고 새 선택에 맞춰 전환합니다.

관련 코드: [줄 측정·캐시](src/components/projects/gallery/GalleryLineText.tsx) · [줄별 모션](src/components/projects/gallery/useGalleryCopyMotion.ts) · [섹션 등장 순서](src/lib/motion/entranceObserver.ts)

### 4. 데이터와 공통 UI의 역할 분리

갤러리와 상세 페이지가 하나의 프로젝트 데이터를 참조하도록 구성했습니다. 상세 경로도 이 데이터에서 생성하므로 제목·기간·기술 목록을 화면마다 따로 관리하지 않습니다.

반복되는 버튼과 기술 목록은 공통 컴포넌트로 분리했습니다. 버튼은 시각 효과를 공유하되 클릭 동작은 `<button>`, 이동과 다운로드는 링크로 구분합니다. 내부 라우트 이동만 Next.js `Link`를 사용하고, 메일·다운로드·외부 이동은 네이티브 링크 동작을 유지합니다. 기술 목록의 아이콘·이름 렌더링은 공유하고 배치와 모션은 사용하는 화면에서 결정합니다.

관련 코드: [프로젝트 데이터](src/data/portfolio.ts) · [상세 페이지](src/app/work/[id]/page.tsx) · [공통 버튼](src/components/ui/Button.tsx) · [기술 목록](src/components/ui/TechnologyList.tsx)

## 성능과 사용성에서 고려한 부분

| 상황                                                 | 적용한 방식                                                                                                                                 | 관련 코드                                                                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 갤러리를 보기 전부터 렌더러와 이미지를 준비하는 비용 | 화면 근처에서 갤러리 코드를 불러오고, 선택 이미지부터 표시한 뒤 주변 이미지를 준비합니다. 텍스처와 진행 중인 로딩 요청을 재사용합니다.      | [GalleryCanvas](src/components/projects/gallery/GalleryCanvas.tsx), [galleryScene](src/components/projects/gallery/galleryScene.ts) |
| 화면 밖에서도 계속 도는 3D 장면                      | 노출 상태와 탭 가시성을 확인해 반복 렌더링을 중단합니다. 유리 장면은 렌더링 픽셀 수에도 제한을 둡니다.                                      | [GlassScene](src/components/glass/GlassScene.tsx), [galleryScene](src/components/projects/gallery/galleryScene.ts)                  |
| 모바일 주소창 높이 변화로 모션 배치가 흔들리는 현상  | 터치 환경에서는 너비가 같을 때 기준 레이아웃 높이를 유지하고, 너비 변경 시 다시 계산합니다.                                                 | [useStableViewport](src/lib/scroll/useStableViewport.ts)                                                                            |
| 이미지·폰트의 재다운로드와 오래된 캐시               | 파일 내용의 해시를 URL에 반영하고 장기 캐시를 적용합니다. 내용이 바뀌면 새 URL을 만들고 이전 파일은 보존합니다.                             | [에셋 생성 스크립트](scripts/version-static-assets.mjs), [캐시 설정](next.config.js)                                                |
| 모션을 줄이거나 WebGL을 사용할 수 없는 환경          | `prefers-reduced-motion`을 반영하고, 모델 실패 시 소개·연락 UI를 표시합니다. 갤러리는 정적 이미지와 프로젝트 링크를 대체 경로로 제공합니다. | [GlassScene](src/components/glass/GlassScene.tsx), [ProjectGallery](src/components/projects/gallery/ProjectGallery.tsx)             |

## 검증

Playwright 테스트는 이 포트폴리오 사이트의 동작을 대상으로 합니다. 다음과 같은 사용자 흐름과 예외 상황을 검사합니다.

| 확인하는 내용                                            | 테스트                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 느린 모델 로딩·로딩 실패 시 등장 순서와 스크롤 잠금 해제 | [hero-entrance.spec.ts](tests/browser/hero-entrance.spec.ts)                 |
| THANK YOU 완료 후 연락 버튼 표시, 역스크롤 시 재생 여부  | [footer-entrance.spec.ts](tests/browser/footer-entrance.spec.ts)             |
| 드래그·키보드·필터 조작, 빠른 선택 변경과 줄별 카피 전환 | [project-gallery.spec.ts](tests/browser/project-gallery.spec.ts)             |
| 상세를 연속 방문한 후 목록의 선택 상태 복원              | [gallery-detail-return.spec.ts](tests/browser/gallery-detail-return.spec.ts) |
| 뒤로가기·전환 중단 시 화면과 스크롤 잠금 정리            | [route-transition.spec.ts](tests/browser/route-transition.spec.ts)           |
| 모바일 주소창 높이 변화 시 레이아웃과 유리 버퍼 유지     | [mobile-settle.spec.ts](tests/browser/mobile-settle.spec.ts)                 |
| 공통 기술 목록·메일 링크·PDF 다운로드 동작               | [shared-ui.spec.ts](tests/browser/shared-ui.spec.ts)                         |

브라우저 자동 검사는 Chrome과 모바일 에뮬레이션을 사용합니다. 실제 기기의 Safari·카카오 인앱 브라우저 확인은 별도로 진행해야 합니다.

## 코드 구조

```text
src/
├── app/          # 메인·프로젝트 상세 라우트, 공통 레이아웃
├── components/
│   ├── glass/    # 유리 장면과 셰이더
│   ├── projects/ # 갤러리와 상세 UI
│   ├── home/     # 메인 구성
│   ├── journey/  # 경력·교육
│   ├── layout/   # 헤더·푸터·배경
│   └── ui/       # 공통 버튼·기술 목록·텍스트 UI
├── lib/          # 모션·스크롤·페이지 전환
├── data/         # 프로젝트·경력 데이터
└── styles/       # 전역·공유 스타일
```
