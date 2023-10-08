import type { Rule } from "eslint";
import { getFilename } from "./get-filename";
import { dirname, basename, extname } from "path";
import { existsSync } from "fs";
/**
 * Gets the value of `context.physicalFilename`,
 * but for older ESLint it returns the result of `context.getPhysicalFilename()`.
 * Versions older than v7.28.0 return a value guessed from the result of `context.getFilename()`,
 * but it may be incorrect.
 */
export function getPhysicalFilename(context: Rule.RuleContext): string {
  const physicalFilename =
    context.physicalFilename ?? context.getPhysicalFilename?.();
  if (physicalFilename != null) {
    return physicalFilename;
  }

  // Guess physicalFilename from filename.
  const filename = getFilename(context);
  let target = filename;
  while (/^\d+_/u.test(basename(target)) && !existsSync(target)) {
    const next = dirname(target);
    if (next === target || !extname(next)) {
      break;
    }
    target = next;
  }
  return target;
}
