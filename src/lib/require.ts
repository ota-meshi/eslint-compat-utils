import { createRequire } from "module";

/** Load module */
export function safeRequire(name: string): any {
  try {
    return createRequire(`${process.cwd()}/__placeholder__.js`)(name);
  } catch {
    return undefined;
  }
}

/** Get module path or name */
export function safeRequireResolve(name: string): string {
  try {
    return createRequire(`${process.cwd()}/__placeholder__.js`).resolve(name);
  } catch {
    return name;
  }
}
