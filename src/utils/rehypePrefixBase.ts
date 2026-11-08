import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";

export interface RehypePrefixBaseOptions {
  base?: string;
}

/**
 * Rehype plugin to prefix root-relative URLs (href, src) with Astro's configured base path.
 * Ensures static assets and links resolve correctly both with a subdirectory base
 * (e.g. GitHub Pages `/my-blog`) and at domain root (e.g. Vercel `/`).
 */
export function rehypePrefixBase(options: RehypePrefixBaseOptions = {}) {
  const base = options.base ? options.base.replace(/\/+$/, "") : "";
  if (!base) {
    return () => {};
  }

  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "a" && typeof node.properties?.href === "string") {
        const href = node.properties.href;
        if (
          href.startsWith("/") &&
          !href.startsWith("//") &&
          !href.startsWith(`${base}/`) &&
          href !== base
        ) {
          node.properties.href = `${base}${href}`;
        }
      }

      if (node.tagName === "img" && typeof node.properties?.src === "string") {
        const src = node.properties.src;
        if (
          src.startsWith("/") &&
          !src.startsWith("//") &&
          !src.startsWith(`${base}/`) &&
          src !== base
        ) {
          node.properties.src = `${base}${src}`;
        }
      }
    });
  };
}

export default rehypePrefixBase;
