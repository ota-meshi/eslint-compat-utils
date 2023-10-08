import type { Rule } from "eslint";
import { getFilename } from "./get-filename";
import { dirname, basename, extname } from "path";
import { existsSync } from "fs";
/**
 * When linting a file, it returns the full path of the file on disk without any code block information.
 * When linting text, it returns the value passed to —stdin-filename or <text> if not specified.
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
