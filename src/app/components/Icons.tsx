import { SVGProps } from "react";
import Image, { StaticImageData } from "next/image";

import HtmlIcon from "/public/icons/html5.svg";
import CssIcon from "/public/icons/css.svg";
import JavaScriptIcon from "/public/icons/javascript.svg";
import ReactIcon from "/public/icons/react.svg";
import NextjsIcon from "/public/icons/nextdotjs.svg";
import TypeScriptIcon from "/public/icons/typescript.svg";
import StyledComponentsIcon from "/public/icons/styledcomponents.svg";
import TailwindIcon from "/public/icons/tailwindcss.svg";
import ReactQueryIcon from "/public/icons/reactquery.svg";
import ReduxIcon from "/public/icons/redux.svg";
import GithubIcon from "/public/icons/github.svg";
import JqueryIcon from "/public/icons/jquery.svg";
import ZustandIcon from "/public/icons/zustand.png";
import PersonIcon from "/public/icons/person.png";
import VercelIcon from "/public/icons/vercel.svg";
import BlogIcon from "/public/icons/blogger.svg";
import ArrowRightIcon from "/public/icons/arrow-right.svg";
import LinkIcon from "/public/icons/link.svg";
import SCSSIcon from "/public/icons/sass.svg";
import DownloadIcon from "/public/icons/download.svg";
import MailIcon from "/public/icons/mail.svg";
import PhoneIcon from "/public/icons/phone.svg";

// 아이콘 인터페이스
interface IconProps extends SVGProps<SVGSVGElement> {
  color?: string;
  size?: number;
}

// PNG 이미지인지 SVG인지 구분
type IconType = {
  component: React.ComponentType<IconProps> | null;
  isPng: boolean;
  src?: StaticImageData;
};

// 스킬 타입 매핑
export const SkillIconMap: Record<string, IconType> = {
  HTML: { component: HtmlIcon, isPng: false },
  CSS: { component: CssIcon, isPng: false },
  JavaScript: { component: JavaScriptIcon, isPng: false },
  jQuery: { component: JqueryIcon, isPng: false },
  React: { component: ReactIcon, isPng: false },
  "Next.js": { component: NextjsIcon, isPng: false },
  TypeScript: { component: TypeScriptIcon, isPng: false },
  "Styled-components": { component: StyledComponentsIcon, isPng: false },
  Tailwind: { component: TailwindIcon, isPng: false },
  "React-query": { component: ReactQueryIcon, isPng: false },
  Redux: { component: ReduxIcon, isPng: false },
  Zustand: { component: null, isPng: true, src: ZustandIcon },
  SCSS: { component: SCSSIcon, isPng: false },
  Vercel: { component: VercelIcon, isPng: false },
};

// 아이콘 컴포넌트
export function Icon({
  name,
  color = "white",
  size = 24,
  ...props
}: IconProps & { name: string }) {
  const iconData = SkillIconMap[name];

  if (!iconData) {
    return null;
  }

  if (iconData.isPng && iconData.src) {
    return <Image src={iconData.src} alt={name} width={size} height={size} />;
  }

  const IconComponent = iconData.component;
  if (!IconComponent) {
    return null;
  }

  return <IconComponent width={size} height={size} fill={color} {...props} />;
}

export {
  HtmlIcon,
  CssIcon,
  JavaScriptIcon,
  ReactIcon,
  NextjsIcon,
  TypeScriptIcon,
  StyledComponentsIcon,
  TailwindIcon,
  ReactQueryIcon,
  ReduxIcon,
  GithubIcon,
  ZustandIcon,
  PersonIcon,
  VercelIcon,
  BlogIcon,
  ArrowRightIcon,
  LinkIcon,
  SCSSIcon,
  DownloadIcon,
  MailIcon,
  PhoneIcon,
};
