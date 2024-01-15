import type * as eslint from "eslint";
import type { LinterConfigForV8 } from "../v8-props";
import { createRequire } from "module";

/** Convert to eslintrc config from v9 config  */
export function convertConfigToRc(
  config: eslint.Linter.FlatConfig | eslint.Linter.FlatConfig[],
  linter?: eslint.Linter,
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
      ...(ecmaVersion ? { ecmaVersion } : { ecmaVersion: "latest" }),
      ...(sourceType ? { sourceType } : { sourceType: "module" }),
      ...languageOptions,
      ...parserOptions,
    };
    if (globals) {
      (newConfig as LinterConfigForV8).globals = {
        ...(newConfig as LinterConfigForV8).globals,
        ...globals,
      };
    }
    if (parser) {
      const parserName = getParserName(parser);
      (newConfig as LinterConfigForV8).parser = parserName;
      linter?.defineParser(parserName, parser);
    }
  }
  if (plugins) {
    for (const [pluginName, plugin] of Object.entries(plugins)) {
      for (const [ruleName, rule] of Object.entries(plugin.rules || {})) {
        linter?.defineRule(`${pluginName}/${ruleName}`, rule as any);
      }
    }
  }
  (newConfig as LinterConfigForV8).env = {
    ...(newConfig as LinterConfigForV8).env,
    es6: true,
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

/** Get module */
function safeRequire(name: string) {
  try {
    return createRequire(`${process.cwd()}/__placeholder__.js`)(name);
  } catch {
    return undefined;
  }
}

/** Get module path */
function safeRequireResolve(name: string) {
  try {
    return createRequire(`${process.cwd()}/__placeholder__.js`).resolve(name);
  } catch {
    return name;
  }
}
