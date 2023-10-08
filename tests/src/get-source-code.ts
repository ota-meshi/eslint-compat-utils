import assert from "node:assert";
import type * as ESTree from "estree";
import { getESLint, getSourceCode } from "../../src";
import { Linter } from "eslint";

describe("getSourceCode", () => {
  describe("getAncestors", () => {
    it("The result of getAncestors should match your expectations.", () => {
      const linter = new Linter();
      let ancestors: ESTree.Node[] = [];
      linter.defineRule("test-rule", {
        create(context) {
          return {
            "Identifier[name=me]"(node: ESTree.Identifier) {
              ancestors = getSourceCode(context).getAncestors(node);
            },
          };
        },
      });
      linter.verify("if (true) { var me = 1; }", {
        rules: {
          "test-rule": "error",
        },
      });

      assert.strictEqual(ancestors.length, 5);
      assert.deepStrictEqual(
        ancestors.map((n) => n.type),
        [
          "Program",
          "IfStatement",
          "BlockStatement",
          "VariableDeclaration",
          "VariableDeclarator",
        ],
      );
    });
  });
});
