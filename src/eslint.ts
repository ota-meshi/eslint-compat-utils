import * as eslint from "eslint";
import * as semver from "semver";
import { convertConfigToRc } from "./lib/convert-config";

let cacheESLint: typeof eslint.ESLint | undefined,
  cacheLegacyESLint: typeof eslint.ESLint | undefined;
/**
 * Get ESLint class
 */
export function getESLint(): typeof eslint.ESLint {
  return (cacheESLint ??= getESLintInternal());

  /** Internal */
  function getESLintInternal(): typeof eslint.ESLint {
    if (semver.gte(eslint.Linter.version, "9.0.0-0")) {
      return eslint.ESLint;
    }
    return eslint.ESLint
      ? getESLintClassForV8()
      : getESLintClassForV8(getLegacyESLintClassFromCLIEngine());
  }
}
/**
 * Get LegacyESLint class
 */
export function getLegacyESLint(): typeof eslint.ESLint {
  return (cacheLegacyESLint ??= getLegacyESLintInternal());

  /** Internal */
  function getLegacyESLintInternal(): typeof eslint.ESLint {
    return (
      getUnsupported().LegacyESLint ||
      eslint.ESLint ||
      getLegacyESLintClassFromCLIEngine()
    );
  }

  /** Get "eslint/use-at-your-own-risk" */
  function getUnsupported() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
      return require("eslint/use-at-your-own-risk");
    } catch {
      return {};
    }
  }
}

/** Create compat ESLint class for eslint v8  */
function getESLintClassForV8(
  // eslint-disable-next-line @typescript-eslint/naming-convention -- class name
  BaseESLintClass = eslint.ESLint,
): typeof eslint.ESLint {
  return class ESLintForV8 extends BaseESLintClass {
    public static get version() {
      return BaseESLintClass.version;
    }

    public constructor(options: any) {
      super(adjustOptions(options));
    }
  };

  /** Adjust options */
  function adjustOptions(options: any) {
    const {
      baseConfig,
      overrideConfig: originalOverrideConfig,
      overrideConfigFile,
      ...newOptions
    } = options || {};

    if (baseConfig) {
      newOptions.baseConfig = convertConfigToRc(baseConfig);
    }
    if (originalOverrideConfig) {
      const { plugins, ...overrideConfig } = originalOverrideConfig;
      // Remove unsupported options
      delete overrideConfig.files;
      delete overrideConfig.processor;

      newOptions.overrideConfig = convertConfigToRc(overrideConfig);

      if (plugins) {
        newOptions.overrideConfig.plugins = Object.keys(plugins);
        newOptions.plugins = plugins;
      }
    }
    if (overrideConfigFile) {
      if (overrideConfigFile === true) {
        newOptions.useEslintrc = false;
      } else {
        newOptions.overrideConfigFile = overrideConfigFile;
      }
    }
    return newOptions;
  }
}

/** Create Legacy ESLint class from CLIEngine  */
function getLegacyESLintClassFromCLIEngine(): typeof eslint.ESLint {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- class name
  const CLIEngine = (eslint as any).CLIEngine;
  class ESLintForV6 {
    private readonly engine: any;

    public static get version(): string {
      return CLIEngine.version;
    }

    public constructor(options: eslint.ESLint.Options) {
      const {
        overrideConfig: { plugins, globals, rules, ...overrideConfig } = {
          plugins: [],
          globals: {},
          rules: {},
        },
        fix,
        reportUnusedDisableDirectives,
        plugins: pluginsMap,
        ...otherOptions
      } = options || {};

      const cliEngineOptions = {
        fix: Boolean(fix),
        reportUnusedDisableDirectives: reportUnusedDisableDirectives
          ? reportUnusedDisableDirectives !== "off"
          : undefined,
        ...otherOptions,

        globals: globals
          ? Object.keys(globals).filter((n) => globals[n])
          : undefined,
        plugins: plugins || [],
        rules: rules
          ? Object.fromEntries(
              Object.entries(rules).flatMap(([ruleId, opt]) =>
                opt ? [[ruleId, opt]] : [],
              ),
            )
          : undefined,
        ...overrideConfig,
      };
      this.engine = new CLIEngine(cliEngineOptions);

      for (const [name, plugin] of Object.entries(pluginsMap || {})) {
        this.engine.addPlugin(name, plugin);
      }
    }

    // eslint-disable-next-line @typescript-eslint/require-await -- ignore
    public async lintText(
      ...params: Parameters<eslint.ESLint["lintText"]>
    ): ReturnType<eslint.ESLint["lintText"]> {
      const result = this.engine.executeOnText(params[0], params[1]?.filePath);
      return result.results;
    }

    // eslint-disable-next-line @typescript-eslint/require-await -- ignore
    public async lintFiles(
      ...params: Parameters<eslint.ESLint["lintFiles"]>
    ): ReturnType<eslint.ESLint["lintFiles"]> {
      const result = this.engine.executeOnFiles(
        Array.isArray(params[0]) ? params[0] : [params[0]],
      );
      return result.results;
    }

    // eslint-disable-next-line @typescript-eslint/require-await -- ignore
    public static async outputFixes(
      ...params: Parameters<(typeof eslint.ESLint)["outputFixes"]>
    ): ReturnType<(typeof eslint.ESLint)["outputFixes"]> {
      return CLIEngine.outputFixes({
        results: params[0],
      } as any);
    }
  }

  return ESLintForV6 as any;
}
