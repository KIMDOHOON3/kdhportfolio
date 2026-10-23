"use client";

import Link from "next/link";
import type { ComponentPropsWithRef } from "react";
import { ButtonLight } from "./ButtonEffect";

/** Adds the shared effect without adding a wrapper or changing caller styles. */
export function Button({
  children,
  type = "button",
  ...props
}: ComponentPropsWithRef<"button">) {
  return (
    <button {...props} type={type} data-button-effect>
      <ButtonLight />
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentPropsWithRef<"a"> & { href: string } & (
    | { navigation: "client"; scroll?: boolean }
    | { navigation?: "document"; scroll?: never }
  );

/** Client routes opt in to Next Link; anchors, downloads and external URLs stay native. */
export function ButtonLink({
  children,
  navigation = "document",
  scroll,
  ...props
}: ButtonLinkProps) {
  const content = (
    <>
      <ButtonLight />
      {children}
    </>
  );
  return navigation === "client" ? (
    <Link {...props} scroll={scroll} data-button-effect>
      {content}
    </Link>
  ) : (
    <a {...props} data-button-effect>
      {content}
    </a>
  );
}
