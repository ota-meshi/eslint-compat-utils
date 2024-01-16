import * as eslint from "eslint";
import * as semver from "semver";
import { convertConfigToRc } from "./lib/convert-config";

let cacheLinter: typeof eslint.Linter | undefined;

/**
 * Get Linter class
 */
export function getLinter(): typeof eslint.Linter {
  return (cacheLinter ??= getLinterInternal());

  /** Internal */
  function getLinterInternal(): typeof eslint.Linter {
    if (semver.gte(eslint.Linter.version, "9.0.0-0")) {
      return eslint.Linter;
    }
    return getLinterClassFromLegacyLinter();
  }
}

/** Create Linter class from legacy Linter class */
function getLinterClassFromLegacyLinter(): typeof eslint.Linter {
  return class LinterFromLegacyLinter extends eslint.Linter {
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
