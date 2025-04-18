import * as eslint from "eslint";
import * as semver from "semver";
import type * as eslintUnsupportedApi from "eslint/use-at-your-own-risk";
import { convertConfigToRc } from "./lib/convert-config";
import { getUnsupported } from "./lib/get-unsupported";
import type { LinterConfigForV8 } from "./v8-props";

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;

type ESLintType = typeof eslint.ESLint;

type LegacyESLintType = typeof eslintUnsupportedApi.LegacyESLint;

export type LegacyESLint = IfAny<
  LegacyESLintType,
  ESLintType,
  LegacyESLintType
>;

type OverrideConfig = NonNullable<LinterConfigForV8["overrides"]>[number];

let cacheESLint: ESLintType | undefined,
  cacheLegacyESLint: LegacyESLint | undefined;
/**
 * Get ESLint class
 */
export function getESLint(): ESLintType {
  return (cacheESLint ??= getESLintInternal());

  /** Internal */
  function getESLintInternal(): ESLintType {
    if (semver.gte(eslint.Linter.version, "9.0.0-0")) {
      return eslint.ESLint;
    }
    return (
      getUnsupported().FlatESLint ||
      (eslint.ESLint
        ? getESLintClassFromLegacyESLint(
            eslint.ESLint as unknown as LegacyESLint,
          )
        : getESLintClassFromLegacyESLint(getLegacyESLintClassFromCLIEngine()))
    );
  }
}
/**
 * Get LegacyESLint class
 */
export function getLegacyESLint(): LegacyESLint {
  return (cacheLegacyESLint ??= getLegacyESLintInternal());

  /** Internal */
  function getLegacyESLintInternal(): LegacyESLint {
    return (
      getUnsupported().LegacyESLint ||
      eslint.ESLint ||
      getLegacyESLintClassFromCLIEngine()
    );
  }
}

/** Create compat ESLint class from legacy ESLint class */
function getESLintClassFromLegacyESLint(
  legacyESLintClass: LegacyESLint,
): ESLintType {
  return class ESLintFromLegacyESLint extends legacyESLintClass {
    public static configType = "flat" as any;

    public static readonly defaultConfig: [];

    public static get version() {
      return legacyESLintClass.version;
    }

    public constructor(options: any) {
      super(adjustOptions(options));
    }

    public findConfigFile(): Promise<string | undefined> {
      throw new Error("unimplemented");
    }
  };

  /** Adjust options */
  function adjustOptions(options: any) {
    const {
      baseConfig: originalBaseConfig,
      overrideConfig: originalOverrideConfig,
      overrideConfigFile,
      ...newOptions
    } = options || {};

    if (originalBaseConfig) {
      const [baseConfig, plugins] = convertConfig(originalBaseConfig);
      newOptions.baseConfig = baseConfig;
      if (plugins) {
        newOptions.plugins = plugins;
      }
    }
    if (originalOverrideConfig) {
      const [overrideConfig, plugins] = convertConfig(originalOverrideConfig);
      newOptions.overrideConfig = overrideConfig;
      if (plugins) {
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

  /** Convert */
  function convertConfig(config: any) {
    const pluginDefs = {};
    const newConfigs = [];
    for (const configItem of Array.isArray(config) ? config : [config]) {
      const { plugins, ...otherConfig } = configItem;
      // Remove unsupported options
      // delete otherConfig.files;
      if (typeof otherConfig.processor !== "string")
        // Remove unsupported options
        delete otherConfig.processor;

      const newConfig: OverrideConfig = {
        files: ["**/*.*", "*.*", "**/*", "*"],
        ...convertConfigToRc(otherConfig),
      };

      if (plugins) {
        newConfig.plugins = Object.keys(plugins);
      }
      Object.assign(pluginDefs, plugins);
      newConfigs.push(newConfig);
    }

    return [{ overrides: newConfigs }, pluginDefs];
  }
}

/** Create Legacy ESLint class from CLIEngine  */
function getLegacyESLintClassFromCLIEngine(): LegacyESLint {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- class name
  const CLIEngine = (eslint as any).CLIEngine;
  class LegacyESLintFromCLIEngine {
    private readonly engine: any;

    public static get version(): string {
      return CLIEngine.version;
    }

    public constructor(options: eslint.ESLint.LegacyOptions) {
      const {
        overrideConfig: {
          plugins,
          globals,
          rules,
          overrides,
          ...overrideConfig
        } = {
          plugins: [],
          globals: {},
          rules: {},
          overrides: [],
        },
        fix,
        reportUnusedDisableDirectives,
        plugins: pluginsMap,
        ...otherOptions
      } = options || {};

      const cliEngineOptions = {
        baseConfig: {
          ...(overrides
            ? {
                overrides,
              }
            : {}),
        },
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
      ...params: Parameters<ESLintType["outputFixes"]>
    ): ReturnType<ESLintType["outputFixes"]> {
      return CLIEngine.outputFixes({
        results: params[0],
      } as any);
    }
  }

  return LegacyESLintFromCLIEngine as any;
}
