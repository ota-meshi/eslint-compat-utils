import type { Rule } from "eslint";

/**
 * Returns the `cwd` option passed to the Linter.
 */
export function getCwd(context: Rule.RuleContext): string {
  return (
    context.cwd ??
    context.getCwd?.() ??
    // getCwd is added in v6.6.0
    process.cwd()
  );
}
