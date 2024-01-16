/** Get "eslint/use-at-your-own-risk" */
export function getUnsupported(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
    return require("eslint/use-at-your-own-risk");
  } catch {
    return {};
  }
}
