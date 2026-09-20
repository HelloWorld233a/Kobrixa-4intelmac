import type { ComponentProps } from "react";
import { Link } from "react-router";

/** Route site pages in place; keep downloads, external URLs and focusable anchors native. */
export function AppLink({ href, ...props }: ComponentProps<"a">) {
  if (href?.startsWith("/") && !href.startsWith("//") && props.download == null) {
    return <Link to={href} {...props} />;
  }
  return <a href={href} {...props} />;
}
