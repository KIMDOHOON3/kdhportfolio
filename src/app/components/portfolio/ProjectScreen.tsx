/** Original project overview, distinct from the client's website. */
export default function ProjectScreen({ kind, mobile = false }: { kind: "lexus" | "kia"; mobile?: boolean }) {
  const lexus = kind === "lexus";
  const ink = lexus ? "#e4eaf0" : "#203a33";
  const muted = lexus ? "#9caebc" : "#607d70";
  const panel = lexus ? "#283944" : "#cfddd0";
  const tasks = lexus ? ["상담 · 예약 UI", "API · 인증 연동", "360° 차량 뷰어"] : ["스크롤 인터랙션", "차량 슬라이더", "브라우저별 조율"];
  return (
    <svg viewBox={`0 0 ${mobile ? 390 : 1440} ${mobile ? 844 : 960}`} width="100%" height="100%" data-project-screen={kind} aria-hidden="true" style={{ display: "block", fontFamily: '"Pretendard-Regular", Arial, sans-serif' }}>
      <rect width="100%" height="100%" fill={lexus ? "#182832" : "#edf2e8"} />
      <text x={mobile ? 24 : 70} y={mobile ? 60 : 80} fontSize={mobile ? 22 : 32} fill={ink}>{lexus ? "LEXUS" : "Kia Worldwide"}</text>
      <text x={mobile ? 24 : 70} y={mobile ? 130 : 210} fontSize={mobile ? 12 : 19} letterSpacing="3" fill={muted}>PORTFOLIO · WORK NOTES</text>
      {(lexus ? ["상담과 예약을", "하나의 흐름으로"] : ["스크롤로 이어지는", "브랜드 경험"]).map((line, index) => <text key={line} x={mobile ? 24 : 70} y={(mobile ? 190 : 310) + index * (mobile ? 48 : 90)} fontSize={mobile ? 37 : 74} fill={ink}>{line}</text>)}
      <g transform={mobile ? "translate(24 300)" : "translate(845 188)"}>
        <rect width={mobile ? 342 : 490} height={mobile ? 220 : 350} rx="18" fill={panel} />
        <circle cx={mobile ? 171 : 245} cy={mobile ? 110 : 175} r={mobile ? 72 : 120} fill="none" stroke={muted} />
        {[0, 1, 2].map(i => <rect key={i} x={mobile ? 70 + i * 72 : 100 + i * 100} y={mobile ? 92 - i * 10 : 150 - i * 15} width={mobile ? 56 : 78} height={mobile ? 44 + i * 20 : 65 + i * 30} rx="8" fill={i === 1 ? muted : ink} opacity={.4 + i * .2} />)}
      </g>
      {tasks.map((task, index) => (
        <g key={task} transform={mobile ? `translate(24 ${566 + index * 75})` : `translate(${70 + index * 445} 650)`}>
          <rect width={mobile ? 342 : 410} height={mobile ? 60 : 190} rx="10" fill={panel} />
          <text x="20" y={mobile ? 38 : 55} fontSize={mobile ? 15 : 23} fill={muted}>0{index + 1}</text>
          <text x={mobile ? 65 : 20} y={mobile ? 38 : 125} fontSize={mobile ? 18 : 30} fill={ink}>{task}</text>
        </g>
      ))}
      <text x={mobile ? 24 : 70} y={mobile ? 825 : 915} fontSize={mobile ? 11 : 18} fill={muted}>김도훈 · 프론트엔드 개발 · 구성 예시</text>
    </svg>
  );
}
