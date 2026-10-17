import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; color?: string };
// Project-authored geometric symbols; technology names use letter monograms.
export const SkillIconMap: Record<string, string> = {
  HTML: "H", CSS: "C", JavaScript: "JS", jQuery: "JQ", React: "R", "Next.js": "N",
  TypeScript: "TS", "Styled-components": "SC", Tailwind: "TW", "React-query": "RQ",
  Redux: "RX", Zustand: "Z", SCSS: "S", Vercel: "V",
};
export function Icon({ name, size = 24, color = "currentColor", ...props }: IconProps & { name: string }) {
  if (!SkillIconMap[name]) return null;
  const glyphs: Record<string, string> = {
    H: "M8 7v10 M16 7v10 M8 12h8", C: "M16 8H9v8h7", J: "M8 7h8v9h-6v-3",
    R: "M8 17V7h8v5H8 M12 12l4 5", N: "M8 17V7l8 10V7", T: "M7 7h10 M12 7v10",
    S: "M16 7H8v5h8v5H8", W: "m7 7 2 10 3-6 3 6 2-10", Q: "M8 7h8v10H8z M13 14l4 4",
    Z: "M8 7h8L8 17h8", V: "m7 7 5 10 5-10",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" {...props} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d={glyphs[SkillIconMap[name][0]] ?? glyphs.R} /></svg>;
}
function symbol(path: string) {
  return function SymbolIcon({ size = 24, fill, color, ...props }: IconProps) {
    return <svg width={size} height={size} viewBox="0 0 24 24" {...props} fill="none" stroke={color ?? fill ?? "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>;
  };
}
export const MailIcon = symbol("M3 5h18v14H3z M3 6l9 7 9-7");
export const DownloadIcon = symbol("M12 3v12 m-5-5 5 5 5-5 M3 15v6h18v-6");
export const ArrowRightIcon = symbol("M3 12h18 M14 5l7 7-7 7");
export const LinkIcon = symbol("M8 4H4v16h16v-4 M12 4h8v8 M10 14 20 4");
export const GithubIcon = symbol("m8 6-6 6 6 6 M16 6l6 6-6 6 M14 4l-4 16");
export const BlogIcon = symbol("M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h5");
export const PhoneIcon = symbol("M7 2h10v20H7z M10 5h4 M11 19h2");
