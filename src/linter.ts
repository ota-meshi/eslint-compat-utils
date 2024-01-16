import * as eslint from "eslint";
import * as semver from "semver";
import { convertConfigToRc } from "./lib/convert-config";
import { convertOptionToLegacy } from "./lib/convert-option";

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
      const { processor, ...otherConfig } = config || {};
      const newConfig = convertConfigToRc(otherConfig, this);
      const newOption = convertOptionToLegacy(processor, option, config || {});
      return super.verify(code, newConfig as any, newOption as any);
    }
  };
}
