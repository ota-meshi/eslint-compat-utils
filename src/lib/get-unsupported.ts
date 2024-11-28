import { safeRequire } from "./require";

/** Get "eslint/use-at-your-own-risk" */
export function getUnsupported(): any {
  return safeRequire("eslint/use-at-your-own-risk") || {};
}
