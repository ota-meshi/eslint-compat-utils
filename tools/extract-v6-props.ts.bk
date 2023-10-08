import * as eslintV6 from "eslint_v6";
import path from "node:path";
import { writeAndFormat } from "./write";
const builtinKeys = new Set(getPropertyNames({}));

const sourceCode = new eslintV6.SourceCode("", {
  type: "Program",
  tokens: [],
  comments: [],
  loc: {},
  range: [0, 0],
} as never);

const keys = new Set(
  getPropertyNames(sourceCode).filter((key) => !builtinKeys.has(key)),
);

void writeAndFormat(
  path.join(__dirname, "../src/v6-props.ts"),
  `export type V6SourceCodeProps = ${[...keys]
    .map((k) => JSON.stringify(k))
    .join("|")};`,
);

function getPropertyNames(object: unknown) {
  const result = [];
  for (let obj = object; obj; obj = Object.getPrototypeOf(obj)) {
    result.push(...Object.getOwnPropertyNames(obj));
  }
  return result;
}
