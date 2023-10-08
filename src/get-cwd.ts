import type { Rule } from "eslint";

/**
 * Gets the value of `context.cwd`, but for older ESLint it returns the result of `context.getCwd()`.
 * Versions older than v6.6.0 return a value from the result of `process.cwd()`.
 */
export function getCwd(context: Rule.RuleContext): string {
  return (
    context.cwd ??
    context.getCwd?.() ??
    // getCwd is added in v6.6.0
    process.cwd()
  );
}
