import type { Rule } from "eslint";
/**
 * Gets the value of `context.filename`, but for older ESLint it returns the result of `context.getFilename()`.
 */
export function getFilename(context: Rule.RuleContext): string {
  return context.filename ?? context.getFilename();
}
