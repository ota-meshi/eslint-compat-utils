import * as eslint from "eslint";
import * as semver from "semver";
import type { LinterConfigForV8 } from "../v8-props";
import { safeRequire, safeRequireResolve } from "./require";

/** Convert to eslintrc config from v9 config  */
export function convertConfigToRc(
  config: eslint.Linter.FlatConfig | eslint.Linter.FlatConfig[],
  linter?: {
    defineRule?: (typeof eslint.Linter)["prototype"]["defineRule"];
    defineParser?: (typeof eslint.Linter)["prototype"]["defineParser"];
  },
): LinterConfigForV8 {
  if (Array.isArray(config)) {
    throw new Error("Array config is not supported.");
  }
  const {
    languageOptions: originalLanguageOptions,
    plugins,
    ...newConfig
  } = config;
  if (originalLanguageOptions) {
    const {
      parser,
      globals,
      parserOptions,
      ecmaVersion,
      sourceType,
      ...languageOptions
    } = originalLanguageOptions;
    (newConfig as LinterConfigForV8).parserOptions = {
      ...(!ecmaVersion || ecmaVersion === "latest"
        ? { ecmaVersion: getLatestEcmaVersion() }
        : { ecmaVersion }),
      ...(sourceType ? { sourceType } : { sourceType: "module" }),
      ...languageOptions,
      ...parserOptions,
      ...(newConfig as LinterConfigForV8).parserOptions,
    };
    if (globals) {
      (newConfig as LinterConfigForV8).globals = {
        ...globals,
        ...(newConfig as LinterConfigForV8).globals,
      };
    }
    if (parser && !(newConfig as LinterConfigForV8).parser) {
      const parserName = getParserName(parser);
      (newConfig as LinterConfigForV8).parser = parserName;
      linter?.defineParser?.(parserName, parser);
    }
  }
  if (plugins) {
    for (const [pluginName, plugin] of Object.entries(plugins)) {
      for (const [ruleName, rule] of Object.entries(plugin.rules || {})) {
        linter?.defineRule?.(`${pluginName}/${ruleName}`, rule as any);
      }
    }
  }
  (newConfig as LinterConfigForV8).env = {
    es6: true,
    ...(newConfig as LinterConfigForV8).env,
  };
  return newConfig as LinterConfigForV8;
}

/** Resolve parser name */
function getParserName(parser: any) {
  const name = parser.meta?.name || parser.name;
  if (name === "typescript-eslint/parser") {
    return safeRequireResolve("@typescript-eslint/parser");
  } else if (
    name == null &&
    parser === safeRequire("@typescript-eslint/parser")
  )
    return safeRequireResolve("@typescript-eslint/parser");
  return safeRequireResolve(name);
}

/** Get latest ecmaVersion */
function getLatestEcmaVersion() {
  const eslintVersion = eslint.Linter.version;
  return semver.gte(eslintVersion, "8.0.0")
    ? "latest"
    : semver.gte(eslintVersion, "7.8.0")
      ? 2021
      : semver.gte(eslintVersion, "6.2.0")
        ? 2020
        : semver.gte(eslintVersion, "5.0.0")
          ? 2019
          : 2018;
}
