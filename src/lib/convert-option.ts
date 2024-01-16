import type * as eslint from "eslint";

/** Convert to legacy verify option  */
export function convertOptionToLegacy(
  processor: string | eslint.Linter.Processor | undefined,
  verifyOption: string | eslint.Linter.LintOptions | undefined,
  config: eslint.Linter.FlatConfig,
): string | eslint.Linter.LintOptions | undefined {
  if (processor == null) return verifyOption;
  if (typeof processor === "string") {
    return convertOptionToLegacy(
      findProcessor(processor, config),
      verifyOption,
      config,
    );
  }

  const filename =
    (typeof verifyOption === "string"
      ? verifyOption
      : verifyOption?.filename) ?? "<input>";

  /** preprocess for linter */
  const preprocess = function (code: string) {
    const result = processor.preprocess?.(code, filename);
    return result ? (result as string[]) : [code];
  };
  /** postprocess for linter */
  const postprocess = function (messages: eslint.Linter.LintMessage[][]) {
    const result = processor.postprocess?.(messages, filename);
    return result ? result : messages[0];
  };

  if (verifyOption == null) {
    return { preprocess, postprocess };
  }
  if (typeof verifyOption === "string") {
    return { filename: verifyOption, preprocess, postprocess };
  }
  return { ...verifyOption, preprocess, postprocess };
}

/** Find processor by processor name */
function findProcessor(processor: string, config: eslint.Linter.FlatConfig) {
  let pluginName: string, processorName: string;

  const splitted = processor.split("/")[0];
  if (splitted.length === 2) {
    pluginName = splitted[0];
    processorName = splitted[1];
  } else if (splitted.length === 3 && splitted[0].startsWith("@")) {
    pluginName = `${splitted[0]}/${splitted[1]}`;
    processorName = splitted[2];
  } else {
    throw new Error(`Could not resolve processor: ${processor}`);
  }

  const plugin = config.plugins?.[pluginName];

  const resolved = plugin?.processors?.[processorName];
  if (!resolved) {
    throw new Error(`Could not resolve processor: ${processor}`);
  }
  return resolved;
}
