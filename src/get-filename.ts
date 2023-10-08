import type { Rule } from "eslint";
/**
 * Returns the filename associated with the source.
 */
export function getFilename(context: Rule.RuleContext): string {
  return context.filename ?? context.getFilename();
}
