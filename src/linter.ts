import * as eslint from "eslint";
import * as semver from "semver";
import { convertConfigToRc } from "./lib/convert-config";

let cacheLinter: typeof eslint.Linter | undefined;

/**
 * Get Linter class
 */
export function getLinter(): typeof eslint.Linter {
  if (cacheLinter) {
    return cacheLinter;
  }
  if (semver.gte(eslint.Linter.version, "9.0.0-0")) {
    return (cacheLinter = eslint.Linter);
  }
  return (cacheLinter = getLinterClassForV8());
}

/**  Get Linter class */
function getLinterClassForV8(): typeof eslint.Linter {
  return class LinterForV8 extends eslint.Linter {
    public static get version() {
      return eslint.Linter.version;
    }

    public verify(
      code: string,
      config: any,
      option: any,
    ): eslint.Linter.LintMessage[] {
      const newConfig = convertConfigToRc(config, this);
      return super.verify(code, newConfig as any, option);
    }
  };
}
