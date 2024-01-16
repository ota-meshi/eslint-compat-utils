import * as eslint from "eslint";
import * as semver from "semver";
import { convertConfigToRc } from "./lib/convert-config";
import { getUnsupported } from "./lib/get-unsupported";

let cacheRuleTester: typeof eslint.RuleTester | undefined;
let cachePrefix = "";

/**
 * Get RuleTester class
 */
export function getRuleTester(): typeof eslint.RuleTester {
  return (cacheRuleTester ??= getRuleTesterInternal());

  /** Internal */
  function getRuleTesterInternal(): typeof eslint.RuleTester {
    if (semver.gte(eslint.Linter.version, "9.0.0-0")) {
      cachePrefix = "rule-to-test/";
      return eslint.RuleTester;
    }
    const flatRuleTester = getUnsupported().FlatRuleTester;
    if (flatRuleTester) {
      cachePrefix = "rule-to-test/";
      return patchForV8FlatRuleTester(flatRuleTester);
    }
    return getRuleTesterClassFromLegacyRuleTester();
  }
}

/**
 * Get the prefix of the ruleId used in the rule tester.
 */
export function getRuleIdPrefix(): string {
  getRuleTester();
  return cachePrefix;
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
    private readonly defaultProcessor: any;

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
      this.defaultProcessor = options.processor;
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
          typeof test === "string"
            ? test
            : convert(test, this.defaultProcessor),
        ),
        invalid: (tests.invalid || []).map((test) =>
          convert(test, this.defaultProcessor),
        ),
      });
    }
  };

  /** Convert config to rc */
  function convert(config: any, defaultProcessor: any): any {
    const processor = config.processor || defaultProcessor;
    const converted = convertConfigToRc(config);

    if (!processor) {
      return converted;
    }
    return {
      ...converted,
      filename: {
        ...(config.filename != null ? { filename: config.filename } : {}),
        ...processor,
      },
    };
  }
}
