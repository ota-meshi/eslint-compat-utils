import * as eslint from "eslint";

/**
 * Get ESLint class
 */
export function getESLint(): typeof eslint.ESLint {
  return eslint.ESLint ?? getESLintClassForV6();
}

/** @returns {typeof eslint.ESLint} */
function getESLintClassForV6() {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- calss name
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

      /** @type {eslint.CLIEngine.Options} */
      const newOptions = {
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
      this.engine = new CLIEngine(newOptions);

      for (const [name, plugin] of Object.entries(pluginsMap || {})) {
        this.engine.addPlugin(name, plugin);
      }
    }

    public lintText(
      ...params: Parameters<eslint.ESLint["lintText"]>
    ): ReturnType<eslint.ESLint["lintText"]> {
      const result = this.engine.executeOnText(params[0], params[1]?.filePath);
      return result.results;
    }
  }

  return ESLintForV6;
}
