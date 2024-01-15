import type { Linter, Rule } from "eslint";

/**
 * Parser options.
 */
interface ParserOptions {
  ecmaVersion?: number | "latest" | undefined;
  sourceType?: "script" | "module" | "commonjs" | undefined;
  ecmaFeatures?:
    | {
        globalReturn?: boolean | undefined;
        impliedStrict?: boolean | undefined;
        jsx?: boolean | undefined;
        experimentalObjectRestSpread?: boolean | undefined;
        [key: string]: any;
      }
    | undefined;
  [key: string]: any;
}
/**
 * The rules config object is a key/value map of rule names and their severity and options.
 */
interface RulesRecord {
  [rule: string]: any;
}

interface BaseConfig {
  $schema?: string | undefined;
  rules?: Partial<RulesRecord> | undefined;
  env?: { [name: string]: boolean } | undefined;
  extends?: string | string[] | undefined;
  globals?:
    | {
        [name: string]:
          | boolean
          | "off"
          | "readonly"
          | "readable"
          | "writable"
          | "writeable";
      }
    | undefined;
  noInlineConfig?: boolean | undefined;
  overrides?:
    | (BaseConfig & {
        excludedFiles?: string | string[] | undefined;
        files: string | string[];
      })[]
    | undefined;
  parser?: string | undefined;
  parserOptions?: ParserOptions | undefined;
  plugins?: string[] | undefined;
  processor?: string | undefined;
  reportUnusedDisableDirectives?: boolean | undefined;
  settings?: { [name: string]: any } | undefined;
}

/**
 * ESLint configuration.
 */
export interface LinterConfigForV8 extends BaseConfig {
  ignorePatterns?: string | string[] | undefined;
  root?: boolean | undefined;
}
export interface ESLintOptionsForV8 {
  // File enumeration
  cwd?: string | undefined;
  errorOnUnmatchedPattern?: boolean | undefined;
  extensions?: string[] | undefined;
  globInputPaths?: boolean | undefined;
  ignore?: boolean | undefined;
  ignorePath?: string | undefined;

  // Linting
  allowInlineConfig?: boolean | undefined;
  baseConfig?: LinterConfigForV8 | undefined;
  overrideConfig?: LinterConfigForV8 | undefined;
  overrideConfigFile?: string | undefined;
  plugins?: Record<string, Plugin> | undefined;
  reportUnusedDisableDirectives?: Linter.StringSeverity | undefined;
  resolvePluginsRelativeTo?: string | undefined;
  rulePaths?: string[] | undefined;
  useEslintrc?: boolean | undefined;

  // Autofix
  fix?: boolean | ((message: Linter.LintMessage) => boolean) | undefined;
  fixTypes?: Rule.RuleMetaData["type"][] | undefined;

  // Cache-related
  cache?: boolean | undefined;
  cacheLocation?: string | undefined;
  cacheStrategy?: "content" | "metadata" | undefined;
}
