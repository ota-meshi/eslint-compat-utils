import * as eslint from "eslint";
import * as semver from "semver";
import { convertConfigToRc } from "./lib/convert-config";
import { getUnsupported } from "./lib/get-unsupported";

let cacheRuleTester: typeof eslint.RuleTester | undefined;

/**
 * Get RuleTester class
 */
export function getRuleTester(): typeof eslint.RuleTester {
  return (cacheRuleTester ??= getRuleTesterInternal());

  /** Internal */
  function getRuleTesterInternal(): typeof eslint.RuleTester {
    if (semver.gte(eslint.Linter.version, "9.0.0-0")) {
      return eslint.RuleTester;
    }
    const flatRuleTester = getUnsupported().FlatRuleTester;
    return flatRuleTester
      ? patchForV8FlatRuleTester(flatRuleTester)
      : getRuleTesterClassFromLegacyRuleTester();
  }
}

/**
 * Apply patch to FlatRuleTester class
 */
function patchForV8FlatRuleTester(flatRuleTester: typeof eslint.RuleTester) {
  return class RuleTesterWithPatch extends flatRuleTester {
    public constructor(options: any) {
      super(patchConfig(options));
    }
  };

  /** Apply patch to config */
  function patchConfig(config: any) {
    return {
      files: ["**/*.*"],
      ...config,
    };
  }
}

/**
 * Create RuleTester class from legacy RuleTester class
 */
function getRuleTesterClassFromLegacyRuleTester() {
  return class RuleTesterForV8 extends eslint.RuleTester {
    public constructor(options: any) {
      const defineRules: [string, eslint.Rule.RuleModule][] = [];
      super(
        convertConfigToRc(options, {
          defineRule(...args) {
            defineRules.push(args);
          },
        }),
      );
      for (const args of defineRules) {
        // @ts-expect-error -- linter property
        this.linter?.defineRule(...args);
      }
    }

    public run(
      name: string,
      rule: eslint.Rule.RuleModule,
      tests: {
        valid?: (string | eslint.RuleTester.ValidTestCase)[] | undefined;
        invalid?: eslint.RuleTester.InvalidTestCase[] | undefined;
      },
    ) {
      super.run(name, rule, {
        valid: (tests.valid || []).map((test) =>
          typeof test === "string" ? test : (convertConfigToRc(test) as any),
        ),
        invalid: (tests.invalid || []).map(
          (test) => convertConfigToRc(test) as any,
        ),
      });
    }
  };
}
